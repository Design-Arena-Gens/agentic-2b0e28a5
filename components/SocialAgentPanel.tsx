'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { Scene, SocialNetwork, SocialPost } from '@/types/media';
import clsx from 'clsx';

type SocialAgentPanelProps = {
  renderedVideoUrl: string | null;
  scenes: Scene[];
};

type CredentialState = Partial<Record<SocialNetwork, string>>;

type PostComposerState = {
  network: SocialNetwork;
  message: string;
  scheduledFor: string;
};

const NETWORK_LABEL: Record<SocialNetwork, string> = {
  twitter: 'X / Twitter',
  youtube: 'YouTube Shorts',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn'
};

export function SocialAgentPanel({
  renderedVideoUrl,
  scenes
}: SocialAgentPanelProps) {
  const defaultMessage =
    scenes.length > 0
      ? `🎬 New drop: ${scenes[0].script.slice(0, 80)}…`
      : 'New video dropping today!';

  const [composer, setComposer] = useState<PostComposerState>({
    network: 'twitter',
    message: defaultMessage,
    scheduledFor: ''
  });
  const [credentials, setCredentials] = useState<CredentialState>({});
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const timers = useRef<Record<string, NodeJS.Timeout>>({});

  const canPost = useMemo(
    () => Boolean(composer.message.trim()) && Boolean(renderedVideoUrl),
    [composer.message, renderedVideoUrl]
  );

  const enqueuePost = (post: SocialPost) => {
    setPosts((state) => [...state, post]);

    if (post.scheduledFor) {
      const offset =
        new Date(post.scheduledFor).getTime() - new Date().getTime();
      if (offset > 0) {
        timers.current[post.id] = setTimeout(() => {
          dispatchPost({ ...post, status: 'posting' });
        }, offset);
        return;
      }
    }

    dispatchPost({ ...post, status: 'posting' });
  };

  const dispatchPost = async (post: SocialPost) => {
    setPosts((state) =>
      state.map((item) => (item.id === post.id ? post : item))
    );

    try {
      const token = credentials[post.network];
      if (!token) {
        throw new Error(
          `Missing access token for ${NETWORK_LABEL[post.network]}`
        );
      }

      const response = await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network: post.network,
          token,
          message: post.message,
          assetUrl: post.assetUrl
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error ?? 'Social network rejected the payload.'
        );
      }

      setPosts((state) =>
        state.map((item) =>
          item.id === post.id ? { ...post, status: 'posted' } : item
        )
      );
    } catch (postError) {
      setPosts((state) =>
        state.map((item) =>
          item.id === post.id
            ? {
                ...post,
                status: 'failed',
                error:
                  postError instanceof Error
                    ? postError.message
                    : 'Unexpected error posting to network.'
              }
            : item
        )
      );
    }
  };

  const handleComposeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!renderedVideoUrl) {
      return;
    }

    const post: SocialPost = {
      id: crypto.randomUUID(),
      network: composer.network,
      message: composer.message.trim(),
      assetUrl: renderedVideoUrl,
      scheduledFor: composer.scheduledFor || undefined,
      status: composer.scheduledFor ? 'pending' : 'posting'
    };

    enqueuePost(post);
  };

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      Object.values(activeTimers).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <section className="card" style={{ display: 'grid', gap: '1.25rem' }}>
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}
      >
        <div className="tag">Distribution agent</div>
        <h2 style={{ margin: 0 }}>Autopost the story</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Upload credentials for each network and queue posts with optional
          scheduling. The agent will ship the rendered video with your selected
          caption.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.75rem'
        }}
      >
        {(['twitter', 'youtube', 'tiktok', 'linkedin'] as SocialNetwork[]).map(
          (network) => (
            <label
              key={network}
              className="card"
              style={{
                border:
                  composer.network === network
                    ? '1px solid var(--accent)'
                    : undefined,
                background:
                  composer.network === network
                    ? 'rgba(56, 189, 248, 0.12)'
                    : 'rgba(15, 23, 42, 0.6)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{NETWORK_LABEL[network]}</span>
                <input
                  type="radio"
                  name="network"
                  value={network}
                  checked={composer.network === network}
                  onChange={() =>
                    setComposer((state) => ({ ...state, network }))
                  }
                />
              </div>
              <input
                type="password"
                placeholder="Access token / API key"
                value={credentials[network] ?? ''}
                onChange={(event) =>
                  setCredentials((state) => ({
                    ...state,
                    [network]: event.target.value
                  }))
                }
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                Stored locally. Required for programmatic posting.
              </span>
            </label>
          )
        )}
      </div>

      <form
        onSubmit={handleComposeSubmit}
        style={{ display: 'grid', gap: '0.75rem' }}
      >
        <textarea
          rows={3}
          value={composer.message}
          placeholder="Caption for your social post…"
          onChange={(event) =>
            setComposer((state) => ({ ...state, message: event.target.value }))
          }
        />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="datetime-local"
            value={composer.scheduledFor}
            onChange={(event) =>
              setComposer((state) => ({ ...state, scheduledFor: event.target.value }))
            }
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className={clsx('button', !canPost && 'disabled')}
            disabled={!canPost}
            style={{ opacity: canPost ? 1 : 0.65 }}
          >
            {composer.scheduledFor ? 'Schedule post' : 'Post now'}
          </button>
        </div>
      </form>

      <div style={{ display: 'grid', gap: '0.6rem' }}>
        <h3 style={{ margin: 0 }}>Queue</h3>
        {posts.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Queue is empty. Compose and schedule your first drop.
          </p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="card"
              style={{
                background: 'rgba(15, 23, 42, 0.45)',
                border:
                  post.status === 'failed'
                    ? '1px solid var(--danger)'
                    : post.status === 'posted'
                      ? '1px solid var(--success)'
                      : undefined
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <strong>{NETWORK_LABEL[post.network]}</strong>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  {post.status.toUpperCase()}
                </span>
              </div>
              <p style={{ marginBottom: '0.35rem' }}>{post.message}</p>
              {post.scheduledFor ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  Scheduled for{' '}
                  {new Date(post.scheduledFor).toLocaleString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
              ) : null}
              {post.error ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>
                  {post.error}
                </span>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
