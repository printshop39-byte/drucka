/* Typed view over the SEO landing data. The data itself lives in
   src/seo/landings.js so the build-time prerender script can import the
   exact same source (single source of truth, no drift). */
// @ts-expect-error — plain JS data module, typed below
import { LANDINGS as RAW, LANDING_SLUGS as SLUGS } from '../seo/landings.js';

export interface LandingFaq { q: string; a: string }
export type LandingAction = 'mini' | 'frame' | 'tshirt' | 'mug' | 'canvas' | 'whatsapp';

export interface Landing {
  slug: string;
  category?: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  tagline?: string;
  introEn: string;
  introMr: string;
  image: string;
  imageAlt: string;
  fromPrice: number;
  priceNote?: string;
  ctaLabel: string;
  action: LandingAction;
  waText: string;
  highlights: string[];
  faqs: LandingFaq[];
  schemaName: string;
}

export const LANDINGS = RAW as Record<string, Landing>;
export const LANDING_SLUGS = SLUGS as string[];
