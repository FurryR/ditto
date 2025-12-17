import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { Template } from '@/lib/typeorm/entities/Template';
import { Profile } from '@/lib/typeorm/entities/Profile';
import { getCurrentUserId } from '@/lib/typeorm/auth';
import sizeOf from 'image-size';

/**
 * Get image dimensions from URL
 */
async function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const dimensions = sizeOf(buffer);

  if (!dimensions.width || !dimensions.height) {
    // Fallback to default
    return { width: 1024, height: 1024 };
  }

  return { width: dimensions.width, height: dimensions.height };
}

/**
 * Calculate the closest supported aspect ratio based on image dimensions
 */
function calculateAspectRatio(width: number, height: number): string {
  const ratio = width / height;

  // Supported aspect ratios with their numeric values
  const supportedRatios = [
    { label: '1:1', value: 1.0 },
    { label: '2:3', value: 2 / 3 },
    { label: '3:2', value: 3 / 2 },
    { label: '3:4', value: 3 / 4 },
    { label: '4:3', value: 4 / 3 },
    { label: '4:5', value: 4 / 5 },
    { label: '5:4', value: 5 / 4 },
    { label: '9:16', value: 9 / 16 },
    { label: '16:9', value: 16 / 9 },
    { label: '21:9', value: 21 / 9 },
  ];

  // Find the closest aspect ratio
  let closest = supportedRatios[0];
  let minDiff = Math.abs(ratio - closest.value);

  for (const supported of supportedRatios) {
    const diff = Math.abs(ratio - supported.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = supported;
    }
  }

  return closest.label;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, characterImages, additionalPrompt } = body;

    // Validate inputs
    if (
      !templateId ||
      !characterImages ||
      !Array.isArray(characterImages) ||
      characterImages.length === 0
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user's OpenRouter API key
    const profileRepo = await getRepository(Profile);
    const profile = await profileRepo.findOne({ where: { id: userId } });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const openRouterKey = profile.apiSettings?.openrouter_key;

    if (!openRouterKey) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 403 });
    }

    // Get template
    const templateRepo = await getRepository(Template);
    const template = await templateRepo.findOne({ where: { id: templateId } });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Prepare the prompt with preset
    const preset = `You are a skilled image artist, good at generating best quality images. Please generate the image based on the following instructions:

${template.promptTemplate}${additionalPrompt ? `\n\n${additionalPrompt}` : ''}`;

    // Prepare message content with base image and character images
    const messageContent: any[] = [
      {
        type: 'text',
        text: preset,
      },
    ];

    // Add base image if available
    if (template.baseImageUrl) {
      messageContent.push({
        type: 'image_url',
        image_url: {
          url: template.baseImageUrl,
        },
      });
    }

    // Add character images (use URLs directly, not base64)
    for (const imageUrl of characterImages) {
      messageContent.push({
        type: 'image_url',
        image_url: {
          url: imageUrl,
        },
      });
    }
    console.log('Message content for OpenRouter:', messageContent);

    // Determine aspect ratio from base image
    let aspectRatio = '1:1'; // default
    if (template.baseImageUrl) {
      try {
        const dimensions = await getImageDimensions(template.baseImageUrl);
        aspectRatio = calculateAspectRatio(dimensions.width, dimensions.height);
        console.log(
          `Base image dimensions: ${dimensions.width}x${dimensions.height}, aspect ratio: ${aspectRatio}`
        );
      } catch (error) {
        console.warn('Failed to get image dimensions, using default 1:1:', error);
      }
    }

    // DEVELOPMENT MODE: Return test image instead of calling OpenRouter API
    // Comment out the following block and uncomment the OpenRouter API call below for production
    const fs = await import('fs').then((m) => m.promises);
    const path = await import('path');
    const testImagePath = path.join(process.cwd(), 'ditto.png');
    const imageBuffer = await fs.readFile(testImagePath);
    const base64Image = imageBuffer.toString('base64');
    const generatedImageBase64 = `data:image/png;base64,${base64Image}`;

    return NextResponse.json({
      success: true,
      generatedImageUrl: generatedImageBase64,
    });

    /* PRODUCTION CODE - Uncomment for actual OpenRouter API calls
    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://ditto.app',
        'X-Title': 'Ditto',
      },
      body: JSON.stringify({
        model: template.modelName,
        messages: [
          {
            role: 'user',
            content: messageContent,
          },
        ],
        modalities: ['image', 'text'],
        image_config: {
          aspect_ratio: aspectRatio,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      return NextResponse.json({ 
        error: 'Image generation failed', 
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();

    // Extract generated image
    if (!data.choices || !data.choices[0]?.message?.images || data.choices[0].message.images.length === 0) {
      return NextResponse.json({ 
        error: 'No image generated',
        details: 'The AI did not generate an image'
      }, { status: 500 });
    }

    const generatedImageBase64 = data.choices[0].message.images[0].image_url.url;

    // Return the base64 data URL directly
    // Client will handle further processing and uploading if needed
    return NextResponse.json({
      success: true,
      generatedImageUrl: generatedImageBase64,
    });
    */
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
