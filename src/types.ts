export interface Env {
  unilens_db:     D1Database;
  SESSIONS:       KVNamespace;
  unilens_images: R2Bucket;
}

export interface Variables {
  user: Record<string, unknown>;
}

export interface PhotographerProfile {
  name:            string;
  bio:             string;
  portfolio_html:  string;
  slug:            string;
  price_min:       number;
  price_max:       number;
  commission_open: number;
  avatar_url:      string | null;
  university:      string;
  avg_rating:      number;
  review_count:    number;
}