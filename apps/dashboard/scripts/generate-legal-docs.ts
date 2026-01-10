#!/usr/bin/env npx tsx
/**
 * Generates PDF and DOCX versions of legal documents.
 * Replaces placeholders with values from .env.local.
 *
 * Usage:
 *   pnpm --filter dashboard legal:pdf
 *   pnpm --filter dashboard legal:docx
 *   pnpm --filter dashboard legal:all
 *
 * Requires Pandoc to be installed:
 *   Windows: choco install pandoc
 *   Mac: brew install pandoc
 *
 * Environment variables (set in .env.local):
 *   LEGAL_COMPANY_NAME="FieldMCP"
 *   LEGAL_CONTACT_EMAIL="legal@fieldmcp.com"
 *   LEGAL_PHYSICAL_ADDRESS="123 Main St, Kansas City, MO 64101"
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LEGAL_DIR = path.join(process.cwd(), 'legal');

const DOCUMENTS = ['terms-of-service.md', 'privacy-policy.md'];

/**
 * Load environment variables from .env.local
 */
function loadEnvFile(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.warn('⚠ No .env.local found - placeholders will not be replaced\n');
    return;
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function processMarkdown(content: string): string {
  let result = content;

  // Replace date placeholder
  const today = formatDate(new Date());
  result = result.replaceAll('[EFFECTIVE_DATE]', today);

  // Replace other placeholders from env vars
  const placeholders: Record<string, string | undefined> = {
    '[COMPANY_NAME]': process.env.LEGAL_COMPANY_NAME,
    '[CONTACT_EMAIL]': process.env.LEGAL_CONTACT_EMAIL,
    '[PHYSICAL_ADDRESS]': process.env.LEGAL_PHYSICAL_ADDRESS,
  };

  for (const [placeholder, value] of Object.entries(placeholders)) {
    if (value) {
      result = result.replaceAll(placeholder, value);
    }
  }

  return result;
}

function generateDocs(format: 'pdf' | 'docx') {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'legal-'));

  for (const doc of DOCUMENTS) {
    const inputPath = path.join(LEGAL_DIR, doc);
    const baseName = doc.replace('.md', '');
    const outputPath = path.join(LEGAL_DIR, `${baseName}.${format}`);

    // Read and process markdown
    const rawContent = fs.readFileSync(inputPath, 'utf-8');
    const processedContent = processMarkdown(rawContent);

    // Write to temp file
    const tempFile = path.join(tempDir, doc);
    fs.writeFileSync(tempFile, processedContent);

    // Generate output with Pandoc
    try {
      execSync(`pandoc "${tempFile}" -o "${outputPath}"`, { stdio: 'inherit' });
      console.log(`✓ Generated ${baseName}.${format}`);
    } catch {
      console.error(`✗ Failed to generate ${baseName}.${format}`);
      console.error(
        '  Make sure Pandoc is installed: https://pandoc.org/installing.html',
      );
      process.exit(1);
    }
  }

  // Cleanup temp dir
  fs.rmSync(tempDir, { recursive: true });
}

// Load env vars from .env.local
loadEnvFile();

// Generate files
console.log('Generating PDF and DOCX files...\n');
generateDocs('pdf');
generateDocs('docx');

console.log('\nDone!');
