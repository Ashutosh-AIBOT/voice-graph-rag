export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const POLLING_INTERVAL_MS = 4000;

// Mapped directly to the HSL values in globals.css (Phase 32 Token System)
export const ENTITY_COLORS: Record<string, string> = {
  PERSON: 'hsl(221, 100%, 71%)',
  ORGANIZATION: 'hsl(146, 61%, 59%)',
  PRODUCT: 'hsl(28, 82%, 67%)',
  TECHNOLOGY: 'hsl(249, 93%, 77%)',
  LOCATION: 'hsl(45, 86%, 62%)',
  EVENT: 'hsl(336, 85%, 66%)',
  CONCEPT: 'hsl(319, 73%, 66%)',
  DOCUMENT: 'hsl(174, 61%, 59%)',
  
  // Fallbacks using the primary palette
  SYSTEM: 'hsl(28, 82%, 67%)',
  MODULE: 'hsl(249, 93%, 77%)',
  SERVICE: 'hsl(146, 61%, 59%)',
  COMPONENT: 'hsl(221, 100%, 71%)',
  TEAM: 'hsl(221, 100%, 71%)',
  PROJECT: 'hsl(45, 86%, 62%)',
  DATABASE: 'hsl(319, 73%, 66%)',
  API: 'hsl(249, 93%, 77%)',
  FRAMEWORK: 'hsl(249, 93%, 77%)',
  LIBRARY: 'hsl(319, 73%, 66%)',
  INFRASTRUCTURE: 'hsl(174, 61%, 59%)',
  DEPARTMENT: 'hsl(146, 61%, 59%)',
  COMPANY: 'hsl(146, 61%, 59%)',
  EMPLOYEE: 'hsl(221, 100%, 71%)',
  USER: 'hsl(221, 100%, 71%)',
  DATE: 'hsl(240, 8%, 57%)',
  UNKNOWN: 'hsl(240, 8%, 57%)',
};

export const ENTITY_TYPES = Object.keys(ENTITY_COLORS);

export const RELATIONSHIP_TYPES = [
  'WORKS_AT', 'MANAGES', 'PART_OF', 'DEPENDS_ON', 'CREATED_BY',
  'LOCATED_IN', 'RELATED_TO', 'COMPETES_WITH', 'PARTNER_OF',
  'SUCCEEDED_BY', 'BUILT_BY', 'LEADS', 'IMPLEMENTED_BY', 'USES',
  'CONTAINS', 'BELONGS_TO', 'OWNS', 'DEVELOPS', 'DEPLOYS',
  'TESTS', 'MAINTAINS', 'SUPPORTS', 'INTEGRATES_WITH', 'CALLS',
  'INVOKES', 'TRIGGERS', 'REQUIRES', 'EXTENDS', 'IMPLEMENTS',
  'INHERITS', 'COMPOSED_OF', 'GENERATES', 'PRODUCES', 'CONSUMES',
  'SENDS', 'RECEIVES', 'STORES', 'READS', 'WRITES', 'CONFIGURES',
  'MONITORS', 'LOGS', 'TRANSFORMS', 'VALIDATES', 'TRANSFERS',
  'ROUTES', 'CONNECTS', 'ASSIGNS', 'DELEGATES', 'AUTHORIZES',
  'AUTHENTICATES',
];

const EXTRA_COLORS: string[] = [
  'hsl(174, 61%, 59%)', 'hsl(28, 82%, 67%)', 'hsl(249, 93%, 77%)', 
  'hsl(336, 85%, 66%)', 'hsl(146, 61%, 59%)', 'hsl(45, 86%, 62%)', 
  'hsl(319, 73%, 66%)', 'hsl(221, 100%, 71%)'
];

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function entityColor(type: string): string {
  if (!type) return 'hsl(240, 8%, 57%)';
  const upper = type.toUpperCase();
  if (ENTITY_COLORS[upper]) return ENTITY_COLORS[upper];
  return EXTRA_COLORS[simpleHash(upper) % EXTRA_COLORS.length] || 'hsl(240, 8%, 57%)';
}
