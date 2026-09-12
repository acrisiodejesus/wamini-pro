import { NextRequest } from 'next/server';
import { put } from '@vercel/blob';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const payload = await getAuthPayload(req);
    if (!payload) return apiError('Não autenticado', 401);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return apiError('Nenhum ficheiro fornecido', 400);
    }

    // Gerar nome único
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const pathname = `uploads/${uniqueSuffix}_${originalName}`;

    // Upload para Vercel Blob
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Identificar tipo basico
    let type = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    if (file.type.startsWith('video/')) type = 'video';

    return apiOk({ 
      url: blob.url,
      type: type,
      name: file.name
    }, 201);
  } catch (err: any) {
    console.error('File upload error:', err);
    return apiError('Erro a gravar anexo', 500);
  }
}
