import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  BLOB_READ_WRITE_TOKEN: z.string().min(1),
  APP_BASE_URL: z.string().url(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let serverEnvCache: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (serverEnvCache) {
    return serverEnvCache;
  }

  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid server environment variables: ${JSON.stringify(result.error.flatten().fieldErrors)}`);
  }

  serverEnvCache = result.data;
  return result.data;
}
