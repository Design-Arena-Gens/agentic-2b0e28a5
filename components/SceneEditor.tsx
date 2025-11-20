'use client';

import { useState } from 'react';
import type { Scene } from '@/types/media';
import clsx from 'clsx';

type SceneEditorProps = {
  scenes: Scene[];
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => void;
  onDeleteScene: (sceneId: string) => void;
  onDuplicateScene: (sceneId: string) => void;
  onReorderScene: (sceneId: string, direction: 'up' | 'down') => void;
  onGenerateImage: (scene: Scene) => Promise<void>;
  onGenerateVoice: (scene: Scene) => Promise<void>;
  busySceneId?: string | null;
  audioSceneId?: string | null;
};

export function SceneEditor({
  scenes,
  onUpdateScene,
  onDeleteScene,
  onDuplicateScene,
  onReorderScene,
  onGenerateImage,
  onGenerateVoice,
  busySceneId,
  audioSceneId
}: SceneEditorProps) {
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(
    scenes[0]?.id ?? null
  );

  const safeSelectedSceneId = scenes.some(
    (scene) => scene.id === selectedSceneId
  )
    ? selectedSceneId
    : scenes[0]?.id ?? null;

  const selectedScene =
    scenes.find((scene) => scene.id === safeSelectedSceneId) ?? scenes[0];

  return (
    <section className="card" style={{ display: 'flex', gap: '1.75rem' }}>
      <aside
        style={{
          width: '240px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        <div className="tag">Scene lineup</div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            maxHeight: '420px',
            overflowY: 'auto',
            paddingRight: '0.35rem'
          }}
        >
          {scenes.map((scene, index) => {
            const isSelected = scene.id === selectedScene?.id;

            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => setSelectedSceneId(scene.id)}
                className={clsx('card', isSelected && 'selected')}
                style={{
                  background: isSelected
                    ? 'rgba(56, 189, 248, 0.15)'
                    : 'rgba(15, 23, 42, 0.7)',
                  borderRadius: '1rem',
                  border: isSelected ? '1px solid var(--accent)' : undefined,
                  padding: '0.8rem',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.4rem',
                    fontSize: '0.9rem'
                  }}
                >
                  <span style={{ color: 'var(--muted)' }}>
                    Scene {index + 1}
                  </span>
                  <span
                    style={{
                      color: 'var(--muted)',
                      opacity: 0.75,
                      fontSize: '0.8rem'
                    }}
                  >
                    {scene.duration}s
                  </span>
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    lineHeight: 1.4
                  }}
                >
                  {scene.script.length > 120
                    ? `${scene.script.slice(0, 117)}…`
                    : scene.script}
                </div>
              </button>
            );
          })}
        </div>
      </aside>
      {selectedScene ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '1.5rem',
            width: '100%'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h2 style={{ margin: 0 }}>
                Scene {scenes.indexOf(selectedScene) + 1}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="button secondary"
                  onClick={() =>
                    onReorderScene(selectedScene.id, 'up')
                  }
                  disabled={scenes[0] === selectedScene}
                >
                  ↑
                </button>
                <button
                  className="button secondary"
                  onClick={() =>
                    onReorderScene(selectedScene.id, 'down')
                  }
                  disabled={
                    scenes[scenes.length - 1] === selectedScene
                  }
                >
                  ↓
                </button>
                <button
                  className="button secondary"
                  onClick={() => onDuplicateScene(selectedScene.id)}
                >
                  Duplicate
                </button>
                <button
                  className="button secondary"
                  onClick={() => {
                    onDeleteScene(selectedScene.id);
                    setSelectedSceneId(null);
                  }}
                  style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  Delete
                </button>
              </div>
            </div>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <span style={{ color: 'var(--muted)' }}>Narration</span>
              <textarea
                rows={6}
                value={selectedScene.script}
                onChange={(event) =>
                  onUpdateScene(selectedScene.id, {
                    script: event.target.value
                  })
                }
              />
            </label>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <span style={{ color: 'var(--muted)' }}>Visual direction</span>
              <textarea
                rows={3}
                value={selectedScene.imagePrompt}
                onChange={(event) =>
                  onUpdateScene(selectedScene.id, {
                    imagePrompt: event.target.value
                  })
                }
              />
            </label>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <span style={{ color: 'var(--muted)' }}>
                Scene duration: {selectedScene.duration}s
              </span>
              <input
                type="range"
                min={4}
                max={18}
                step={1}
                value={selectedScene.duration}
                onChange={(event) =>
                  onUpdateScene(selectedScene.id, {
                    duration: Number(event.target.value)
                  })
                }
              />
            </label>
          </div>
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.55)',
              borderRadius: '1.1rem',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                position: 'relative',
                paddingBottom: '56.25%',
                width: '100%',
                background: '#0b1120'
              }}
            >
              {selectedScene.imageUrl ? (
                <img
                  src={selectedScene.imageUrl}
                  alt={selectedScene.title}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--muted)'
                  }}
                >
                  No image yet
                </div>
              )}
            </div>
            <div
              style={{
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}
            >
              <button
                className="button"
                style={{ width: '100%' }}
                onClick={() => onGenerateImage(selectedScene)}
                disabled={busySceneId === selectedScene.id}
              >
                {busySceneId === selectedScene.id
                  ? 'Generating visual…'
                  : 'Generate visual'}
              </button>
              <button
                className="button secondary"
                style={{ width: '100%' }}
                onClick={() => onGenerateVoice(selectedScene)}
                disabled={audioSceneId === selectedScene.id}
              >
                {audioSceneId === selectedScene.id
                  ? 'Synthesizing voice…'
                  : selectedScene.audio
                    ? 'Regenerate voice'
                    : 'Generate voiceover'}
              </button>
              {selectedScene.audio ? (
                <audio
                  controls
                  src={selectedScene.audio.url}
                  style={{ width: '100%' }}
                  onLoadedMetadata={(event) =>
                    onUpdateScene(selectedScene.id, {
                      audio: {
                        ...selectedScene.audio!,
                        duration: event.currentTarget.duration
                      }
                    })
                  }
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted)'
          }}
        >
          Add a scene to begin editing.
        </div>
      )}
    </section>
  );
}
