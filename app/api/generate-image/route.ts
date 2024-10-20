// app/api/generate-image/route.ts

import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

export async function POST(request: Request) {
  const { prompt } = await request.json();

  // Configure the fal-ai client with your API key
  fal.config({
    credentials: process.env.FAL_KEY,
  });

  try {
    const result = await fal.subscribe("fal-ai/flux/dev", {
        input: {
            prompt: prompt,
            num_images: 1,
            guidance_scale: 3.5,
            num_inference_steps: 50,
            expand_prompt: true,
          },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

    // Extract the image data
    const image = result.data.images[0];

    return NextResponse.json({ image });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error generating image' },
      { status: 500 }
    );
  }
}
