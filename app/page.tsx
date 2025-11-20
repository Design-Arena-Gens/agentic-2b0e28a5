'use client';

import { useEffect, useMemo, useState } from 'react';
import { ScriptInput } from '@/components/ScriptInput';
import { SceneEditor } from '@/components/SceneEditor';
import { VideoComposer } from '@/components/VideoComposer';
import { SocialAgentPanel } from '@/components/SocialAgentPanel';
import { deriveScenes } from '@/lib/scene-utils';
import type { Scene } from '@/types/media';

const dedupe = <T,>(array: T[]) => Array.from(new Set(array));

export default function Home() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [busySceneId, setBusySceneId] = useState<string | null>(null);
  const [audioSceneId, setAudioSceneId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (videoUrl) {
      setVideoUrl(null);
    }
  }, [scenes, videoUrl]);

  const handleGenerateScenes = (script: string) => {
    setIsGenerating(true);
    const nextScenes = deriveScenes(script);
    setScenes(nextScenes);
    setIsGenerating(false);
  };

  const handleUpdateScene = (sceneId: string, updates: Partial<Scene>) => {
    setScenes((current) =>
      current.map((scene) =>
        scene.id === sceneId ? { ...scene, ...updates } : scene
      )
    );
  };

  const handleDeleteScene = (sceneId: string) => {
    setScenes((current) => current.filter((scene) => scene.id !== sceneId));
  };

  const handleDuplicateScene = (sceneId: string) => {
    setScenes((current) => {
      const index = current.findIndex((scene) => scene.id === sceneId);
      if (index === -1) {
        return current;
      }
      const clone: Scene = {
        ...current[index],
        id: crypto.randomUUID(),
        title: `${current[index].title} (copy)`
      };
      const copy = [...current];
      copy.splice(index + 1, 0, clone);
      return copy;
    });
  };

  const handleReorderScene = (sceneId: string, direction: 'up' | 'down') => {
    setScenes((current) => {
      const index = current.findIndex((scene) => scene.id === sceneId);
      if (index === -1) {
        return current;
      }

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const reordered = [...current];
      const [scene] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, scene);
      return reordered;
    });
  };

  const generateImage = async (scene: Scene) => {
    if (!scene.imagePrompt.trim()) {
      return;
    }

    try {
      setBusySceneId(scene.id);
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: scene.imagePrompt })
      });

      if (!response.ok) {
        throw new Error('Image generation failed.');
      }

      const payload = await response.json();
      handleUpdateScene(scene.id, { imageUrl: payload.dataUrl });
    } catch (error) {
      console.error(error);
    } finally {
      setBusySceneId(null);
    }
  };

  const generateVoice = async (scene: Scene) => {
    if (!scene.script.trim()) {
      return;
    }

    try {
      setAudioSceneId(scene.id);
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scene.script })
      });

      if (!response.ok) {
        throw new Error('Voice synthesis failed.');
      }

      const payload = await response.json();
      handleUpdateScene(scene.id, {
        audio: {
          url: payload.dataUrl,
          format: 'mp3',
          duration: payload.duration
        }
      });
    } catch (error) {
      console.error(error);
    } finally {
      setAudioSceneId(null);
    }
  };

  const tags = useMemo(() => {
    const keywords = scenes
      .flatMap((scene) =>
        scene.imagePrompt
          .split(/\s+/)
          .map((token) => token.replace(/[^a-z0-9]/gi, '').toLowerCase())
      )
      .filter(Boolean)
      .slice(0, 12);

    return dedupe(keywords);
  }, [scenes]);

  return (
    <main style={{ display: 'grid', gap: '1.5rem' }}>
      <ScriptInput
        onGenerate={handleGenerateScenes}
        isGenerating={isGenerating}
      />

      {tags.length ? (
        <div className="card" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {tags.map((tag) => (
            <span key={tag} className="badge">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      {scenes.length > 0 ? (
        <>
          <SceneEditor
            scenes={scenes}
            onUpdateScene={handleUpdateScene}
            onDeleteScene={handleDeleteScene}
            onDuplicateScene={handleDuplicateScene}
            onReorderScene={handleReorderScene}
            onGenerateImage={generateImage}
            onGenerateVoice={generateVoice}
            busySceneId={busySceneId}
            audioSceneId={audioSceneId}
          />
          <VideoComposer scenes={scenes} onRendered={setVideoUrl} />
          <SocialAgentPanel renderedVideoUrl={videoUrl} scenes={scenes} />
        </>
      ) : null}
    </main>
  );
}
