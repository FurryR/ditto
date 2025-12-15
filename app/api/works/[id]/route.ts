import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { UserWork } from '@/lib/typeorm/entities/UserWork';
import { getCurrentUserId } from '@/lib/typeorm/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workId } = await params;
    const worksRepo = await getRepository(UserWork);
    
    const work = await worksRepo.findOne({
      where: { id: workId },
    });

    if (!work) {
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(work);
  } catch (error) {
    console.error('Error fetching work:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workId } = await params;
    const body = await request.json();
    const { title, description, isPublished } = body;

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

    // Update fields
    if (title !== undefined) work.title = title;
    if (description !== undefined) work.description = description;
    if (isPublished !== undefined) work.isPublished = isPublished;

    await worksRepo.save(work);

    return NextResponse.json(work);
  } catch (error) {
    console.error('Error updating work:', error);
    return NextResponse.json(
      { error: 'Failed to update work' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workId } = await params;
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
