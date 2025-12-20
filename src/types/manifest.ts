/**
 * Component Manifest Type Definition
 *
 * Each component includes a manifest.ts that defines its metadata and props schema.
 * The manifest is converted to JSON Schema at build time.
 */

import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

/**
 * Framework type for the component
 */
export type ComponentFramework = 'web-component' | 'react'

/**
 * Component category for organization
 */
export type ComponentCategory = 'data-display' | 'feedback' | 'input' | 'layout' | 'navigation' | 'other'

/**
 * Base manifest metadata (without the props schema)
 */
export interface ManifestMetadata {
  /** Component name (same as directory name, kebab-case) */
  name: string
  /** Human-readable display name */
  displayName: string
  /** Component description */
  description: string
  /** Version of the component */
  version: string
  /** Custom element tag name (must include hyphen) */
  tagName: string
  /** Whether the component uses React or is a pure Web Component */
  framework: ComponentFramework
  /** Component category for organization */
  category?: ComponentCategory
  /** Keywords for searchability */
  keywords?: string[]
  /** Author information */
  author?: string
  /** License */
  license?: string
}

/**
 * Full component manifest with Zod props schema
 */
export interface ComponentManifest<T extends z.ZodTypeAny = z.ZodTypeAny> extends ManifestMetadata {
  /** Zod schema for component props - used for validation and JSON Schema generation */
  propsSchema: T
}

/**
 * Helper to define a component manifest with type inference
 */
export function defineManifest<T extends z.ZodTypeAny>(
  manifest: ComponentManifest<T>
): ComponentManifest<T> {
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
export function generateJsonManifest(manifest: ComponentManifest): object {
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
  manifest: ComponentManifest<T>,
  props: unknown
): z.infer<T> {
  return manifest.propsSchema.parse(props)
}

/**
 * Safely validate props, returning a result object instead of throwing
 */
export function safeValidateProps<T extends z.ZodTypeAny>(
  manifest: ComponentManifest<T>,
  props: unknown
) {
  return manifest.propsSchema.safeParse(props)
}

// Re-export zod for convenience
export { z }

