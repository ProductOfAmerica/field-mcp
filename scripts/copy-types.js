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

mkdirSync(destDir, { recursive: true });

for (const file of filesToCopy) {
  let content = readFileSync(join(srcDir, file), 'utf-8');
  // Transform .js imports to .ts for Deno
  content = content.replace(/from '\.\/(.+)\.js'/g, "from './$1.ts'");
  // Add header comment
  content = `// AUTO-GENERATED - DO NOT EDIT\n// Source: packages/types/src/${file}\n// Run: pnpm copy-types\n\n${content}`;
  writeFileSync(join(destDir, file), content);
}

// Create index.ts barrel
const indexContent = `// AUTO-GENERATED - DO NOT EDIT
export * from './database.ts';
export * from './fieldmcp.ts';
export * from './john-deere.ts';
`;
writeFileSync(join(destDir, 'index.ts'), indexContent);

console.log('✓ Types copied to _shared/types/');
