// // app/api/generate-image/route.ts

// import { NextResponse } from 'next/server';
// import { fal } from '@fal-ai/client';

// export async function POST(request: Request) {
//   const { prompt } = await request.json();

//   // Configure the fal-ai client with your API key
//   fal.config({
//     credentials: process.env.FAL_KEY,
//   });

//   try {
//     const result = await fal.subscribe("fal-ai/flux/dev", {
//         input: {
//             prompt: prompt,
//             num_images: 1,
//             guidance_scale: 3.5,
//             num_inference_steps: 50,
//             expand_prompt: true,
//           },
//         logs: true,
//         onQueueUpdate: (update) => {
//           if (update.status === "IN_PROGRESS") {
//             update.logs.map((log) => log.message).forEach(console.log);
//           }
//         },
//       });

//     // Extract the image data
//     const image = result.data.images[0];

//     return NextResponse.json({ image });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: 'Error generating image' },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from 'next/server';
import fetch from 'node-fetch'; // Required for making API requests to aimlapi.com

export async function POST(request: Request) {
  const { sceneDescription, sceneVisuals, sceneIndex } = await request.json();

  try {
    // Generate pixel art image for the single scene using AIML API
    const variedAngle = sceneIndex % 3 === 0 ? 'wide shot' : sceneIndex % 3 === 1 ? 'close-up' : 'over-the-shoulder';
    const richPrompt = `
      **Scene ${sceneIndex + 1}:** ${sceneDescription}
      **Visuals:**
      - **Pixel Art Style:** (pixel art, pixelated:1.2), (masterpiece, exceptional, best aesthetic, best quality, masterpiece, extremely detailed:1.2)
      - **Shot Composition:** Use a ${variedAngle} to keep the scene visually dynamic.
      - **Environment:** ${sceneVisuals}
      - **Children's Book Aesthetic:** Use vibrant colors, magical elements, and friendly characters. Keep the scene playful and engaging, with a sense of wonder.
      - **Lighting:** Include bright, cheerful lighting that highlights the magic of the scene.
      - **Color Palette:** Incorporate warm, inviting tones suitable for a children's book with pixel art design.
    `;

    const response = await fetch('https://api.aimlapi.com/images/generations/', {
      method: 'POST',
      headers: {
        "Authorization": `Bearer bf8e3f325537416ba0e3827aec99194b`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: richPrompt,     // Use the enhanced, richer prompt tailored for pixel art and children's book themes
        model: 'flux-realism'   // Using the AIML API model for pixel art style
      }),
    });

    const resultText = await response.text();  // Get the response text for logging

    try {
      const resultData = JSON.parse(resultText);  // Try to parse the response as JSON

      // Check if the image was generated successfully
      if (resultData.images && resultData.images.length > 0 && resultData.images[0].url) {
        const imageUrl = resultData.images[0].url;
        return NextResponse.json({ image: imageUrl });  // Return the new image URL
      } else {
        console.error(`Image generation failed for scene: ${sceneDescription}`, resultData);
        return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
      }
    } catch (jsonParseError) {
      console.error(`Error parsing JSON response from AIML API: ${resultText}`);
      return NextResponse.json({ error: 'Invalid JSON response from AIML API' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json({ error: 'Error generating image', details: error.message }, { status: 500 });
  }
}
