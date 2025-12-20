/**
 * CDN Build Script
 *
 * This script builds each widget in src/widgets into a self-contained
 * IIFE bundle that can be loaded via CDN. Each bundle includes:
 * - The widget code (React or Web Component)
 * - React runtime (for React widgets)
 * - CSS (inlined)
 * - Auto-registration as custom element
 *
 * Output:
 * - cdn/{widget-name}.js - The bundled widget
 * - cdn/{widget-name}.manifest.json - Widget metadata (generated from manifest.ts)
 */

import * as esbuild from 'esbuild'
import { glob } from 'glob'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC_DIR = path.join(ROOT, 'src', 'widgets')
const CDN_DIR = path.join(ROOT, 'cdn')
const DIST_DIR = path.join(ROOT, 'dist', 'widgets')

/**
 * Plugin to inline CSS as a string and inject it into the document
 */
const inlineCSSPlugin = {
  name: 'inline-css',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const css = await fs.readFile(args.path, 'utf8')
      // Escape backticks and backslashes for template literal
      const escaped = css.replace(/\\/g, '\\\\').replace(/`/g, '\\`')
      return {
        contents: `
          (function() {
            if (typeof document !== 'undefined') {
              const style = document.createElement('style');
              style.textContent = \`${escaped}\`;
              document.head.appendChild(style);
            }
          })();
        `,
        loader: 'js',
      }
    })
  },
}

/**
 * Find all widgets with manifest.ts files
 */
async function findWidgets() {
  // Look for manifest.ts (new) or manifest.json (legacy)
  const tsManifests = await glob('*/manifest.ts', { cwd: SRC_DIR })
  const jsonManifests = await glob('*/manifest.json', { cwd: SRC_DIR })

  // Prefer TS manifests, fallback to JSON
  const widgets = new Set([
    ...tsManifests.map((f) => path.dirname(f)),
    ...jsonManifests.map((f) => path.dirname(f)),
  ])

  return Array.from(widgets)
}

/**
 * Load and process a TypeScript manifest, converting Zod schema to JSON Schema
 */
async function loadTsManifest(widgetDir, widgetName) {
  const srcManifest = path.join(widgetDir, 'manifest.ts')

  try {
    await fs.access(srcManifest)
  } catch {
    return null
  }

  // Bundle the manifest, externalizing zod
  const result = await esbuild.build({
    entryPoints: [srcManifest],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    target: ['node18'],
    external: ['zod', 'zod-to-json-schema'],
  })

  const code = result.outputFiles[0].text

  // Import zod to provide to the bundled code
  const zod = await import('zod')
  const zodToJsonSchemaModule = await import('zod-to-json-schema')

  // Execute the bundled code with real zod
  // eslint-disable-next-line no-new-func
  const moduleExports = {}
  const moduleObj = { exports: moduleExports }
  const fn = new Function('module', 'exports', 'require', code)

  fn(moduleObj, moduleExports, (id) => {
    if (id === 'zod') return zod
    if (id === 'zod-to-json-schema') return zodToJsonSchemaModule
    throw new Error(`Unexpected require: ${id}`)
  })

  const manifest = moduleObj.exports.manifest || moduleObj.exports.default

  if (!manifest) {
    console.warn(`⚠️  ${widgetName}: manifest.ts has no 'manifest' export`)
    return null
  }

  // Extract metadata and convert propsSchema to JSON Schema
  const { propsSchema, ...metadata } = manifest

  return {
    ...metadata,
    propsSchema: zodToJsonSchemaModule.zodToJsonSchema(propsSchema, {
      $refStrategy: 'none',
      target: 'jsonSchema7',
    }),
  }
}

/**
 * Load a JSON manifest (legacy format)
 */
async function loadJsonManifest(widgetDir) {
  const manifestPath = path.join(widgetDir, 'manifest.json')
  try {
    const content = await fs.readFile(manifestPath, 'utf8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

async function buildComponent(widgetName) {
  const widgetDir = path.join(SRC_DIR, widgetName)
  const outputFile = path.join(CDN_DIR, `${widgetName}.js`)
  const manifestDest = path.join(CDN_DIR, `${widgetName}.manifest.json`)

  // Find entry point (prefer .tsx, fallback to .ts)
  let entryPoint = path.join(widgetDir, 'cdn.tsx')
  try {
    await fs.access(entryPoint)
  } catch {
    entryPoint = path.join(widgetDir, 'cdn.ts')
    try {
      await fs.access(entryPoint)
    } catch {
      console.warn(
        `⚠️  Skipping ${widgetName}: no cdn.tsx or cdn.ts entry point`
      )
      return
    }
  }

  // Build the bundle
  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2020'],
    outfile: outputFile,
    plugins: [inlineCSSPlugin],
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    // Bundle everything including React
    external: [],
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
    },
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  })

  // Try to load TS manifest first, then fall back to JSON
  let manifestData = await loadTsManifest(widgetDir, widgetName)
  if (!manifestData) {
    manifestData = await loadJsonManifest(widgetDir)
  }

  if (manifestData) {
    await fs.writeFile(manifestDest, JSON.stringify(manifestData, null, 2))
    console.log(`✓ ${widgetName} - bundle + manifest`)
  } else {
    console.log(`✓ ${widgetName} - bundle only (no manifest)`)
  }
}

async function main() {
  console.log('🔨 Building CDN bundles...\n')

  // Ensure output directory exists
  await fs.mkdir(CDN_DIR, { recursive: true })

  // Find and build all widgets
  const widgets = await findWidgets()

  if (widgets.length === 0) {
    console.log('No widgets found with manifest.json')
    return
  }

  for (const widget of widgets) {
    try {
      await buildComponent(widget)
    } catch (err) {
      console.error(`✗ ${widget} - failed:`, err.message)
    }
  }

  console.log('\n✅ CDN build complete')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
