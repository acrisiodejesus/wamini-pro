// GET /api/v1/products — listar produtos
// POST /api/v1/products — criar produto
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryQuery = searchParams.get('category') || 'Tudo';
    const search = searchParams.get('search') || '';

    const payload = await getAuthPayload(req);
    const db = await getDb();
    
    // Base subqueries with unified columns and unique IDs - Filtering deleted items
    const productBase = `
      SELECT ('product_' || p.id) as id, p.name as name, p.quantity as quantity, p.price as price, p.photo as photo, p.category as category, p.location as location, 'product' as item_type, u.name as seller_name, p.created_at as created_at
      FROM products p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.deleted_at IS NULL
    `;
    const inputBase = `
      SELECT ('input_' || i.id) as id, i.name as name, i.quantity as quantity, i.price as price, i.photo as photo, 'Insumos' as category, NULL as location, 'input' as item_type, u.name as seller_name, i.created_at as created_at
      FROM inputs i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.deleted_at IS NULL
    `;
    const transportBase = `
      SELECT ('transport_' || t.id) as id, t.name as name, NULL as quantity, t.price_per_km as price, t.photo as photo, 'Transporte' as category, t.location as location, 'transport' as item_type, u.name as seller_name, t.created_at as created_at
      FROM transports t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.deleted_at IS NULL
    `;

    let subQueries: string[] = [];
    let queryParams: any[] = [];

    // Filter selection
    if (categoryQuery === 'Tudo') {
      subQueries = [productBase, inputBase, transportBase];
    } else if (categoryQuery === 'Produtos') {
      subQueries = [productBase];
    } else if (categoryQuery === 'Insumos') {
      subQueries = [inputBase];
    } else if (categoryQuery === 'Transporte') {
      subQueries = [transportBase];
    } else {
      // Custom category from products table
      subQueries = [`SELECT * FROM (${productBase}) WHERE category = ?`];
      queryParams.push(categoryQuery);
    }

    // Apply search to each subquery by wrapping them
    const finalSubQueries = subQueries.map(base => {
      if (!search) return base;
      
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
      
      return `SELECT * FROM (${base}) WHERE (name LIKE ? OR category LIKE ?)`;
    });

    const unionQuery = finalSubQueries.join(' UNION ALL ');
    const finalQuery = `SELECT * FROM (${unionQuery}) ORDER BY created_at DESC`;
    
    const result = await db.execute({ sql: finalQuery, args: queryParams });

    // COMPLIANCE: Auditing read access
    await recordAuditLog(db, req, {
      actor_id: (payload as any)?._testLocalId || (payload as any)?.userId || null,
      action: 'ACCESS',
      entity_type: 'products_feed',
      entity_id: null,
      old_data: { filters: { category: categoryQuery, search } },
      new_data: { count: result.rows.length }
    });

    return apiOk(result.rows);
  } catch (err: any) {
    console.error('Products GET error:', err);
    return apiError(`Erro interno do servidor: ${err.message}`, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const body = await req.json();
    const { name, quantity, price, photo, category, location } = body;

    if (!name || price === undefined) {
      return apiError('Nome e preço são obrigatórios', 400);
    }

    const fallbackImages: Record<string, string> = {
      tomate: '/products/tomate.png',
      milho: '/products/milho.png',
      feijao: '/products/feijao.png',
      arroz: '/products/arroz.png',
      mandioca: '/products/mandioca.png',
      batata: '/products/batata_doce.png',
      amendoim: '/products/amendoim.png',
      caju: '/products/caju.png',
      gergelim: '/products/gergelim.png',
      soja: '/products/soja.png',
      banana: '/products/banana.png',
      papaia: '/products/papaia.png',
      default: '/products/milho.png'
    };

    let finalPhoto = photo ?? null;
    if (!finalPhoto) {
      const lowerName = name.toLowerCase();
      const match = Object.keys(fallbackImages).find(key => lowerName.includes(key));
      finalPhoto = match ? fallbackImages[match] : fallbackImages['default'];
    }

    const db = await getDb();
    const actorId = (payload as any)._testLocalId || (payload as any).userId;
    const result = await db.execute({
      sql: `INSERT INTO products (name, quantity, price, photo, category, location, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [name, quantity ?? 0, price, finalPhoto, category ?? 'PRODUTOS', location ?? null, actorId],
    });

    const productId = Number(result.lastInsertRowid);

    // COMPLIANCE: Auditing creation
    await recordAuditLog(db, req, {
      actor_id: actorId,
      action: 'CREATE',
      entity_type: 'products',
      entity_id: productId,
      new_data: { name, quantity, price, category, location }
    });

    return apiOk({ message: 'Produto criado com sucesso', product_id: productId }, 201);
  } catch (err: any) {
    console.error('Products POST error:', err);
    return apiError('Erro interno do servidor', 500);
  }
}
