/**
 * Component Manifest Type Definition
 *
 * Each component includes a manifest.json that describes its metadata.
 * The manifest is copied to CDN alongside the bundled JS file.
 */

/**
 * Attribute definition in the manifest
 */
export interface ManifestAttribute {
  /** Attribute name (kebab-case for HTML attributes) */
  name: string
  /** TypeScript/JSON type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  /** Whether this attribute is required */
  required?: boolean
  /** Default value if not provided */
  default?: unknown
  /** Human-readable description */
  description?: string
}

/**
 * Component manifest structure
 */
export interface ComponentManifest {
  /** Component name (same as directory name) */
  name: string
  /** Human-readable display name */
  displayName: string
  /** Component description */
  description: string
  /** Version of the component */
  version: string
  /** Custom element tag name */
  tagName: string
  /** Attributes the component accepts */
  attributes: ManifestAttribute[]
  /** Component category for organization */
  category?: string
  /** Keywords for searchability */
  keywords?: string[]
  /** Author information */
  author?: string
  /** License */
  license?: string
}
