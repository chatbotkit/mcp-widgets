/**
 * Widget Manifest Type Definition
 *
 * Each widget includes a manifest.ts that defines its metadata and props schema.
 * The manifest is converted to JSON Schema at build time.
 */

import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

/**
 * Framework type for the widget
 */
export type ComponentFramework = 'web-component' | 'react'

/**
 * Widget category for organization
 */
export type ComponentCategory = 'data-display' | 'feedback' | 'input' | 'layout' | 'navigation' | 'other'

/**
 * Base manifest metadata (without the props schema)
 */
export interface ManifestMetadata {
  /** Widget name (same as directory name, kebab-case) */
  name: string
  /** Human-readable display name */
  displayName: string
  /** Widget description */
  description: string
  /** Version of the widget */
  version: string
  /** Custom element tag name (must include hyphen) */
  tagName: string
  /** Whether the widget uses React or is a pure Web Component */
  framework: ComponentFramework
  /** Widget category for organization */
  category?: ComponentCategory
  /** Keywords for searchability */
  keywords?: string[]
  /** Author information */
  author?: string
  /** License */
  license?: string
}

/**
 * Full widget manifest with Zod props schema
 */
export interface WidgetManifest<T extends z.ZodTypeAny = z.ZodTypeAny> extends ManifestMetadata {
  /** Zod schema for widget props - used for validation and JSON Schema generation */
  propsSchema: T
}

/**
 * Helper to define a widget manifest with type inference
 */
export function defineManifest<T extends z.ZodTypeAny>(
  manifest: WidgetManifest<T>
): WidgetManifest<T> {
  return manifest
}

/**
 * Convert a Zod schema to JSON Schema for the manifest output
 */
export function propsSchemaToJsonSchema(schema: z.ZodTypeAny): object {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return zodToJsonSchema(schema as any, {
    $refStrategy: 'none',
    target: 'jsonSchema7',
  })
}

/**
 * Generate the JSON manifest from a TypeScript manifest
 * This is used by the build script to create the .manifest.json files
 */
export function generateJsonManifest(manifest: WidgetManifest): object {
  const { propsSchema, ...metadata } = manifest
  return {
    ...metadata,
    propsSchema: propsSchemaToJsonSchema(propsSchema),
  }
}

/**
 * Validate props against a manifest's schema
 * Returns parsed props or throws ZodError
 */
export function validateProps<T extends z.ZodTypeAny>(
  manifest: WidgetManifest<T>,
  props: unknown
): z.infer<T> {
  return manifest.propsSchema.parse(props)
}

/**
 * Safely validate props, returning a result object instead of throwing
 */
export function safeValidateProps<T extends z.ZodTypeAny>(
  manifest: WidgetManifest<T>,
  props: unknown
) {
  return manifest.propsSchema.safeParse(props)
}

// Re-export zod for convenience
export { z }
