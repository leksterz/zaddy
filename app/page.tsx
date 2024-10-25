'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Home, FolderOpen, Trash2, Library, Users, Mic2 } from 'lucide-react';

export default function Page() {
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [storyboard, setStoryboard] = useState<Array<{ image: string; description: string; visuals: string }> | null>(null); // Update the type here
  const [regeneratingImage, setRegeneratingImage] = useState<Record<number, boolean>>({}); // Specify the type here

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
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error);
        alert(error.message);
      } else {
        console.error('An unknown error occurred');
        alert('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const regenerateImage = async (scene: { description: string, visuals: string }, index: number) => {
    setRegeneratingImage({ ...regeneratingImage, [index]: true });

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sceneDescription: scene.description,
          sceneVisuals: scene.visuals,
          sceneIndex: index,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate image');
      }

      const data = await response.json();
      setStoryboard(prevStoryboard => {
        if (prevStoryboard === null) return []; // Change return value to an empty array
        const updatedStoryboard = [...prevStoryboard];
        updatedStoryboard[index].image = data.image;
        return updatedStoryboard;
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(error);
        alert(error.message);
      } else {
        console.error('An unknown error occurred');
        alert('An unknown error occurred');
      }
    } finally {
      setRegeneratingImage({ ...regeneratingImage, [index]: false });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 p-4 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-300 mb-4">Storyboard AI</h2>
        <nav className="space-y-2">
          <Button variant="ghost" className="w-full justify-start text-gray-900 dark:text-gray-300">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          <Button variant="ghost" className="w-full justify-start text-gray-900 dark:text-gray-300">
            <FolderOpen className="mr-2 h-4 w-4" />
            Workspace
          </Button>
          <Button variant="ghost" className="w-full justify-start text-gray-900 dark:text-gray-300">
            <BookOpen className="mr-2 h-4 w-4" />
            My Stories
          </Button>
          <Button variant="ghost" className="w-full justify-start text-gray-900 dark:text-gray-300">
            <Trash2 className="mr-2 h-4 w-4" />
            Trash
          </Button>
        </nav>
        <div className="pt-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-300 mb-2">Assets</h3>
          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-gray-900 dark:text-gray-300">
              <Library className="mr-2 h-4 w-4" />
              Library
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-900 dark:text-gray-300">
              <Users className="mr-2 h-4 w-4" />
              Characters
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-900 dark:text-gray-300">
              <Mic2 className="mr-2 h-4 w-4" />
              Voices
            </Button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="mb-4 flex justify-between items-center">
          <Input
            type="search"
            placeholder="Search stories"
            className="w-64"
            value={script}
            onChange={(e) => setScript(e.target.value)}
          />
          <Button onClick={generateStoryboard} disabled={loading}>
            {loading ? 'Generating...' : 'New Story'}
          </Button>
        </div>

        <Card className="w-full">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-300 mb-4">AI Storyboard Assistant</h2>
            <Tabs defaultValue="story" className="w-full">
              <TabsList>
                <TabsTrigger value="story" className="text-gray-900 dark:text-gray-300">Story</TabsTrigger>
                <TabsTrigger value="settings" className="text-gray-900 dark:text-gray-300">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="story">
                <Textarea
                  placeholder="Enter your story here..."
                  className="w-full h-32 mb-4"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                />
                <Button
                  onClick={generateStoryboard}
                  className="w-full mb-4"
                  disabled={loading}
                >
                  {loading ? 'Generating Storyboard...' : 'Generate Storyboard'}
                </Button>
                {storyboard && storyboard !== null && (
                  <div className="space-y-4">
                    {storyboard.map((scene, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <img
                          src={scene.image || '/placeholder.svg'}
                          alt={`Scene ${index + 1}`}
                          className="w-48 h-36 object-cover"
                        />
                        <Textarea
                          value={scene.description}
                          readOnly
                          className="flex-1 h-36"
                        />
                        <Button
                          onClick={() => regenerateImage({ description: scene.description, visuals: scene.visuals }, index)} // Pass visuals here
                          disabled={regeneratingImage[index]}
                        >
                          {regeneratingImage[index] ? 'Regenerating...' : 'Regenerate Image'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="settings">
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-gray-900 dark:text-gray-300">Style</label>
                    <Input type="text" placeholder="e.g., Cartoon, Realistic, Anime" />
                  </div>
                  <div>
                    <label className="block mb-2 text-gray-900 dark:text-gray-300">Number of Scenes</label>
                    <Input type="number" defaultValue={3} min={1} max={10} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
