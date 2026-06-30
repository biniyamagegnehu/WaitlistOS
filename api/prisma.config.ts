import path from 'node:path'
import { defineConfig, env } from '@prisma/config'
import 'dotenv/config'

// Prisma 7 requires database connection to be configured here
// instead of the `url` field in schema.prisma
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: env('DATABASE_URL'),
  }
})
