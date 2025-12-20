/**
 * Component Type Definitions
 */

import type { ComponentManifest } from './manifest'

/**
 * Base props that all MCP UI components receive
 */
export interface MCPComponentProps {
  /** The tool name this component is rendering for */
  toolName?: string
  /** Additional class names */
  className?: string
}

/**
 * Component definition for internal use
 */
export interface ComponentDefinition<P extends MCPComponentProps> {
  /** The React component */
  Component: React.ComponentType<P>
  /** The component manifest */
  manifest: ComponentManifest
}
