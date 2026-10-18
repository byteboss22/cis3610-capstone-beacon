-- Additive upgrade for the restored Next.js interface. Apply after 0001 once.
-- Nullable presentation fields preserve existing drafts without inventing facts.
begin;
alter table public.properties
  add column property_type text check (property_type in ('apartment','condo','duplex','house','loft')),
  add column address_line_1 text check (char_length(btrim(address_line_1)) between 1 and 100),
  add column address_line_2 text check (char_length(btrim(address_line_2)) between 1 and 60),
  add column state text check (state ~ '^[A-Z]{2}$'),
  add column zip_code text check (zip_code ~ '^[0-9]{5}$'),
  add column bedrooms smallint check (bedrooms between 0 and 20),
  add column bathrooms numeric check (bathrooms between 0 and 20 and mod(bathrooms, 0.5) = 0),
  add column square_feet integer check (square_feet between 1 and 100000),
  add column image_url text check (image_url ~ '^/properties/[a-z0-9-]+\.svg$'),
  add column image_alt text check (char_length(btrim(image_alt)) between 1 and 180),
  add column amenities text[] not null default '{}' check (
    cardinality(amenities) <= 12 and array_position(amenities, null) is null
    and amenities <@ array['accessible_entry','balcony','laundry','parking','pet_friendly','public_transit','yard']::text[]
  ),
  add column voice_summary text check (char_length(btrim(voice_summary)) between 1 and 240);
alter table public.sponsors add column message text not null default '' check (char_length(message) <= 180);
-- Existing SELECT grants cover the additive display fields; write grants remain narrow.
grant insert (property_type,address_line_1,address_line_2,state,zip_code,bedrooms,bathrooms,square_feet,image_url,image_alt,amenities,voice_summary)
  on public.properties to authenticated;
grant update (property_type,address_line_1,address_line_2,state,zip_code,bedrooms,bathrooms,square_feet,image_url,image_alt,amenities,voice_summary)
  on public.properties to authenticated;
grant insert (message) on public.sponsors to authenticated;
grant update (message) on public.sponsors to authenticated;
-- No ownership, publication, administrator or DELETE grants are added.
notify pgrst, 'reload schema';
commit;
