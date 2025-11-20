'use client';

import { useState } from 'react';

type ScriptInputProps = {
  onGenerate: (script: string) => void;
  isGenerating: boolean;
};

const DEMO_SCRIPT = `In a quiet studio, a creator sketches the first ideas for a new video.
The storyboard comes to life with vibrant AI-generated imagery.
A calm, confident voice narrates the vision to the audience.
Clips are refined in a virtual editing bay glowing with neon accents.
With a single click, the finished story launches out to every social feed.`;

export function ScriptInput({ onGenerate, isGenerating }: ScriptInputProps) {
  const [script, setScript] = useState<string>(DEMO_SCRIPT);

  const handleSubmit = () => {
    if (!script.trim()) {
      return;
    }
    onGenerate(script.trim());
  };

  return (
    <section className="card">
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          marginBottom: '1rem'
        }}
      >
        <div className="tag">Script Intelligence</div>
        <h1
          style={{
            fontSize: '2.15rem',
            fontWeight: 700,
            margin: 0
          }}
        >
          Feed your storyboard agent a narrative
        </h1>
        <p style={{ margin: 0, color: 'var(--muted)', maxWidth: '60ch' }}>
          Paste a script, blog post, or a brainstorm. The agent will segment it
          into cinematic beats, create tailored visual prompts, and prepare the
          scene lineup for you to refine.
        </p>
      </header>
      <textarea
        rows={6}
        value={script}
        onChange={(event) => setScript(event.target.value)}
        placeholder="Drop your script here…"
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1rem'
        }}
      >
        <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          {script.trim().length} characters •{' '}
          {script.trim() ? script.split(/\s+/).length : 0} tokens
        </span>
        <button
          className="button"
          disabled={isGenerating}
          onClick={handleSubmit}
          style={{
            opacity: isGenerating ? 0.75 : 1,
            cursor: isGenerating ? 'wait' : 'pointer'
          }}
        >
          {isGenerating ? 'Generating scenes…' : 'Generate scenes'}
        </button>
      </div>
    </section>
  );
}
