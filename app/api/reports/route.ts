import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { Report } from '@/lib/typeorm/entities/Report';
import { getCurrentUserId } from '@/lib/typeorm/auth';
import type { ReportReason, ReportTargetType } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { targetType, targetId, reason, description } = body as {
      targetType?: ReportTargetType;
      targetId?: string;
      reason?: ReportReason | string;
      description?: string;
    };

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reportsRepo = await getRepository(Report);

    const report = reportsRepo.create({
      reporterId: userId,
      targetType,
      targetId,
      reason: reason || 'other',
      description: description || null,
    });

    await reportsRepo.save(report);

    const webhookUrl = process.env.REPORT_WEBHOOK_URL;
    if (webhookUrl) {
      const payload = {
        type: 'report',
        targetType,
        targetId,
        reason,
        description: description || '',
        reporterId: userId,
        createdAt: new Date().toISOString(),
      };
      // Ignore webhook failures so the main flow isn't blocked
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}
