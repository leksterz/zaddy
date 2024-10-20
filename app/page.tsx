// app/page.tsx

'use client';

import React, { useState } from 'react';

export default function Page() {
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [storyboard, setStoryboard] = useState(null);

  const generateStoryboard = async () => {
    if (!script.trim()) {
      alert('Please enter a script.');
      return;
    }
  
    setLoading(true);
  
    try {
      const response = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate storyboard');
      }
  
      const data = await response.json();
      setStoryboard(data.storyboard);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };  

  return (
    <main style={{ padding: '16px', fontFamily: 'Arial, sans-serif' }}>
      <h1>AI Storyboard Generator</h1>
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="Enter your story or script here..."
        rows={10}
        cols={80}
        style={{ width: '100%', marginBottom: '16px', padding: '8px', fontSize: '16px' }}
      />
      <br />
      <button
        onClick={generateStoryboard}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        {loading ? 'Generating Storyboard...' : 'Generate Storyboard'}
      </button>
      {loading && <p>Processing your script. This may take a few moments...</p>}
      {storyboard && (
        <div style={{ marginTop: '32px' }}>
          <h2>Generated Storyboard</h2>
          {storyboard.map((scene, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #ccc',
                padding: '16px',
                marginBottom: '16px',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
              }}
            >
              <h3>Scene {index + 1}</h3>
              <p><strong>Description:</strong> {scene.description}</p>
              <p><strong>Visual Suggestions:</strong> {scene.visuals}</p>
              <p><strong>Timestamp:</strong> {scene.timestamp}</p>
              {scene.image && (
                <img
                  src={scene.image}
                  alt={`Scene ${index + 1}`}
                  style={{ maxWidth: '100%', height: 'auto', marginTop: '16px' }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
