import { NextResponse } from 'next/server';

type Payload = {
  network?: string;
  token?: string;
  message?: string;
  assetUrl?: string;
};

const postToTwitter = async (token: string, message: string, assetUrl?: string) => {
  const body = {
    text: assetUrl ? `${message}\n${assetUrl}` : message
  };

  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(
      errorPayload?.error?.message ??
        errorPayload?.title ??
        'Twitter API rejected the request.'
    );
  }
};

const unsupported = (network: string) => {
  throw new Error(
    `Direct posting for ${network} is not implemented. Provide a custom webhook or extend the agent server route.`
  );
};

export async function POST(request: Request) {
  try {
    const payload: Payload = await request.json();
    const { network, token, message, assetUrl } = payload;

    if (!network || typeof network !== 'string') {
      return NextResponse.json(
        { error: 'Network identifier is required.' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Access token is required.' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required.' },
        { status: 400 }
      );
    }

    switch (network) {
      case 'twitter':
        await postToTwitter(token, message, assetUrl);
        break;
      case 'linkedin':
      case 'youtube':
      case 'tiktok':
        unsupported(network);
        break;
      default:
        throw new Error(`Unknown network ${network}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to post to social network.'
      },
      { status: 500 }
    );
  }
}
