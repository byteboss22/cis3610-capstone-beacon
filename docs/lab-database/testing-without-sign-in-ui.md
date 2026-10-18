# Test authentication and RLS without a sign-in page

The current browser interface demonstrates public browsing. Beacon also implements authenticated POST/PATCH routes, server-side administrator authorization, and database RLS. A script can sign in through Supabase Auth and call these routes with the same bearer token that a future sign-in screen would use. This verifies the backend, not a complete signed-in browser workflow.

## Student setup

1. In the Supabase development project's **Authentication → Users**, create an email/password test user. Choose the create-user option rather than an invitation/magic link. Use fictional account details and a strong private password; mark the email confirmed using the dashboard's confirmation option if available. An already confirmed test user with a known password also works. Do not disable email confirmation globally.
2. In **Table Editor → properties**, confirm the original draft with ID `bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb` exists, has `approved = false`, and has `owner_id = 11111111-1111-4111-8111-111111111111`. Note its title so you can confirm it is unchanged after testing. The test account must have a different Auth user UUID from that owner. Empty results alone cannot prove denial if the fixture is missing.
3. Open the ignored local file `.env.rls.local` at the Beacon project root. A blank copy was created locally for this task. Fill the email and password, and set the confirmation flag only after checking the fixture:

```env
BEACON_TEST_EMAIL=
BEACON_TEST_PASSWORD=
BEACON_DRAFT_CONFIRMED=false
```

Change the last value to `true` after step 2. Quote the email/password values in the local file, especially if the password contains `#`, spaces, or special characters. Keep the values out of chat, screenshots, Git and Vercel. If the file does not exist in another checkout, create it with exactly these three variable names. Existing Supabase project configuration remains in `.env.local`.

4. From the Beacon project terminal run:

```sh
npm run test:live-rls
```

The default target is https://cis3610-capstone-beacon.vercel.app. The script signs into Supabase, verifies the user, and sends the user's token only in request headers. It does not print the password, email, key, or token. No service-role key is needed.

## What the script tests

| Request | Authentication | Expected result |
|---|---|---|
| Read known approved fixture directly | No user token | 200; fixture is visible, positive control |
| Read known draft directly | No user token | 200; `[]` |
| POST listing through Beacon | No user token | 401; `Authentication required.` |
| Read another owner's draft directly | Verified other-user token | 200; `[]` |
| PATCH another owner's draft directly | Verified other-user token | 200; `[]`, no affected rows returned |
| INSERT with the seeded owner's ID | Verified other-user token | 403; PostgreSQL code `42501` |
| PATCH another owner's draft through Beacon | Verified other-user token | 404; `Editable listing not found.` |

All mutation payloads use fictional verification content and are expected to be denied. An unexpected successful mutation is marked FAIL, never treated as evidence of protection. Check the draft's title afterward and investigate any FAIL before submitting.

## Submission evidence

An actual completed run writes `docs/lab-database/rls-live-evidence.json`. It records each request method/path/body, explicit Authorization header state, a credential-placeholder cURL command, actual HTTP status and raw response body with any credential values redacted. It also records success/failure and the fixture precondition. The second-user token in this report was verified by Supabase Auth; it is not the local Auth shim used by unit tests.

Do not claim the live tests ran merely because the script's unit tests pass. No real test-user credentials were available when the script was prepared. The student subsequently executed the real authenticated run on October 17, 2026: all eight checks passed; see [actual redacted evidence](rls-live-evidence.json) and the [closeout response draft](rls-closeout-response.md). Post-test title confirmation and student review remain pending. The script does not execute live owner/admin operations, add sign-in or editing controls to the browser, or complete the required AI reviews. Those are separate evidence items.
