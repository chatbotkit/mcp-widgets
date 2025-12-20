import { defineManifest, z } from '../../types/manifest'

/**
 * Section schema - a named group of data
 */
export const sectionSchema = z.object({
  /** Section title */
  title: z.string().describe('Section heading'),
  /** Section data */
  data: z.record(z.unknown()).describe('Key-value data for this section'),
})

/**
 * Props schema for the RichDataCard component
 *
 * This schema is used for:
 * 1. Type inference in TypeScript
 * 2. Runtime validation of props
 * 3. JSON Schema generation for the manifest
 */
export const propsSchema = z.object({
  /** Title displayed at the top of the card */
  title: z.string().optional().describe('Card title'),

  /** Description text below the title */
  description: z.string().optional().describe('Subtitle or description text'),

  /** Icon/emoji to display in the header */
  icon: z
    .string()
    .optional()
    .describe('Icon or emoji character for the header'),

  /** Main data to display as key-value pairs */
  data: z
    .record(z.unknown())
    .optional()
    .describe('Main data section as key-value pairs'),

  /** Named sections with their own data */
  sections: z
    .array(sectionSchema)
    .optional()
    .describe('Additional named sections'),

  /** Footer text */
  footer: z
    .string()
    .optional()
    .describe('Footer text at the bottom of the card'),

  /** Status indicator styling */
  status: z
    .enum(['success', 'error', 'warning', 'info'])
    .optional()
    .describe('Status indicator that changes card styling'),

  /** Additional CSS class */
  className: z.string().optional().describe('Additional CSS class name'),
})

/** Inferred props type from the schema */
export type RichDataCardProps = z.infer<typeof propsSchema>

/** Inferred section type */
export type Section = z.infer<typeof sectionSchema>

/**
 * Component manifest
 */
export const manifest = defineManifest({
  name: 'rich-data-card',
  displayName: 'Rich Data Card',
  description:
    'An enhanced data card with support for descriptions, sections, icons, and status indicators. Built with React.',
  version: '0.0.1',
  tagName: 'mcp-rich-data-card',
  framework: 'react',
  category: 'data-display',
  keywords: ['data', 'card', 'sections', 'rich', 'react'],
  propsSchema,
})
