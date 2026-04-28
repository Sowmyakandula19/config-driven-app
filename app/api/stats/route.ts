import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getEntity } from '@/lib/config';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const entity = searchParams.get('entity');
  const groupBy = searchParams.get('groupBy');

  if (!entity) return NextResponse.json({ error: 'entity param required' }, { status: 400 });

  const entityConfig = getEntity(entity);
  if (!entityConfig) return NextResponse.json({ error: 'Entity not found' }, { status: 404 });

  const model = (prisma as any)[entity.charAt(0).toLowerCase() + entity.slice(1)];
  if (!model) return NextResponse.json({ error: 'Model not found' }, { status: 404 });

  try {
    const count = await model.count({ where: { userId } });

    let grouped = null;
    if (groupBy) {
      const records = await model.findMany({ where: { userId }, select: { [groupBy]: true } });
      const groupMap: Record<string, number> = {};
      for (const r of records) {
        const key = r[groupBy] || 'Unknown';
        groupMap[key] = (groupMap[key] || 0) + 1;
      }
      grouped = Object.entries(groupMap).map(([name, value]) => ({ name, value }));
    }

    return NextResponse.json({ count, grouped });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
