# @chatbotkit/mcp-ui-components

UI components for rendering MCP (Model Context Protocol) tool responses in AI assistants like ChatGPT.

## Overview

When an MCP tool returns data, AI assistants can display it using custom UI components instead of plain text. This package provides ready-to-use components that can be embedded via a simple `<script>` tag.

## Installation

```bash
npm install @chatbotkit/mcp-ui-components
# or
pnpm add @chatbotkit/mcp-ui-components
```

## Components

| Component        | Framework     | Size   | Description                                |
| ---------------- | ------------- | ------ | ------------------------------------------ |
| `data-card`      | Web Component | ~3KB   | Simple key-value data display              |
| `rich-data-card` | React         | ~148KB | Enhanced card with sections, icons, footer |

## Usage

### CDN Embedding (for MCP tools)

Load components via CDN and use them as custom HTML elements:

```html
<!-- Load the component -->
<script src="https://unpkg.com/@chatbotkit/mcp-ui-components/cdn/data-card.js"></script>

<!-- Use it -->
<mcp-data-card
  title="Weather"
  data='{"temperature": "72°F", "conditions": "Sunny"}'
  status="success"
></mcp-data-card>
```

### As a React Library

```tsx
import { RichDataCard } from '@chatbotkit/mcp-ui-components'

function MyComponent() {
  return (
    <RichDataCard
      title="Order Summary"
      icon="🛒"
      data={{ orderId: '#12345', total: '$89.99' }}
      sections={[{ title: 'Shipping', data: { method: 'Express' } }]}
      status="success"
    />
  )
}
```

## How Embedding Works

### The MCP Tool Response Flow

1. **User asks a question** in ChatGPT (e.g., "What's the weather?")
2. **ChatGPT calls your MCP tool** which returns structured data
3. **Your tool response includes HTML** with a `<script>` tag pointing to a CDN-hosted component
4. **ChatGPT renders the HTML** in a sandboxed iframe
5. **The component loads and displays** the data visually

### Example MCP Tool Response

When your MCP server handles a tool call, return HTML that embeds a component:

```javascript
// In your MCP server tool handler
function handleWeatherTool(location) {
  const data = fetchWeather(location)

  return {
    content: [
      {
        type: 'text',
        text: `
        <script src="https://unpkg.com/@chatbotkit/mcp-ui-components/cdn/data-card.js"></script>
        <mcp-data-card
          title="Weather in ${location}"
          data='${JSON.stringify(data)}'
          status="success"
        ></mcp-data-card>
      `,
      },
    ],
  }
}
```

### OpenAI Skybridge API

Components can communicate with the ChatGPT host via the `window.openai` object (when available):

```javascript
// Notify ChatGPT of content height changes
window.openai.notifyHeight()

// Access tool response metadata
const metadata = window.openai.getToolResponseMetadata()
```

### Security Considerations

- Components run in a sandboxed iframe with limited capabilities
- Data is passed via HTML attributes (must be JSON-stringified)
- No direct access to the parent page or user session
- CDN URLs should use HTTPS

## Component Reference

### `<mcp-data-card>`

A lightweight Web Component (no React dependency).

| Attribute | Type                                        | Description                |
| --------- | ------------------------------------------- | -------------------------- |
| `title`   | string                                      | Card title                 |
| `data`    | JSON string                                 | Key-value pairs to display |
| `status`  | `success` \| `error` \| `warning` \| `info` | Status indicator styling   |

### `<mcp-rich-data-card>`

A React-based component with more features.

| Attribute     | Type                                        | Description                       |
| ------------- | ------------------------------------------- | --------------------------------- |
| `title`       | string                                      | Card title                        |
| `description` | string                                      | Subtitle text                     |
| `icon`        | string                                      | Emoji or icon character           |
| `data`        | JSON string                                 | Main data section                 |
| `sections`    | JSON string                                 | Array of `{title, data}` sections |
| `footer`      | string                                      | Footer text                       |
| `status`      | `success` \| `error` \| `warning` \| `info` | Status styling                    |

## Development

```bash
# Install dependencies
pnpm install

# Start Storybook
pnpm dev

# Run tests
pnpm test

# Build everything
pnpm build

# Build CDN bundles only
pnpm build:cdn
```

## Creating New Components

1. Create a folder in `src/components/{component-name}/`
2. Add required files:
   - `ComponentName.ts` (Web Component) or `ComponentName.tsx` (React)
   - `manifest.json` - Component metadata
   - `cdn.ts` or `cdn.tsx` - CDN entry point
   - `index.ts` - Library export
3. Export from `src/components/index.ts`
4. Run `pnpm build` to generate bundles

## Forking & Custom Collections

This repository is designed to be forked! You have two options:

### Option 1: Private Component Collection

Fork this repo to create your own private component library:

1. **Fork** this repository to your GitHub account/organization
2. **Add your components** following the structure above
3. **Host privately** by publishing to a private npm registry or serving CDN bundles from your own infrastructure
4. **Use in your MCP tools** by pointing to your private CDN URLs

This is ideal for:

- Proprietary UI components with custom branding
- Internal tools with sensitive designs
- Components that integrate with private APIs

### Option 2: Contribute Back

We welcome community contributions! If you build a component that could benefit others:

1. **Fork** this repository
2. **Create your component** following the existing patterns
3. **Add tests and Storybook stories**
4. **Submit a Pull Request** with a description of your component

Good candidates for community components:

- Generic data visualizations (charts, tables, maps)
- Common tool response patterns (search results, confirmations)
- Accessibility improvements
- Performance optimizations

### Hosting Your Own CDN

If you fork and want to self-host your CDN bundles:

```bash
# Build the CDN bundles
pnpm build:cdn

# The cdn/ directory contains all bundles
# Upload to your preferred hosting:
# - GitHub Pages
# - Cloudflare R2/Pages
# - AWS S3 + CloudFront
# - Vercel/Netlify
```

Then reference your hosted bundles in MCP tool responses:

```html
<script src="https://your-cdn.example.com/components/my-component.js"></script>
```

## License

MIT
