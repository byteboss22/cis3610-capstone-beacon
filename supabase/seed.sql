-- FICTIONAL DEVELOPMENT FIXTURES ONLY. Never run against production.
-- No passwords or sign-in credentials. Use real development Auth test users for HTTP tests.
begin;
insert into auth.users (id, email) values
 ('11111111-1111-4111-8111-111111111111', 'owner-one@example.invalid'),
 ('22222222-2222-4222-8222-222222222222', 'owner-two@example.invalid');
insert into public.profiles (id, display_name) values
 ('11111111-1111-4111-8111-111111111111', 'Fictional Owner One'),
 ('22222222-2222-4222-8222-222222222222', 'Fictional Owner Two');
insert into public.properties (id, owner_id, title, description, city, rent_cents, approved) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'Demo Garden Apartment', 'Fictional listing for coursework only.', 'Sample City', 180000, true),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', 'Demo Courtyard Studio', 'Unapproved fictional draft.', 'Sample City', 140000, false),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '22222222-2222-4222-8222-222222222222', 'Other Owner Draft', 'Private fictional draft.', 'Example Town', 160000, false);
insert into public.sponsors (id, owner_id, name, website, active) values
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '11111111-1111-4111-8111-111111111111', 'Fictional Corner Cafe', 'https://example.invalid/cafe', true),
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '11111111-1111-4111-8111-111111111111', 'Fictional Pending Shop', 'https://example.invalid/shop', false);
insert into public.property_sponsors (property_id, sponsor_id) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd');
insert into public.inquiries (property_id, sender_id, message) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222', 'Fictional inquiry for RLS verification.');
commit;
