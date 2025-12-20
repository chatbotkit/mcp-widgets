/**
 * Widgets Index
 *
 * Re-export all widgets for library usage
 */

// Web Component (no React dependency)
export { DataCardElement, register as registerDataCard } from './data-card'
export type { StatusType as DataCardStatusType } from './data-card'

// React Component
export { RichDataCard } from './rich-data-card'
export type {
  RichDataCardProps,
  Section,
  StatusType as RichDataCardStatusType,
} from './rich-data-card'
