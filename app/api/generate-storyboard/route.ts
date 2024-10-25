import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fetch from 'node-fetch'; // Required for making API requests to aimlapi.com

// Configure OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { script } = await request.json();

  try {
    // Step 1: Use OpenAI API to break the script into exactly 10 child-friendly scenes with dialogue
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a creative children's book author and storyboard artist. Your task is to break down scripts into exactly 10 whimsical and engaging scenes suitable for children.

Instructions:
- Read the user's script and break it down into 10 scenes that are fun, imaginative, and easy to understand for children.
- For each scene, provide a breakdown that includes:
  1. **Description**: A vivid and magical breakdown of the scene that will be read out loud by a parent to a child. Include both imaginative scenery and playful dialogue between characters to bring the scene to life. Keep it light and adventurous.
  2. **Visuals**: Suggestions for varied visuals that capture the playful and magical nature of the story. Use a mix of close-ups, wide shots, dynamic angles, and creative compositions to keep each scene visually distinct.
  3. **Timestamp**: Indicate how the pacing should flow for each scene (start and end time), considering attention span and how long children would focus on each moment.

**Important:** Output the result in **strict JSON format** as an array of 10 scenes. Do not include any additional text, explanations, or apologies.

**Example Output:**

[
  {
    "description": "'Look, Theo!' said Poppy, pointing at the glowing butterflies fluttering through the air. 'Aren't they beautiful?' Theo grinned, 'They're leading us somewhere!'",
    "visuals": "A close-up of Poppy's hand pointing at glowing butterflies flying through a magical forest, with Theo's excited face in the background.",
    "timestamp": "00:00 - 00:30"
  }
]`,
        },
        {
          role: 'user',
          content: `Break down the following script into exactly 10 scenes, including vivid descriptions with dialogue and varied visuals:\n\n${script}`,
        },
      ],
    });

    let completionText = completion.choices[0].message.content.trim();

    // Log the assistant's response for debugging purposes
    console.log('Assistant response:', completionText);

    // Parse the response if it's valid JSON
    let storyboard: any[] = [];
    try {
      storyboard = JSON.parse(completionText); // Parse the JSON response
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      console.error('Assistant response:', completionText);

      return NextResponse.json(
        { error: 'Invalid JSON response from assistant', assistantResponse: completionText },
        { status: 500 }
      );
    }

    // Step 2: Generate pixel art images for each scene using AIML API with children's book themes and pixel art style
    const storyboardWithImages = await Promise.all(
      storyboard.map(async (scene: any, index: number) => {
        const variedAngle = index % 3 === 0 ? 'wide shot' : index % 3 === 1 ? 'close-up' : 'over-the-shoulder';
        const richPrompt = `
          **Scene ${index + 1}:** ${scene.description}
          **Visuals:**
          - **Pixel Art Style:** (pixel art, pixelated:1.2), (masterpiece, exceptional, best aesthetic, best quality, masterpiece, extremely detailed:1.2)
          - **Shot Composition:** Use a ${variedAngle} to keep the scene visually dynamic.
          - **Environment:** ${scene.visuals}
          - **Children's Book Aesthetic:** Use vibrant colors, magical elements, and friendly characters. Keep the scene playful and engaging, with a sense of wonder.
          - **Lighting:** Include bright, cheerful lighting that highlights the magic of the scene.
          - **Color Palette:** Incorporate warm, inviting tones suitable for a children's book with pixel art design.
        `;

        try {
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

          // Check if the response is valid JSON before proceeding
          const resultText = await response.text();  // Get the response text for logging

          try {
            const resultData = JSON.parse(resultText);  // Try to parse the response as JSON

            // Check if the image was generated successfully
            if (resultData.images && resultData.images.length > 0 && resultData.images[0].url) {
              const imageUrl = resultData.images[0].url;
              return { ...scene, image: imageUrl };  // Attach image URL to the scene
            } else {
              console.error(`Image generation failed for scene: ${scene.description}`, resultData);
              return { ...scene, image: null };  // Return scene without image if failed
            }
          } catch (jsonParseError) {
            // Log the response for debugging
            console.error(`Error parsing JSON response from AIML API: ${resultText}`);
            return { ...scene, image: null };  // Return scene without image if invalid JSON
          }
        } catch (error) {
          console.error(`Error generating image for scene: ${scene.description}`, error);
          return { ...scene, image: null };  // Return scene without image if an error occurs
        }
      })
    );

    // Return the final storyboard with the generated pixel art images
    return NextResponse.json({ storyboard: storyboardWithImages });
  } catch (error) {
    console.error('Error generating storyboard:', error);
    return NextResponse.json(
      { error: 'Error generating storyboard', details: error.message },
      { status: 500 }
    );
  }
}
