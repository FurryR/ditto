import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { Template } from '@/lib/typeorm/entities/Template';
import { TemplateStats } from '@/lib/typeorm/entities/TemplateStats';
import { getCurrentUserId } from '@/lib/typeorm/auth';
import { migrateToFileBucket } from '@/lib/image-utils';
import type { ImageCategory, LicenseRestriction, LicenseType } from '@/types';

interface TemplatePayload {
  name?: string;
  description?: string;
  baseImageUrl?: string;
  coverImageUrl?: string | null;
  promptTemplate?: string;
  category?: ImageCategory;
  tags?: string[];
  modelName?: string;
  numCharacters?: number;
  licenseType?: LicenseType;
  licenseRestrictions?: LicenseRestriction[];
  isPublished?: boolean;
}

// GET /api/templates - Get all published templates or user's templates
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const authorId = searchParams.get('authorId');
    
    const templatesRepo = await getRepository(Template);
    
    // If authorId is provided, get all templates by that author (including unpublished)
    if (authorId) {
      const userId = await getCurrentUserId();
      
      // Only allow users to see their own unpublished templates
      if (userId !== authorId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const templates = await templatesRepo.find({
        where: { authorId },
        relations: ['author', 'stats'],
        order: { createdAt: 'DESC' },
      });
      
      // Convert averageRating from decimal string to number
      const templatesWithStats = templates.map(template => ({
        ...template,
        stats: template.stats ? {
          ...template.stats,
          averageRating: Number(template.stats.averageRating) || 0,
        } : undefined,
      }));
      
      return NextResponse.json(templatesWithStats);
    }
    
    // Otherwise, get all published templates
    const templates = await templatesRepo.find({
      where: { isPublished: true },
      relations: ['author', 'stats'],
      order: { createdAt: 'DESC' },
      take: 100,
    });

    // Convert averageRating from decimal string to number
    const templatesWithStats = templates.map(template => ({
      ...template,
      stats: template.stats ? {
        ...template.stats,
        averageRating: Number(template.stats.averageRating) || 0,
      } : undefined,
    }));

    return NextResponse.json(templatesWithStats);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create a new template
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as TemplatePayload;
    const {
      name,
      description,
      baseImageUrl,
      coverImageUrl,
      promptTemplate,
      category,
      tags,
      modelName,
      numCharacters,
      licenseType,
      licenseRestrictions,
    } = body;

    if (!name || !baseImageUrl || !promptTemplate || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Migrate images from upload bucket to file bucket if they're in upload
    let finalBaseImageUrl = baseImageUrl;
    let finalCoverImageUrl = coverImageUrl;

    try {
      // Check if baseImageUrl is from upload bucket and migrate
      if (baseImageUrl.includes('/upload/')) {
        finalBaseImageUrl = await migrateToFileBucket(baseImageUrl, userId, 'template-base');
      }

      // Check if coverImageUrl is from upload bucket and migrate
      if (coverImageUrl && coverImageUrl.includes('/upload/')) {
        finalCoverImageUrl = await migrateToFileBucket(coverImageUrl, userId, 'template-cover');
      }
    } catch (error) {
      console.error('Error migrating template images:', error);
      return NextResponse.json({ error: 'Failed to migrate images' }, { status: 500 });
    }

    const templatesRepo = await getRepository(Template);
    const template = templatesRepo.create({
      name,
      description: description || '',
      baseImageUrl: finalBaseImageUrl,
      coverImageUrl: finalCoverImageUrl || undefined,
      promptTemplate,
      category,
      tags: tags || [],
      authorId: userId,
      modelName: modelName || 'sd-1.5',
      numCharacters: numCharacters || 1,
      licenseType: licenseType || 'CC-BY-NC-SA-4.0',
      licenseRestrictions: licenseRestrictions || [],
      isPublished: !!body.isPublished,
      publishedAt: body.isPublished ? new Date() : undefined,
    });

    await templatesRepo.save(template);

    // Initialize stats
    const statsRepo = await getRepository(TemplateStats);
    const stats = statsRepo.create({
      templateId: template.id,
    });
    await statsRepo.save(stats);

    return NextResponse.json({ ok: true, id: template.id });
  } catch (err) {
    console.error('Error creating template:', err);
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}
