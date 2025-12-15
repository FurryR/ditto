import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { UserWork } from '@/lib/typeorm/entities/UserWork';
import { getCurrentUserId } from '@/lib/typeorm/auth';
import { migrateToFileBucket } from '@/lib/image-utils';

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, imageUrl, title, promptUsed, additionalPrompt } = body;

    // Validate inputs
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Migrate image from upload bucket to file bucket (for persistence)
    let finalImageUrl = imageUrl;
    if (imageUrl.includes('/upload/')) {
      try {
        finalImageUrl = await migrateToFileBucket(imageUrl, userId, 'work');
      } catch (error) {
        console.error('Error migrating image:', error);
        return NextResponse.json({ 
          error: 'Failed to save image',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    const workRepo = await getRepository(UserWork);
    
    const newWork = workRepo.create({
      userId,
      templateId: templateId || null,
      imageUrl: finalImageUrl,
      title: title || null,
      promptUsed: promptUsed || null,
      additionalPrompt: additionalPrompt || null,
      characterImages: [], // No longer storing character images
      isPublished: false,
      createdAt: new Date(),
    });

    await workRepo.save(newWork);

    return NextResponse.json({
      success: true,
      work: newWork,
    });
  } catch (error) {
    console.error('Error creating work:', error);
    return NextResponse.json({ 
      error: 'Failed to create work',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
