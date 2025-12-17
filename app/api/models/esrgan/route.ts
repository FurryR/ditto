import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const modelPath = path.join(process.cwd(), 'noise0_scale2x.onnx');
    const modelBuffer = await fs.readFile(modelPath);

    return new NextResponse(modelBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="noise0_scale2x.onnx"',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error loading model:', error);
    return NextResponse.json(
      {
        error: 'Failed to load model',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
