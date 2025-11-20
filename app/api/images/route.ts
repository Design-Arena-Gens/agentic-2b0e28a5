import { NextResponse } from 'next/server';

const BASE_URL = 'https://image.pollinations.ai/prompt';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required.' },
        { status: 400 }
      );
    }

    const targetUrl = `${BASE_URL}/${encodeURIComponent(prompt)}`;
    const response = await fetch(targetUrl);

    if (!response.ok) {
      throw new Error('Image proxy failed.');
    }

    const contentType =
      response.headers.get('content-type') ?? 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ dataUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Unable to generate image at this time.' },
      { status: 500 }
    );
  }
}
