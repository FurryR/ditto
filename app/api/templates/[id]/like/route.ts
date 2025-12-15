import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { TemplateLike } from '@/lib/typeorm/entities/TemplateLike';
import { TemplateStats } from '@/lib/typeorm/entities/TemplateStats';
import { getCurrentUserId } from '@/lib/typeorm/auth';

// GET /api/templates/[id]/like - Check if user has liked template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ isLiked: false });
    }

    const { id: templateId } = await params;
    const likesRepo = await getRepository(TemplateLike);
    
    const like = await likesRepo.findOne({
      where: { userId, templateId },
    });

    return NextResponse.json({ isLiked: !!like });
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/templates/[id]/like - Like template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: templateId } = await params;
    const likesRepo = await getRepository(TemplateLike);
    const statsRepo = await getRepository(TemplateStats);

    // Check if already liked
    const existing = await likesRepo.findOne({
      where: { userId, templateId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already liked' }, { status: 400 });
    }

    // Create like
    const like = likesRepo.create({ userId, templateId });
    await likesRepo.save(like);

    // Increment like count
    await statsRepo.increment({ templateId }, 'likesCount', 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error liking template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/templates/[id]/like - Unlike template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: templateId } = await params;
    const likesRepo = await getRepository(TemplateLike);
    const statsRepo = await getRepository(TemplateStats);

    // Find and delete like
    const like = await likesRepo.findOne({
      where: { userId, templateId },
    });

    if (!like) {
      return NextResponse.json({ error: 'Not liked' }, { status: 400 });
    }

    await likesRepo.remove(like);

    // Decrement like count
    await statsRepo.decrement({ templateId }, 'likesCount', 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unliking template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
