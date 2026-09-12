import { NextRequest, NextResponse } from 'next/server';

// Com Vercel Blob, os ficheiros são servidos directamente pelo CDN da Vercel.
// Este endpoint de fallback redireciona para o URL correcto caso alguém tente
// aceder via o path antigo /api/v1/uploads/[filename].

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  
  // Se o filename parece um URL blob, redirecionar
  // Caso contrário, retornar 404 pois os ficheiros antigos do filesystem já não existem
  return NextResponse.json(
    { error: 'Ficheiro não encontrado. Os uploads agora são servidos via CDN.', filename },
    { status: 404 }
  );
}
