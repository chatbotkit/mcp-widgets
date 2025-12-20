/**
 * ChatGPT Widget Loader
 *
 * This loader handles widget instantiation for OpenAI's ChatGPT environment.
 * It extracts props from OpenAI's tool response metadata and renders the widget
 * with the correct attributes.
 *
 * The widget script must be loaded separately via a script tag.
 *
 * Usage in HTML:
 * ```html
 * <script src="https://cdn.example.com/widgets/data-card.js"></script>
 * <script src="https://cdn.example.com/loaders/chatgpt.js"></script>
 * <script>
 *   MCPWidgets.render('mcp-data-card');
 * </script>
 * ```
 */

// @note OpenAI globals are declared in ../types/openai.ts

declare global {
  interface Window {
    MCPWidgets?: typeof MCPWidgets
  }
}

export interface RenderOptions {
  /**
   * Optional container element to append the widget to (defaults to document.body)
   */
  container?: HTMLElement

  /**
   * Optional additional props to merge with OpenAI metadata
   */
  props?: Record<string, unknown>
}

/**
 * Convert camelCase to kebab-case for HTML attributes
 */
function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

/**
 * Get props from OpenAI's tool response metadata
 */
function getProps(): Record<string, unknown> {
  const meta = window.openai?.toolResponseMetadata || {}
  return (meta._meta as Record<string, unknown>) || {}
}

/**
 * Notify OpenAI of content height changes
 */
function notifyHeight(): void {
  if (window.openai?.notifyIntrinsicHeight) {
    window.openai.notifyIntrinsicHeight(document.body.scrollHeight)
  }
}

/**
 * Create and configure a widget element with the given props
 */
function createElement(
  tagName: string,
  props: Record<string, unknown>
): HTMLElement {
  const widget = document.createElement(tagName)

  Object.entries(props).forEach(([key, value]) => {
    if (value === undefined || value === null) return

    const attrName = toKebabCase(key)
    const attrValue =
      typeof value === 'object' ? JSON.stringify(value) : String(value)

    widget.setAttribute(attrName, attrValue)
  })

  return widget
}

/**
 * Set up a MutationObserver to notify OpenAI of height changes
 */
function observeHeightChanges(): void {
  if (!window.openai?.notifyIntrinsicHeight) return

  const observer = new MutationObserver(() => {
    notifyHeight()
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  })

  // @note initial height notification after short delay

  setTimeout(notifyHeight, 100)
}

/**
 * Render a widget with props from OpenAI metadata
 *
 * @param tagName - The custom element tag name (e.g., 'mcp-data-card')
 * @param options - Optional render configuration
 * @returns The created widget element
 */
function render(tagName: string, options: RenderOptions = {}): HTMLElement {
  const { container = document.body, props = {} } = options

  // Get props from OpenAI metadata and merge with provided props

  const openaiProps = getProps()
  const mergedProps = { ...openaiProps, ...props }

  // Create and append the widget

  const widget = createElement(tagName, mergedProps)

  container.appendChild(widget)

  // Set up height observation for OpenAI

  observeHeightChanges()

  return widget
}

// Expose the loader globally

const MCPWidgets = {
  render,
  getProps,
  createElement,
  notifyHeight,
}

window.MCPWidgets = MCPWidgets

export default MCPWidgets
