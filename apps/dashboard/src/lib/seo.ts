import type { Metadata } from 'next';

/**
 * Single source of truth for all site/brand information used in SEO.
 */
export const site = {
  name: 'FieldMCP',
  title: 'FieldMCP - Agricultural API Platform',
  tagline: 'Connect your AI to farm data in minutes, not weeks.',
  taglineShort: 'Connect your AI to farm data in minutes',
  description:
    'MCP infrastructure platform for agricultural APIs. Integrate with John Deere, Climate FieldView, and more through a unified, LLM-ready interface.',
  locale: 'en_US',
  twitter: {
    card: 'summary_large_image' as const,
    // handle: '@fieldmcp', // Add when available
  },
} as const;

/**
 * Get the base URL for the site.
 * Uses VERCEL_PROJECT_PRODUCTION_URL in production, falls back to localhost.
 */
export function getBaseUrl(): string {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return 'http://localhost:3000';
}

/**
 * SEO keywords for the site.
 */
export const seoKeywords = [
  // Core product terms
  'FieldMCP',
  'agricultural API',
  'farm data API',
  'farming API',
  'agriculture API platform',
  // MCP-related
  'MCP server',
  'MCP infrastructure',
  'Model Context Protocol',
  'MCP agricultural',
  'MCP farming',
  // AI/LLM integration
  'AI farming',
  'AI agriculture',
  'LLM farm data',
  'AI farm integration',
  'Claude farm data',
  'GPT agriculture',
  'AI agricultural data',
  'machine learning farming',
  // John Deere specific
  'John Deere API',
  'John Deere integration',
  'John Deere Operations Center',
  'John Deere data',
  'John Deere MCP',
  'Deere API integration',
  // Climate FieldView
  'Climate FieldView',
  'Climate FieldView API',
  'FieldView integration',
  'Climate Corporation',
  // Precision agriculture
  'precision agriculture',
  'precision farming',
  'smart farming',
  'digital agriculture',
  'agtech',
  'agricultural technology',
  'farm technology',
  // Data types
  'field data',
  'crop data',
  'harvest data',
  'yield data',
  'farm equipment data',
  'agricultural sensors',
  'field boundaries',
  'planting data',
  // Developer-focused
  'farm data SDK',
  'agricultural SDK',
  'farm API integration',
  'agriculture developer tools',
  'ag data platform',
  // Use cases
  'farm management software',
  'agricultural analytics',
  'crop analytics',
  'farm insights',
  'agricultural decision support',
] as const;

/**
 * Shared metadata configuration for the root layout.
 * This is the base metadata that all pages inherit from.
 */
export function createRootMetadata(baseUrl: string): Metadata {
  return {
    metadataBase: new URL(baseUrl),
    applicationName: site.name,
    title: {
      default: site.title,
      template: `%s | ${site.name}`,
    },
    description: site.tagline,
    keywords: seoKeywords as unknown as string[],
    authors: [{ name: `${site.name} Team` }],
    creator: site.name,
    publisher: site.name,
    category: 'technology',
    alternates: {
      canonical: '/',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    appleWebApp: {
      title: site.name,
    },
    openGraph: {
      title: site.title,
      description: site.tagline,
      type: 'website',
      url: '/',
      siteName: site.name,
      locale: site.locale,
    },
    twitter: {
      card: site.twitter.card,
      title: site.title,
      description: site.tagline,
    },
  };
}

/**
 * Create page-specific metadata that merges with root defaults.
 * Use this in individual page.tsx files.
 */
export function createPageMetadata(page: {
  title: string;
  description: string;
  openGraph?: {
    title?: string;
    description?: string;
  };
}): Metadata {
  return {
    title: page.title,
    description: page.description,
    openGraph: page.openGraph
      ? {
          title: page.openGraph.title ?? page.title,
          description: page.openGraph.description ?? page.description,
        }
      : undefined,
  };
}
