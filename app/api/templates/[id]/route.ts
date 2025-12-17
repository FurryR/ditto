import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { Template } from '@/lib/typeorm/entities/Template';
import { TemplateStats } from '@/lib/typeorm/entities/TemplateStats';
import { UserWork } from '@/lib/typeorm/entities/UserWork';
import { UserFollow } from '@/lib/typeorm/entities/UserFollow';
import { getCurrentUserId } from '@/lib/typeorm/auth';
import type { ImageCategory, LicenseRestriction, LicenseType } from '@/types';

interface UpdatePayload {
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

// GET /api/templates/[id] - Get template details with works and related templates
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const templatesRepo = await getRepository(Template);

    // Get template with author and stats
    const template = await templatesRepo.findOne({
      where: { id },
      relations: ['author', 'stats'],
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Increment view count
    const statsRepo = await getRepository(TemplateStats);
    await statsRepo.increment({ templateId: id }, 'viewsCount', 1);

    // Get follow counts for the author
    const followRepo = await getRepository(UserFollow);
    const [followingCount, followersCount] = await Promise.all([
      followRepo.count({ where: { followerId: template.authorId } }),
      followRepo.count({ where: { followingId: template.authorId } }),
    ]);

    // Get user works for this template
    const worksRepo = await getRepository(UserWork);
    const userWorks = await worksRepo.find({
      where: { templateId: id },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    // Get related templates (same category, excluding current)
    const relatedTemplates = await templatesRepo.find({
      where: {
        category: template.category,
        isPublished: true,
      },
      relations: ['author', 'stats'],
      order: { createdAt: 'DESC' },
      take: 6,
    });

    // Filter out current template
    const filtered = relatedTemplates.filter((t) => t.id !== id);

    // Remove prompt template from response for security
    const { promptTemplate, ...templateWithoutPrompt } = template;

    // Convert averageRating from decimal string to number
    const stats = template.stats
      ? {
          ...template.stats,
          averageRating: Number(template.stats.averageRating) || 0,
        }
      : undefined;

    return NextResponse.json({
      template: {
        ...templateWithoutPrompt,
        stats,
        author: {
          ...template.author,
          followingCount,
          followersCount,
        },
      },
      userWorks,
      relatedTemplates: filtered,
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

// PATCH /api/templates/[id] - Update template
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = (await req.json()) as UpdatePayload;

    const templatesRepo = await getRepository(Template);
    const template = await templatesRepo.findOne({
      where: { id, authorId: userId },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found or unauthorized' }, { status: 404 });
    }

    // Update fields
    if (body.name !== undefined) template.name = body.name;
    if (body.description !== undefined) template.description = body.description;
    if (body.baseImageUrl !== undefined) template.baseImageUrl = body.baseImageUrl;
    if (body.coverImageUrl !== undefined) template.coverImageUrl = body.coverImageUrl || undefined;
    if (body.promptTemplate !== undefined) template.promptTemplate = body.promptTemplate;
    if (body.category !== undefined) template.category = body.category;
    if (body.tags !== undefined) template.tags = body.tags;
    if (body.modelName !== undefined) template.modelName = body.modelName;
    if (body.numCharacters !== undefined) template.numCharacters = body.numCharacters;
    if (body.licenseType !== undefined) template.licenseType = body.licenseType;
    if (body.licenseRestrictions !== undefined)
      template.licenseRestrictions = body.licenseRestrictions;
    if (body.isPublished !== undefined) {
      template.isPublished = body.isPublished;
      template.publishedAt = body.isPublished ? new Date() : undefined;
    }

    await templatesRepo.save(template);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error updating template:', err);
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}

// DELETE /api/templates/[id] - Delete template
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const templatesRepo = await getRepository(Template);
    const template = await templatesRepo.findOne({
      where: { id, authorId: userId },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found or unauthorized' }, { status: 404 });
    }

    await templatesRepo.remove(template);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error deleting template:', err);
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}
