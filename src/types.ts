export interface Env {
  unilens_db:           D1Database;
  SESSIONS:             KVNamespace;
  unilens_images:       R2Bucket;
  R2_PUBLIC_ID:         string;
  GOOGLE_CLIENT_ID:     string;
  GOOGLE_CLIENT_SECRET: string;
  SESSION_SECRET:       string;
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
  user_id:         string;
  layout_mode:     string;
  grid_images:     string;
  subscription_level: string;
}