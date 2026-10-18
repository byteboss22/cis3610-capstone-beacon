// Server-only database adapter. Imported only by the Next.js API route and tests.
import { createClient } from '@supabase/supabase-js';
export const BASE_LISTING_COLUMNS = 'id,title,description,city,rent_cents,created_at';
export const LISTING_COLUMNS = `${BASE_LISTING_COLUMNS},property_type,address_line_1,address_line_2,state,zip_code,bedrooms,bathrooms,square_feet,image_url,image_alt,amenities,voice_summary`;
const missingColumn = error => error?.code === '42703' || error?.code === 'PGRST204';
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

export function createDatabase(env = process.env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) throw new Error('Missing server configuration');
  const client = (token) => createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    ...options, ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
  });
  async function readListings(id) {
    const query = columns => {
      let read = client().from('properties').select(columns).eq('approved', true);
      return id ? read.eq('id', id).maybeSingle()
        : read.order('created_at', { ascending: false }).limit(100);
    };
    const response = await query(LISTING_COLUMNS);
    // Keep the live 0001 project usable until the additive migration is applied.
    return missingColumn(response.error) ? query(BASE_LISTING_COLUMNS) : response;
  }
  return {
    async verifyUser(token) {
      // Contact Auth; never trust a decoded JWT or user-supplied role/owner ID.
      const { data, error } = await client().auth.getUser(token);
      if (error || !data.user) return null;
      return data.user;
    },
    async listings() {
      return readListings();
    },
    async listing(id) { return readListings(id); },
    async sponsors() {
      const query = columns => client().from('sponsors').select(columns).eq('active', true).order('name').limit(50);
      const response = await query('id,name,website,message');
      return missingColumn(response.error) ? query('id,name,website') : response;
    },
    async createListing(token, userId, fields) {
      const db = client(token);
      const profile = await db.from('profiles').upsert({ id: userId, display_name: 'Beacon member' },
        { onConflict: 'id', ignoreDuplicates: true });
      if (profile.error) return { data: null, error: profile.error };
      return db.from('properties').insert({ ...fields, owner_id: userId }).select(BASE_LISTING_COLUMNS).single();
    },
    async updateDraft(token, userId, id, fields) {
      return client(token).from('properties').update(fields).eq('id', id)
        .eq('owner_id', userId).eq('approved', false).select(BASE_LISTING_COLUMNS).maybeSingle();
    },
    async approveListing(id, approved) {
      if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing administrator configuration');
      // Called only after server-side administrator authorization in app.js.
      const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);
      return admin.from('properties').update({ approved }).eq('id', id).select('id,approved').maybeSingle();
    },
  };
}
