// Server-only module: public assets are served from an explicit allowlist.
import { createClient } from '@supabase/supabase-js';
export const LISTING_COLUMNS = 'id,title,description,city,rent_cents,created_at';
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

export function createDatabase(env = process.env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) throw new Error('Missing server configuration');
  const client = (token) => createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    ...options, ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
  });
  return {
    async verifyUser(token) {
      // Contact Auth; never trust a decoded JWT or user-supplied role/owner ID.
      const { data, error } = await client().auth.getUser(token);
      if (error || !data.user) return null;
      return data.user;
    },
    async listings() {
      return client().from('properties').select(LISTING_COLUMNS)
        .eq('approved', true).order('created_at', { ascending: false }).limit(100);
    },
    async createListing(token, userId, fields) {
      const db = client(token);
      const profile = await db.from('profiles').upsert({ id: userId, display_name: 'Beacon member' },
        { onConflict: 'id', ignoreDuplicates: true });
      if (profile.error) return { data: null, error: profile.error };
      return db.from('properties').insert({ ...fields, owner_id: userId }).select(LISTING_COLUMNS).single();
    },
    async updateDraft(token, userId, id, fields) {
      return client(token).from('properties').update(fields).eq('id', id)
        .eq('owner_id', userId).eq('approved', false).select(LISTING_COLUMNS).maybeSingle();
    },
    async approveListing(id, approved) {
      if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing administrator configuration');
      // Called only after server-side administrator authorization in app.js.
      const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);
      return admin.from('properties').update({ approved }).eq('id', id).select('id,approved').maybeSingle();
    },
  };
}
