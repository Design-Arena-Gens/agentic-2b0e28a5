import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text: string = body?.text;
    const voice = body?.voice ?? 'en-US';
    const speed = body?.speed ?? 1;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text prompt is required.' },
        { status: 400 }
      );
    }

    const { getAudioUrl } = await import('google-tts-api');

    const url = getAudioUrl(text.trim(), {
      lang: voice.toLowerCase(),
      slow: speed < 1
    });

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Voice synthesis failed.');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:audio/mp3;base64,${base64}`;

    const estimatedDuration = Math.max(
      4,
      Math.round(text.split(/\s+/).length * 0.45)
    );

    return NextResponse.json({
      dataUrl,
      duration: estimatedDuration
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Unable to synthesize voice right now.' },
      { status: 500 }
    );
  }
}
