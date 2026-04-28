import { z } from 'zod';
import rawConfig from '@/config/app.config.json';

const FieldSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'enum']).default('string'),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

const EntitySchema = z.object({
  name: z.string(),
  fields: z.array(FieldSchema).default([]),
});

const WidgetSchema = z.object({
  type: z.enum(['stat', 'chart']),
  label: z.string().optional(),
  entity: z.string(),
  chartType: z.enum(['bar', 'pie', 'line']).optional(),
  groupBy: z.string().optional(),
});

const PageSchema = z.object({
  route: z.string(),
  title: z.string().default('Untitled'),
  type: z.string(),
  entity: z.string().optional(),
  actions: z.array(z.string()).default([]),
  widgets: z.array(WidgetSchema).optional(),
});

const AppConfigSchema = z.object({
  app: z.object({
    name: z.string().default('My App'),
    theme: z.enum(['light', 'dark']).default('dark'),
    locale: z.string().default('en'),
  }).default({}),
  auth: z.object({
    methods: z.array(z.string()).default(['email']),
    userScoped: z.boolean().default(true),
  }).default({}),
  entities: z.array(EntitySchema).default([]),
  pages: z.array(PageSchema).default([]),
  notifications: z.object({
    events: z.array(z.string()).default([]),
    email: z.boolean().default(false),
  }).default({}),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type EntityConfig = z.infer<typeof EntitySchema>;
export type FieldConfig = z.infer<typeof FieldSchema>;
export type PageConfig = z.infer<typeof PageSchema>;
export type WidgetConfig = z.infer<typeof WidgetSchema>;

function parseConfig(): AppConfig {
  const result = AppConfigSchema.safeParse(rawConfig);
  if (!result.success) {
    console.warn('[Config] Validation warnings:', result.error.flatten());
    // Still return with defaults applied
    return AppConfigSchema.parse({});
  }
  return result.data;
}

export const appConfig = parseConfig();

export function getEntity(name: string): EntityConfig | undefined {
  return appConfig.entities.find(
    (e) => e.name.toLowerCase() === name.toLowerCase()
  );
}

export function getPage(route: string): PageConfig | undefined {
  return appConfig.pages.find((p) => p.route === route);
}
