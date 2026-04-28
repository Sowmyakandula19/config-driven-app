import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getEntity } from '@/lib/config';

interface Params { params: { entity: string } }

function getModel(entity: string): any {
  return (prisma as any)[entity.charAt(0).toLowerCase() + entity.slice(1)];
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const entityName = params.entity;
  const entityConfig = getEntity(entityName);

  if (!entityConfig) {
    return NextResponse.json({ error: `Entity "${entityName}" not found` }, { status: 404 });
  }

  const model = getModel(entityName);
  if (!model) return NextResponse.json({ error: 'Model not found' }, { status: 404 });

  const { rows } = await req.json();
  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: 'rows must be an array' }, { status: 400 });
  }

  const results = { created: 0, skipped: 0, errors: [] as string[] };

  for (const row of rows) {
    try {
      const data: Record<string, any> = { userId };
      for (const field of entityConfig.fields) {
        if (row[field.name] !== undefined && row[field.name] !== '') {
          if (field.type === 'number') data[field.name] = parseFloat(row[field.name]) || null;
          else if (field.type === 'boolean') data[field.name] = row[field.name] === 'true';
          else data[field.name] = String(row[field.name]);
        }
      }
      // Check required fields
      const missing = entityConfig.fields
        .filter((f) => f.required && !data[f.name])
        .map((f) => f.name);
      if (missing.length > 0) {
        results.skipped++;
        results.errors.push(`Row skipped: missing required fields: ${missing.join(', ')}`);
        continue;
      }
      await model.create({ data });
      results.created++;
    } catch (e: any) {
      results.skipped++;
      results.errors.push(`Row error: ${e.message}`);
    }
  }

  return NextResponse.json(results);
}
