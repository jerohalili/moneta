// Humanize loader: lets plain `node:test` resolve the app's Next.js-style
// imports (extensionless `./x` + `@/*` alias) and forces lib/data `.js`
// files to load as ESM (package.json has no `"type": "module"`).
import { existsSync } from 'node:fs'
import { pathToFileURL, fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function toFileUrl(p) {
  return pathToFileURL(p).href
}

function tryFile(p) {
  if (existsSync(p) && !p.endsWith('/')) return p
  if (existsSync(p + '.js')) return p + '.js'
  if (existsSync(path.join(p, 'index.js'))) return path.join(p, 'index.js')
  return null
}

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context)
  } catch (err) {
    if (specifier.startsWith('node:') || specifier.startsWith('file:')) throw err
    // @/* alias -> repo root
    if (specifier.startsWith('@/')) {
      const p = tryFile(path.join(ROOT, specifier.slice(2)))
      if (p) return { url: toFileUrl(p), shortCircuit: true }
      throw err
    }
    // Extensionless relative -> .js (lib/*.js style)
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      const parentPath = context.parentURL ? fileURLToPath(context.parentURL) : path.join(ROOT, 'tests', 'x.mjs')
      const abs = path.resolve(path.dirname(parentPath), specifier)
      const p = tryFile(abs)
      if (p) return { url: toFileUrl(p), shortCircuit: true }
      throw err
    }
    throw err
  }
}

export async function load(url, context, nextLoad) {
  const loaded = await nextLoad(url, context).catch(() => null)
  if (loaded) return loaded
  // Fallback: treat repo lib/data .js as ESM source.
  if (url.startsWith('file://')) {
    const p = fileURLToPath(url)
    const withJs = p.endsWith('.js') ? p : p + '.js'
    const { readFile } = await import('node:fs/promises')
    try {
      const source = await readFile(withJs, 'utf8')
      return { format: 'module', source, shortCircuit: true }
    } catch {
      // fall through
    }
  }
  throw new Error(`humanize-loader: cannot load '${url}'`)
}
