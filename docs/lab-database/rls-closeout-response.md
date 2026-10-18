# RLS closeout response — student review required

Live anonymous and second-user checks ran October 17, 2026 (America/Los_Angeles). All eight passed. Exact recorded requests/responses are in [rls-live-evidence.json](rls-live-evidence.json). Before submitting, confirm in Table Editor that the seeded draft still has its original title. Owner/admin operation evidence below comes from the local PostgreSQL suite, not live owner/admin sessions. Review this AI-assisted draft and identify your own contribution separately.

## 1. Target table and declared RLS

The evaluated table is **public.properties**. Its UUID primary key is `id`; `owner_id` references `public.profiles(id)`; and `approved` is a required boolean defaulting to false. Public content includes title, description, city and integer monthly rent in cents. Migration 0002 adds presentation fields without changing the ownership/publication policies.

The following definitions are copied verbatim from [0001_beacon.sql](../../supabase/migrations/0001_beacon.sql):

```sql
alter table public.properties enable row level security;
alter table public.properties force row level security;
create policy property_public on public.properties for select to anon, authenticated using (approved);
create policy property_owner_read on public.properties for select to authenticated using (owner_id = (select auth.uid()));
create policy property_owner_insert on public.properties for insert to authenticated with check (owner_id = (select auth.uid()) and not approved);
create policy property_owner_update on public.properties for update to authenticated using (owner_id = (select auth.uid()) and not approved) with check (owner_id = (select auth.uid()) and not approved);
```

RLS works alongside SQL grants. Authenticated owners receive UPDATE permission for editable content columns, not `owner_id` or `approved`. Migration 0002 grants only additional presentation columns. Anonymous users receive SELECT permission, with rows filtered by approval, and no INSERT, UPDATE or DELETE grants.

## 2. Role operations matrix

| Role | One permitted SQL operation | One denied SQL operation and exact boundary |
|---|---|---|
| Anonymous (`anon`) | SELECT a listing where `approved = true`. | UPDATE a property's title: `anon` has no UPDATE grant; local SQL tests return `42501`. A draft SELECT is also filtered because `approved = false`. |
| Resource owner (`authenticated`) | UPDATE editable fields where `owner_id = auth.uid() AND approved = false`. USING checks the existing row; WITH CHECK checks the resulting row. | UPDATE `approved` to self-publish: no UPDATE grant exists for this column; the owner UPDATE policy also requires `NOT approved`. |
| Other authenticated user | SELECT approved properties under `property_public`; the actual user-token positive control returned 200 with the public fixture. | INSERT with another owner's `owner_id`: `owner_id = auth.uid() AND NOT approved` fails. Live result: 403 / `42501`. Cross-owner UPDATE is also filtered by the owner predicate. |
| Administrator (`service_role`) | UPDATE `approved` using trusted server code; service_role has table privileges and BYPASSRLS. Beacon checks verified `app_metadata.role = admin` before using its service client for approval. | DELETE the seeded property while an inquiry references it: `inquiries_property_id_fkey` links `inquiries.property_id` to `properties.id` with ON DELETE RESTRICT and returns `23503`. This is a foreign-key denial, not RLS. |

The service role intentionally bypasses RLS, including forced RLS. It would be incorrect to claim an RLS ownership predicate denies that role. The administrator delete restriction is verified in [tests/rls.test.js](../../tests/rls.test.js); it was not executed against the hosted project. See [Supabase's RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 3. Actual verification evidence

These cURL commands represent requests the runner actually executed. Project key and access-token values are replaced with variable placeholders. Supabase Auth verified that the signed-in user's UUID differs from seeded owner `11111111-1111-4111-8111-111111111111`. The known draft is `bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb`.

**Anonymous cannot read draft**

Authorization state: Authorization header absent.

```sh
curl -i "${SUPABASE_URL}/rest/v1/properties?select=id,title&id=eq.bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" \
  -H "apikey: ${SUPABASE_ANON_KEY}"
```

Observed response:

```http
HTTP 200 OK

[]
```

This directly tests database row visibility without a user session. The API key identifies the project; no Authorization header supplies a user JWT.

**Beacon rejects anonymous creation**

Authorization state: Authorization header absent.

```sh
curl -i -X POST "https://cis3610-capstone-beacon.vercel.app/api/listings" \
  -H "Content-Type: application/json" \
  --data '{"title":"Fictional denial test","description":"Coursework verification only.","city":"Sample City","rent_cents":100000}'
```

Observed response:

```http
HTTP 401 Unauthorized

{"error":"Authentication required."}
```

This demonstrates the server authentication guard, separately from direct database row filtering.

**Other authenticated user cannot edit draft**

Authorization state: Verified other-user access token; value redacted.

```sh
curl -i -X PATCH "${SUPABASE_URL}/rest/v1/properties?id=eq.bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${OTHER_USER_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  --data '{"title":"Forbidden cross-owner edit"}'
```

Observed response:

```http
HTTP 200 OK

[]
```

The valid user can read approved content, but this UPDATE returns no qualifying rows because the target owner does not match auth.uid(). HTTP 200 does not mean the draft was edited. Confirm the title is unchanged in Table Editor.

**Other authenticated user cannot spoof owner on insert**

Authorization state: Verified other-user access token; value redacted.

```sh
curl -i -X POST "${SUPABASE_URL}/rest/v1/properties" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${OTHER_USER_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  --data '{"title":"Fictional denial test","description":"Coursework verification only.","city":"Sample City","rent_cents":100000,"owner_id":"11111111-1111-4111-8111-111111111111"}'
```

Observed response:

```http
HTTP 403 Forbidden

{"code":"42501","details":null,"hint":null,"message":"new row violates row-level security policy for table \"properties\""}
```

This explicitly rejects the ownership-spoofing INSERT because its WITH CHECK predicate fails. The full report also records Beacon rejecting the cross-owner PATCH with HTTP 404 and Editable listing not found.

**Empty array versus 403:** HTTP 200 with `[]` means the request was accepted but no rows were visible or eligible under the filters and RLS policies. It conceals whether the requested record exists. An empty result alone cannot distinguish a nonexistent row from a protected row, which is why the draft must exist and permitted public reads are positive controls. For an UPDATE with `Prefer: return=representation`, an empty array means no matching rows were returned; it does not establish a successful edit. HTTP 403 with PostgreSQL code `42501` explicitly rejects the INSERT. Both observed outcomes preserve the intended boundary through different mechanisms. See [Supabase's empty-result explanation](https://supabase.com/docs/guides/troubleshooting/why-is-my-select-returning-an-empty-data-array-and-i-have-data-in-the-table-xvOPgx).

## Submission references

- Repository: https://github.com/byteboss22/cis3610-capstone-beacon
- Database PR: https://github.com/byteboss22/cis3610-capstone-beacon/pull/3
- Interface PR: https://github.com/byteboss22/cis3610-capstone-beacon/pull/4
- Evidence-runner PR: https://github.com/byteboss22/cis3610-capstone-beacon/pull/5
- Deployment: https://cis3610-capstone-beacon.vercel.app
- Evidence: `rls-live-evidence.json`, `test-output.txt`, `vercel-verification.txt`, `verification.md` and `ai-log.md` in this directory.

Remaining student work: confirm the draft title is unchanged, review the schema/answer, finish the required separate AI-review log, identify your individual contribution and commits, and merge the evidence PR after review. The second-user checks do not constitute live owner/admin testing or completion of these remaining requirements.
