import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const configPath = path.join(process.cwd(), 'config', 'app.config.json');
const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

interface FieldConfig {
  name: string;
  type: string;
  required?: boolean;
  options?: string[];
}
interface EntityConfig {
  name: string;
  fields: FieldConfig[];
}
interface AppConfig {
  entities?: EntityConfig[];
}

function mapType(type: string): string {
  switch (type) {
    case 'number': return 'Float';
    case 'boolean': return 'Boolean';
    case 'enum':
    case 'string':
    default:
      return 'String';
  }
}

function generateSchema(config: AppConfig): string {
  const models = (config.entities || []).map((entity) => {
    const fields = entity.fields.map((field) => {
      const prismaType = mapType(field.type);
      const optional = field.required ? '' : '?';
      return `  ${field.name} ${prismaType}${optional}`;
    });

    return `model ${entity.name} {
  id        String   @id @default(cuid())
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
${fields.join('\n')}
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}`;
  });

  const userRelations = (config.entities || [])
    .map((e) => `  ${e.name.toLowerCase()}s ${e.name}[]`)
    .join('\n');

  return `// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Generated from config/app.config.json

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      Account[]
  sessions      Session[]
${userRelations}
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

${models.join('\n\n')}
`;
}

async function main() {
  console.log('[Schema Generator] Reading config...');
  
  if (!fs.existsSync(configPath)) {
    console.error('[Schema Generator] app.config.json not found!');
    process.exit(1);
  }

  const raw = fs.readFileSync(configPath, 'utf-8');
  let config: AppConfig;
  
  try {
    config = JSON.parse(raw);
  } catch (e) {
    console.error('[Schema Generator] Invalid JSON in config, using empty config');
    config = { entities: [] };
  }

  const schema = generateSchema(config);
  
  fs.mkdirSync(path.dirname(schemaPath), { recursive: true });
  fs.writeFileSync(schemaPath, schema);
  console.log('[Schema Generator] schema.prisma written ✓');

  try {
    console.log('[Schema Generator] Running prisma db push...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('[Schema Generator] DB schema synced ✓');
    
    console.log('[Schema Generator] Running prisma generate...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('[Schema Generator] Prisma client generated ✓');
  } catch (e) {
    console.warn('[Schema Generator] DB push failed (no DATABASE_URL?), skipping.');
  }
}

main();
