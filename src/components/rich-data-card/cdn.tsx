/**
 * CDN entry point for rich-data-card component
 *
 * This file is bundled by esbuild into a self-contained IIFE
 * that includes React and registers a web component wrapper.
 */

import { RichDataCard, type RichDataCardProps, type Section } from './RichDataCard'
import { registerComponent } from '../../utils/register'
import './styles.css'

// Register as a web component
registerComponent<RichDataCardProps>(RichDataCard, {
  tagName: 'mcp-rich-data-card',
  observedAttributes: ['title', 'description', 'icon', 'data', 'sections', 'footer', 'status'],
  // Transform string attributes to props
  attributeToProps: (attrs) => ({
    title: attrs.title ?? undefined,
    description: attrs.description ?? undefined,
    icon: attrs.icon ?? undefined,
    data: attrs.data ? JSON.parse(attrs.data) : undefined,
    sections: attrs.sections ? (JSON.parse(attrs.sections) as Section[]) : undefined,
    footer: attrs.footer ?? undefined,
    status: (attrs.status as RichDataCardProps['status']) ?? undefined,
  }),
})
