import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getEntity } from '@/lib/config';

interface Params { params: { entity: string } }

function getModel(entity: string): any {
  const modelName = entity.charAt(0).toLowerCase() + entity.slice(1);
  return (prisma as any)[modelName];
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const entityName = params.entity;
  const entityConfig = getEntity(entityName);

  if (!entityConfig) {
    return NextResponse.json({ error: `Entity "${entityName}" not found in config` }, { status: 404 });
  }

  const model = getModel(entityName);
  if (!model) {
    return NextResponse.json({ error: `Model "${entityName}" not found` }, { status: 404 });
  }

  try {
    const records = await model.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ data: records, entity: entityConfig });
  } catch (e: any) {
    console.error(`[API] GET ${entityName}:`, e.message);
    return NextResponse.json({ error: 'Failed to fetch records', detail: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const entityName = params.entity;
  const entityConfig = getEntity(entityName);

  if (!entityConfig) {
    return NextResponse.json({ error: `Entity "${entityName}" not found in config` }, { status: 404 });
  }

  const model = getModel(entityName);
  if (!model) {
    return NextResponse.json({ error: `Model "${entityName}" not found` }, { status: 404 });
  }

  try {
    const body = await req.json();
    
    // Validate required fields
    const errors: Record<string, string> = {};
    for (const field of entityConfig.fields) {
      if (field.required && !body[field.name]) {
        errors[field.name] = `${field.name} is required`;
      }
    }
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: 'Validation failed', fields: errors }, { status: 422 });
    }

    // Build safe data object
    const data: Record<string, any> = { userId };
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

    const record = await model.create({ data });
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (e: any) {
    console.error(`[API] POST ${entityName}:`, e.message);
    return NextResponse.json({ error: 'Failed to create record', detail: e.message }, { status: 500 });
  }
}
