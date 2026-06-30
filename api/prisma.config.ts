import path from 'node:path'
import { defineConfig } from '@prisma/config'

// Prisma 7 requires database connection to be configured here
// instead of the `url` field in schema.prisma
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
})
