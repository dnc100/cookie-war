# Cookie War

Cookie War is a Next.js app for local blind-tasting battles. Authentication and
the first persistent admin flow use Supabase.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

In `.env.local`, set the Supabase project URL and publishable key from your
Supabase project settings.

## Create the database

1. Create a Supabase project.
2. Open **SQL Editor** in Supabase.
3. Paste and run [`supabase/schema.sql`](./supabase/schema.sql).
4. Open **Authentication → Providers → Email** and enable email/password.
5. If you already ran the original schema, run [`supabase/migrations/20261111_competition-logistics.sql`](./supabase/migrations/20261111_competition-logistics.sql) too.
6. Start the app and create an account at `/auth`.
7. Copy that user’s ID from **Authentication → Users**.
8. Promote that account to admin in SQL Editor:

```sql
update public.profiles
set role = 'ADMIN'
where id = 'YOUR_AUTH_USER_UUID';
```

Then sign out and back in. The admin account can access `/admin/dashboard` and
create competitions with a name, genre, taste date, judging criteria, and
available drop-off locations.

Bakers see active competitions in `/baker/dashboard`. Each baker can enter at
most one submission per competition, choose a custom pickup location, optionally
pin their current location, and later view/edit or remove that submission. The
admin's **Baker logistics** tab shows every baker, email, chosen location,
address, coordinates, and signup date. There is deliberately no
baker-to-taster matching step.

## Current scope

- Real Supabase email/password signup and login.
- Persistent user profiles with `BAKER`, `TASTER`, and `ADMIN` roles.
- Admin-only competition creation with row-level security.
- Persistent baker participation, chosen drop-off locations, and submissions.
- Taster scoring still uses the existing demo tasting-room data; the next step is
  to make its scorecard read the competition's saved judging criteria.
