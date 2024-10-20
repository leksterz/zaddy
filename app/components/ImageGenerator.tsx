// components/ImageGenerator.tsx

'use client';

import React, { useState } from 'react';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateImage = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt.');
      return;
    }

    setLoading(true);
    setImageSrc(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const { image } = await response.json();

      let imageUrl = image.url;

      if (!imageUrl && image.file_data) {
        // If image URL is not available, use base64 data
        imageUrl = `data:${image.content_type};base64,${image.file_data}`;
      }

      if (imageUrl) {
        setImageSrc(imageUrl);
      } else {
        throw new Error('No image data available');
      }
    } catch (error) {
      console.error(error);
      alert('Error generating image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Generate Image</h2>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt"
        rows={4}
        cols={50}
      />
      <br />
      <button onClick={generateImage} disabled={loading}>
        {loading ? 'Generating...' : 'Generate'}
      </button>
      {imageSrc && (
        <div>
          <h3>Generated Image:</h3>
          <img src={imageSrc} alt="Generated" />
        </div>
      )}
    </div>
  );
}
