#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const srcDir = join(root, 'packages/types/src');
const destDir = join(
  root,
  'packages/supabase/supabase/functions/_shared/types',
);

// Files to copy (skip mcp.ts due to @modelcontextprotocol/sdk dependency)
const filesToCopy = ['database.ts', 'fieldmcp.ts', 'john-deere.ts'];

/**
 * Transforms a type file for Deno compatibility and adds header comment.
 * @param {string} content - Original file content
 * @param {string} filename - Source filename for header
 * @returns {string} Transformed content
 */
function transformForDeno(content, filename) {
  // Transform .js imports to .ts for Deno
  const transformed = content.replace(/from '\.\/(.+)\.js'/g, "from './$1.ts'");
  const header = `// AUTO-GENERATED - DO NOT EDIT\n// Source: packages/types/src/${filename}\n// Run: pnpm copy-types\n\n`;
  return header + transformed;
}

try {
  mkdirSync(destDir, { recursive: true });

  for (const file of filesToCopy) {
    const srcPath = join(srcDir, file);
    const destPath = join(destDir, file);

    const content = readFileSync(srcPath, 'utf-8');
    const transformed = transformForDeno(content, file);
    writeFileSync(destPath, transformed);
  }

  // Create index.ts barrel
  const indexContent = `// AUTO-GENERATED - DO NOT EDIT
export * from './database.ts';
export * from './fieldmcp.ts';
export * from './john-deere.ts';
`;
  writeFileSync(join(destDir, 'index.ts'), indexContent);

  console.log('✓ Types copied to _shared/types/');
} catch (err) {
  console.error(`✗ Failed to copy types: ${err.message}`);
  process.exit(1);
}
