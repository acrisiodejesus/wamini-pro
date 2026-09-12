import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, phoneNumber, text } = await req.json();
    
    // Standard USSD session trail (e.g. "1*1*1*50*1500")
    const parts = text ? text.split('*').filter((p: string) => p !== '') : [];
    
    let response = "";
    
    if (parts.length === 0) {
      // Main Menu
      response = "CON Bem-vindo ao Wamini\n1. Vender\n2. Comprar\n3. Preços de Mercado";
    } else if (parts[0] === '1') {
      // PATH: VENDER
      if (parts.length === 1) {
        response = "CON O que deseja vender?\n1. Produto Agrícola\n2. Insumo";
      } else if (parts[1] === '1') {
        // SELL -> PRODUCT
        if (parts.length === 2) {
          response = "CON Escolha o produto:\n1. Milho Branco\n2. Arroz Carolino\n3. Tomate Vermelho\n4. Feijão Manteiga";
        } else if (parts.length === 3) {
          const productName = getProductName(parts[2]);
          response = `CON Quantidade de ${productName} (em kg):`;
        } else if (parts.length === 4) {
          const productName = getProductName(parts[2]);
          response = `CON Preço de ${productName} p/kg (em MT):`;
        } else if (parts.length === 5) {
          const productName = getProductName(parts[2]);
          const qty = parts[3];
          const price = parts[4];
          response = `CON Confirmar venda?\n${qty}kg de ${productName}\nPreço: ${price}MT/kg\n1. Sim\n2. Não`;
        } else if (parts.length === 6) {
          if (parts[5] === '1') {
            await createProductViaUssd(phoneNumber, parts[2], parts[3], parts[4]);
            response = "END Venda registada com sucesso! O seu produto já está no Mercado Wamini.";
          } else {
            response = "END Operação cancelada.";
          }
        } else {
          response = "END Opção inválida.";
        }
      } else if (parts[1] === '2') {
        response = "END Venda de insumos via USSD em breve.";
      } else {
        response = "END Opção inválida.";
      }
    } else if (parts[0] === '2') {
      // PATH: COMPRAR
      response = "END Navegue para o mercado no app ou site para comprar e negociar.";
    } else if (parts[0] === '3') {
      // PATH: PREÇOS
      response = "END Preços em Nampula:\nTomate: 70MT/kg\nMilho: 45MT/kg\nFeijão: 120MT/kg";
    } else {
      response = "END Opção inválida.";
    }

    return new Response(response, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err: any) {
    console.error('USSD Error:', err);
    return new Response("END Erro no processamento USSD. Tente novamente.", {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

function getProductName(id: string) {
  const names: Record<string, string> = {
    '1': 'Milho Branco',
    '2': 'Arroz Carolino',
    '3': 'Tomate Vermelho',
    '4': 'Feijão Manteiga'
  };
  return names[id] || 'Produto';
}

async function createProductViaUssd(mobile: string, productId: string, qty: string, price: string) {
  const db = await getDb();
  
  // Clean phone number (remove +258 if present)
  const cleanMobile = mobile.replace('+258', '');
  
  // Find user
  const result = await db.execute({
    sql: "SELECT id FROM users WHERE mobile_number = ?",
    args: [cleanMobile],
  });
  const user = result.rows[0] as any;
  if (!user) {
    // If not found, use user 1 as default (fallback for simulation)
    console.warn(`USSD: User with mobile ${cleanMobile} not found. Using ID 1.`);
  }
  const userId = user ? Number(user.id) : 1;

  const category = 'Produtos';
  const name = getProductName(productId);
  const photo = `/products/${productId === '1' ? 'milho' : productId === '3' ? 'tomate' : 'feijao'}.png`;

  await db.execute({
    sql: `INSERT INTO products (name, quantity, price, photo, category, location, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [name, parseFloat(qty), parseFloat(price), photo, category, 'Posto Remoto', userId],
  });
}
