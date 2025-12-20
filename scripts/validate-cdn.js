/**
 * CDN Bundle Validation Script
 *
 * This script validates that CDN bundles are correctly built and functional.
 * Run after `pnpm build:cdn` to verify the output.
 *
 * Checks performed:
 * 1. Bundle files exist
 * 2. Bundle files are valid JavaScript (can be parsed)
 * 3. Manifest files exist and contain valid JSON
 * 4. Manifests have required fields
 * 5. Custom element registration code is present
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CDN_DIR = path.join(__dirname, '..', 'cdn')

/** Required fields in manifest */
const REQUIRED_MANIFEST_FIELDS = [
  'name',
  'displayName',
  'description',
  'version',
  'tagName',
  'framework',
  'propsSchema',
]

/** Expected widgets to validate */
const EXPECTED_WIDGETS = ['data-card', 'rich-data-card']

let hasErrors = false

function logSuccess(message) {
  console.log(`  ✓ ${message}`)
}

function logError(message) {
  console.error(`  ✗ ${message}`)
  hasErrors = true
}

function logInfo(message) {
  console.log(`  ℹ ${message}`)
}

/**
 * Check if a file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Validate a JavaScript bundle
 */
async function validateBundle(widgetName) {
  const bundlePath = path.join(CDN_DIR, `${widgetName}.js`)

  // Check file exists
  if (!(await fileExists(bundlePath))) {
    logError(`Bundle not found: ${widgetName}.js`)
    return false
  }

  const content = await fs.readFile(bundlePath, 'utf8')
  const stats = await fs.stat(bundlePath)

  // Check file is not empty
  if (content.length === 0) {
    logError(`Bundle is empty: ${widgetName}.js`)
    return false
  }

  // Check it's valid JavaScript by attempting to parse
  // We can't fully execute it without a browser, but we can check syntax
  try {
    // Use Function constructor to parse (doesn't execute)
    // eslint-disable-next-line no-new-func
    new Function(content)
    logSuccess(`Bundle is valid JS: ${widgetName}.js (${formatSize(stats.size)})`)
  } catch (err) {
    logError(`Bundle has syntax errors: ${widgetName}.js - ${err.message}`)
    return false
  }

  // Check for custom element registration
  const tagName = `mcp-${widgetName}`
  if (!content.includes(tagName) && !content.includes('customElements')) {
    logError(`Bundle may not register custom element: ${widgetName}.js`)
    return false
  }

  return true
}

/**
 * Validate a manifest file
 */
async function validateManifest(widgetName) {
  const manifestPath = path.join(CDN_DIR, `${widgetName}.manifest.json`)

  // Check file exists
  if (!(await fileExists(manifestPath))) {
    logError(`Manifest not found: ${widgetName}.manifest.json`)
    return false
  }

  const content = await fs.readFile(manifestPath, 'utf8')

  // Check it's valid JSON
  let manifest
  try {
    manifest = JSON.parse(content)
    logSuccess(`Manifest is valid JSON: ${widgetName}.manifest.json`)
  } catch (err) {
    logError(`Manifest has invalid JSON: ${widgetName}.manifest.json - ${err.message}`)
    return false
  }

  // Check required fields
  const missingFields = REQUIRED_MANIFEST_FIELDS.filter(
    (field) => !(field in manifest)
  )
  if (missingFields.length > 0) {
    logError(`Manifest missing fields: ${missingFields.join(', ')}`)
    return false
  }

  // Check tagName format
  if (!manifest.tagName.startsWith('mcp-')) {
    logError(`Manifest tagName should start with 'mcp-': ${manifest.tagName}`)
    return false
  }

  // Check propsSchema has expected structure
  if (typeof manifest.propsSchema !== 'object') {
    logError(`Manifest propsSchema should be an object`)
    return false
  }

  logSuccess(`Manifest has all required fields`)
  logInfo(`  → ${manifest.displayName} v${manifest.version} (${manifest.framework})`)

  return true
}

/**
 * Format file size
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Check for unexpected files in CDN directory
 */
async function checkForUnexpectedFiles() {
  const files = await fs.readdir(CDN_DIR)

  const expectedFiles = new Set([
    'test.html', // Test file is optional
    ...EXPECTED_WIDGETS.map((w) => `${w}.js`),
    ...EXPECTED_WIDGETS.map((w) => `${w}.manifest.json`),
  ])

  const unexpected = files.filter((f) => !expectedFiles.has(f))
  if (unexpected.length > 0) {
    logInfo(`Unexpected files in cdn/: ${unexpected.join(', ')}`)
  }
}

/**
 * Main validation
 */
async function main() {
  console.log('\n🔍 Validating CDN bundles...\n')

  // Check CDN directory exists
  if (!(await fileExists(CDN_DIR))) {
    console.error('❌ CDN directory not found. Run `pnpm build:cdn` first.')
    process.exit(1)
  }

  // Validate each widget
  for (const widget of EXPECTED_WIDGETS) {
    console.log(`\n📦 ${widget}:`)
    await validateBundle(widget)
    await validateManifest(widget)
  }

  // Check for unexpected files
  console.log('\n📁 Directory check:')
  await checkForUnexpectedFiles()

  // Summary
  console.log('\n' + '─'.repeat(50))
  if (hasErrors) {
    console.error('\n❌ Validation failed! See errors above.\n')
    process.exit(1)
  } else {
    console.log('\n✅ All CDN bundles validated successfully!\n')
  }
}

main().catch((err) => {
  console.error('Validation script error:', err)
  process.exit(1)
})
