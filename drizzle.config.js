import { readFileSync } from 'node:fs'

/**
 * drizzle-kit doesn't load Next's env files, and we don't want dotenv as a
 * dependency just for migrations — so read .env.local directly if present.
 * A real environment variable always wins over the file.
 */
function envFromLocalFile(key) {
  if (process.env[key]) return process.env[key]
  try {
    const contents = readFileSync('.env.local', 'utf8')
    const match = contents.match(new RegExp(`^${key}=(.*)$`, 'm'))
    return match ? match[1].trim() : undefined
  } catch {
    return undefined
  }
}

const config = {
  dialect: 'postgresql',
  schema: './lib/db/schema.js',
  out: './drizzle',
  dbCredentials: {
    url: envFromLocalFile('DATABASE_URL'),
  },
}

export default config
