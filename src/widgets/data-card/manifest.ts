import { defineManifest, z } from '../../types/manifest'

/**
 * Props schema for the DataCard widget
 *
 * This schema is used for:
 * 1. Type inference in TypeScript
 * 2. Runtime validation of props
 * 3. JSON Schema generation for the manifest
 */
export const propsSchema = z.object({
  /** Optional title displayed at the top of the card */
  title: z.string().optional().describe('Card title'),

  /** JSON data to display as key-value pairs */
  data: z
    .record(z.unknown())
    .optional()
    .describe('Data object to display as key-value pairs'),

  /** Status indicator styling */
  status: z
    .enum(['success', 'error', 'warning', 'info'])
    .optional()
    .describe('Status indicator that changes card styling'),
})

/** Inferred props type from the schema */
export type DataCardProps = z.infer<typeof propsSchema>

/**
 * Widget manifest
 */
export const manifest = defineManifest({
  name: 'data-card',
  displayName: 'Data Card',
  description:
    'A minimal card widget for displaying structured data. Pure Web Component with no dependencies.',
  version: '0.0.1',
  tagName: 'mcp-data-card',
  framework: 'web-component',
  category: 'data-display',
  keywords: ['data', 'card', 'key-value', 'display'],
  propsSchema,
})
