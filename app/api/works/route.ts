import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { UserWork } from '@/lib/typeorm/entities/UserWork';
import { getCurrentUserId } from '@/lib/typeorm/auth';

// GET /api/works - Get current user's works
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const worksRepo = await getRepository(UserWork);
    const works = await worksRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return NextResponse.json(works);
  } catch (error) {
    console.error('Error fetching works:', error);
    return NextResponse.json(
      { error: 'Failed to fetch works' },
      { status: 500 }
    );
  }
}

// POST /api/works - Create a new work
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, imageUrl, metadata } = body;

    if (!templateId || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const worksRepo = await getRepository(UserWork);
    const work = worksRepo.create({
      userId,
      templateId,
      imageUrl,
      metadata,
    });

    await worksRepo.save(work);

    return NextResponse.json(work);
  } catch (error) {
    console.error('Error creating work:', error);
    return NextResponse.json(
      { error: 'Failed to create work' },
      { status: 500 }
    );
  }
}

// DELETE /api/works - Delete a work (expects work ID in request body)
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workId } = body;

    if (!workId) {
      return NextResponse.json(
        { error: 'Missing work ID' },
        { status: 400 }
      );
    }

    const worksRepo = await getRepository(UserWork);
    const work = await worksRepo.findOne({
      where: { id: workId, userId },
    });

    if (!work) {
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      );
    }

    await worksRepo.remove(work);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting work:', error);
    return NextResponse.json(
      { error: 'Failed to delete work' },
      { status: 500 }
    );
  }
}
