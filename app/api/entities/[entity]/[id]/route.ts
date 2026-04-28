import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getEntity } from '@/lib/config';

interface Params { params: { entity: string; id: string } }

function getModel(entity: string): any {
  const modelName = entity.charAt(0).toLowerCase() + entity.slice(1);
  return (prisma as any)[modelName];
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { entity: entityName, id } = params;
  const entityConfig = getEntity(entityName);

  if (!entityConfig) {
    return NextResponse.json({ error: `Entity "${entityName}" not found` }, { status: 404 });
  }

  const model = getModel(entityName);
  if (!model) return NextResponse.json({ error: 'Model not found' }, { status: 404 });

  try {
    const existing = await model.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });

    const body = await req.json();
    const data: Record<string, any> = {};

    for (const field of entityConfig.fields) {
      if (body[field.name] !== undefined) {
        if (field.type === 'number') {
          data[field.name] = parseFloat(body[field.name]) || null;
        } else if (field.type === 'boolean') {
          data[field.name] = Boolean(body[field.name]);
        } else {
          data[field.name] = body[field.name];
        }
      }
    }

    const record = await model.update({ where: { id }, data });
    return NextResponse.json({ data: record });
  } catch (e: any) {
    console.error(`[API] PUT ${entityName}/${id}:`, e.message);
    return NextResponse.json({ error: 'Failed to update', detail: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { entity: entityName, id } = params;
  const entityConfig = getEntity(entityName);

  if (!entityConfig) {
    return NextResponse.json({ error: `Entity "${entityName}" not found` }, { status: 404 });
  }

  const model = getModel(entityName);
  if (!model) return NextResponse.json({ error: 'Model not found' }, { status: 404 });

  try {
    const existing = await model.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });

    await model.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(`[API] DELETE ${entityName}/${id}:`, e.message);
    return NextResponse.json({ error: 'Failed to delete', detail: e.message }, { status: 500 });
  }
}
