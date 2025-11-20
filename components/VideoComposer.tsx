'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Scene } from '@/types/media';
import {
  getFFmpeg,
  fileFromDataUrl,
  fileFromRemote
} from '@/lib/ffmpeg-client';

type VideoComposerProps = {
  scenes: Scene[];
  onRendered?: (url: string) => void;
};

const formatSeconds = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export function VideoComposer({ scenes, onRendered }: VideoComposerProps) {
  const [isRendering, setIsRendering] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const totalDuration = useMemo(
    () => scenes.reduce((acc, scene) => acc + scene.duration, 0),
    [scenes]
  );

  const canRender = useMemo(
    () =>
      scenes.length > 0 &&
      scenes.every((scene) => Boolean(scene.imageUrl) && Boolean(scene.audio)),
    [scenes]
  );

  const handleRender = useCallback(async () => {
    if (!canRender) {
      setError('Every scene needs an image and voiceover before rendering.');
      return;
    }

    try {
      setIsRendering(true);
      setError(null);
      setStatus('Booting ffmpeg core');
      const ffmpeg = await getFFmpeg();

      setStatus('Preparing scene assets');
      const concatManifest: string[] = [];

      // Clear any previously generated files
      await ffmpeg.deleteFile('output.mp4').catch(() => undefined);

      await Promise.all(
        scenes.map(async (scene, index) => {
          const sceneIndex = String(index + 1).padStart(2, '0');
          const imageName = `image_${sceneIndex}.jpg`;
          const audioName = `audio_${sceneIndex}.mp3`;
          const segmentName = `segment_${sceneIndex}.mp4`;

          const imageSource = scene.imageUrl?.startsWith('data:')
            ? await fileFromDataUrl(scene.imageUrl)
            : await fileFromRemote(scene.imageUrl ?? '');
          const audioSource = scene.audio?.url?.startsWith('data:')
            ? await fileFromDataUrl(scene.audio.url)
            : await fileFromRemote(scene.audio?.url ?? '');

          await ffmpeg.writeFile(imageName, imageSource);
          await ffmpeg.writeFile(audioName, audioSource);

          setStatus(`Rendering segment ${index + 1}/${scenes.length}`);

          await ffmpeg.exec([
            '-loop',
            '1',
            '-i',
            imageName,
            '-i',
            audioName,
            '-c:v',
            'libx264',
            '-c:a',
            'aac',
            '-t',
            String(scene.duration),
            '-shortest',
            '-pix_fmt',
            'yuv420p',
            segmentName
          ]);

          concatManifest.push(`file '${segmentName}'`);
        })
      );

      const manifestContent = concatManifest.join('\n');
      await ffmpeg.writeFile('concat.txt', manifestContent);

      setStatus('Merging segments');
      await ffmpeg.exec([
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        'concat.txt',
        '-c',
        'copy',
        'output.mp4'
      ]);

      const fileData = await ffmpeg.readFile('output.mp4');
      const byteArray =
        fileData instanceof Uint8Array
          ? fileData
          : new TextEncoder().encode(fileData as string);
      const blob = new Blob([byteArray.buffer as ArrayBuffer], {
        type: 'video/mp4'
      });
      const url = URL.createObjectURL(blob);
      setVideoUrl((oldUrl) => {
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl);
        }
        return url;
      });
      setStatus('Ready');
      onRendered?.(url);
    } catch (renderError) {
      console.error(renderError);
      setError(
        renderError instanceof Error
          ? renderError.message
          : 'Rendering failed unexpectedly.'
      );
    } finally {
      setIsRendering(false);
    }
  }, [canRender, onRendered, scenes]);

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  return (
    <section className="card" style={{ display: 'grid', gap: '1.25rem' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div className="tag">Renderer agent</div>
          <h2 style={{ marginBottom: '0.35rem' }}>Compile the master video</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            {scenes.length} scenes • {formatSeconds(totalDuration)} total runtime
          </p>
        </div>
        <button
          className="button"
          onClick={handleRender}
          disabled={!canRender || isRendering}
          style={{ opacity: !canRender || isRendering ? 0.65 : 1 }}
        >
          {isRendering ? 'Rendering…' : 'Render video'}
        </button>
      </header>
      {!canRender ? (
        <div
          className="badge"
          style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
        >
          Every scene needs a generated image and voice track before the agent
          can render the final video.
        </div>
      ) : null}
      {status ? (
        <div className="badge">
          <span>Status: {status}</span>
        </div>
      ) : null}
      {error ? (
        <div
          className="badge"
          style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
        >
          {error}
        </div>
      ) : null}
      {videoUrl ? (
        <div
          style={{
            display: 'grid',
            gap: '1rem'
          }}
        >
          <video
            controls
            style={{
              width: '100%',
              borderRadius: '1rem',
              border: '1px solid var(--border)'
            }}
            src={videoUrl}
          />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a
              href={videoUrl}
              download="agentic-story.mp4"
              className="button"
            >
              Download mp4
            </a>
            <button
              className="button secondary"
              onClick={() => {
                if (!videoUrl) {
                  return;
                }
                navigator.clipboard
                  .writeText(videoUrl)
                  .then(() => setStatus('Copied download link to clipboard'))
                  .catch(() => {
                    setError('Could not copy video link to clipboard.');
                  });
              }}
            >
              Copy link
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
