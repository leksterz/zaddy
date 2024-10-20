// app/api/generate-storyboard/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { fal } from '@fal-ai/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: Request) {
  const { script } = await request.json();

  try {
    // Step 1: Use OpenAI API to break the script into scenes
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
        content: `You are a helpful assistant that breaks down scripts into scenes for storyboarding.

Instructions:

- Read the user's script.
- Break down the script into scenes.
- For each scene, provide the following properties:
  - "description": A detailed description of the scene.
  - "visuals": Suggestions for camera angles, lighting, and movements.
  - "timestamp": Estimated duration of the scene.

**Important:** Output the result in **strict JSON format** as an array of scenes. Do not include any additional text, explanations, or apologies.

**Example Output:**

[
  {
    "description": "Scene description here.",
    "visuals": "Visual suggestions here.",
    "timestamp": "Start time - End time"
  }
]`,
        },
        {
          role: 'user',
          content: `Break down the following script into scenes:\n\n${script}`,
        },
      ],
    });

    const completionText = completion.choices[0].message.content.trim();

    // Log the assistant's response
    console.log('Assistant response:', completionText);

    // Check if the response is likely JSON
    if (!completionText.startsWith('{') && !completionText.startsWith('[')) {
      console.error('Assistant did not return JSON:', completionText);

      return NextResponse.json(
        { error: 'Assistant did not return JSON', assistantResponse: completionText },
        { status: 500 }
      );
    }

    let storyboard: any[] = [];

    try {
      storyboard = JSON.parse(completionText);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      console.error('Assistant response:', completionText);

      return NextResponse.json(
        { error: 'Invalid JSON response from assistant', assistantResponse: completionText },
        { status: 500 }
      );
    }

    // Optional: Generate images for each scene
    const storyboardWithImages = await Promise.all(
      storyboard.map(async (scene: any) => {
        try {
          const result = await fal.subscribe('fal-ai/aura-flow', {
            input: {
              prompt: scene.description,
              num_images: 1,
              guidance_scale: 3.5,
              num_inference_steps: 50,
              expand_prompt: true,
            },
            logs: false,
          });

          const image = result.data.images[0];
          let imageUrl = image.url;

          if (!imageUrl && image.file_data) {
            imageUrl = `data:${image.content_type};base64,${image.file_data}`;
          }

          return { ...scene, image: imageUrl };
        } catch (error) {
          console.error(`Error generating image for scene: ${scene.description}`, error);
          return scene;
        }
      })
    );

    return NextResponse.json({ storyboard: storyboardWithImages });
  } catch (error) {
    console.error('Error generating storyboard:', error);
    return NextResponse.json(
      { error: 'Error generating storyboard', details: error.message },
      { status: 500 }
    );
  }
}
