/**
 * CDN Build Script
 *
 * This script builds each component in src/components into a self-contained
 * IIFE bundle that can be loaded via CDN. Each bundle includes:
 * - The component code (React or Web Component)
 * - React runtime (for React components)
 * - Tailwind CSS (inlined)
 * - Auto-registration as custom element
 *
 * Output:
 * - cdn/{component-name}.js - The bundled component
 * - cdn/{component-name}.manifest.json - Component metadata (copied from src)
 */

import * as esbuild from 'esbuild'
import { glob } from 'glob'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC_DIR = path.join(ROOT, 'src', 'components')
const CDN_DIR = path.join(ROOT, 'cdn')

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

async function findComponents() {
  const manifestFiles = await glob('*/manifest.json', { cwd: SRC_DIR })
  return manifestFiles.map((f) => path.dirname(f))
}

async function buildComponent(componentName) {
  const componentDir = path.join(SRC_DIR, componentName)
  const manifestSrc = path.join(componentDir, 'manifest.json')
  const outputFile = path.join(CDN_DIR, `${componentName}.js`)
  const manifestDest = path.join(CDN_DIR, `${componentName}.manifest.json`)

  // Find entry point (prefer .tsx, fallback to .ts)
  let entryPoint = path.join(componentDir, 'cdn.tsx')
  try {
    await fs.access(entryPoint)
  } catch {
    entryPoint = path.join(componentDir, 'cdn.ts')
    try {
      await fs.access(entryPoint)
    } catch {
      console.warn(
        `⚠️  Skipping ${componentName}: no cdn.tsx or cdn.ts entry point`
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

  // Copy manifest
  try {
    await fs.access(manifestSrc)
    await fs.copyFile(manifestSrc, manifestDest)
    console.log(`✓ ${componentName} - bundle + manifest`)
  } catch {
    console.log(`✓ ${componentName} - bundle only (no manifest)`)
  }
}

async function main() {
  console.log('🔨 Building CDN bundles...\n')

  // Ensure output directory exists
  await fs.mkdir(CDN_DIR, { recursive: true })

  // Find and build all components
  const components = await findComponents()

  if (components.length === 0) {
    console.log('No components found with manifest.json')
    return
  }

  for (const component of components) {
    try {
      await buildComponent(component)
    } catch (err) {
      console.error(`✗ ${component} - failed:`, err.message)
    }
  }

  console.log('\n✅ CDN build complete')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
