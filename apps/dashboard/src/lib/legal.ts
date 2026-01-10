import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Formats a date as "Month Day, Year" (e.g., "January 10, 2026")
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Placeholder values from environment variables.
 * Set these in .env.local:
 *   LEGAL_COMPANY_NAME="FieldMCP"
 *   LEGAL_CONTACT_EMAIL="legal@fieldmcp.com"
 *   LEGAL_PHYSICAL_ADDRESS="123 Main St, Kansas City, MO 64101"
 */
const PLACEHOLDERS: Record<string, string | undefined> = {
  '[EFFECTIVE_DATE]': undefined, // Set dynamically
  '[COMPANY_NAME]': process.env.LEGAL_COMPANY_NAME,
  '[CONTACT_EMAIL]': process.env.LEGAL_CONTACT_EMAIL,
  '[PHYSICAL_ADDRESS]': process.env.LEGAL_PHYSICAL_ADDRESS,
};

/**
 * Reads a legal document and replaces placeholders with actual values
 */
export async function getLegalDocument(filename: string): Promise<string> {
  const filePath = path.join(process.cwd(), 'legal', filename);
  let content = await fs.readFile(filePath, 'utf-8');

  // Replace date placeholder
  const today = formatDate(new Date());
  content = content.replaceAll('[EFFECTIVE_DATE]', today);

  // Replace other placeholders from env vars
  for (const [placeholder, value] of Object.entries(PLACEHOLDERS)) {
    if (value) {
      content = content.replaceAll(placeholder, value);
    }
  }

  return content;
}
