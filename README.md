# Tixly

[![Database tests](https://github.com/nancy-kataria/Tixly/actions/workflows/database-tests.yml/badge.svg)](https://github.com/nancy-kataria/Tixly/actions/workflows/database-tests.yml)

**Tixly** is an event ticketing app, inspired by Ticketmaster. Fans browse events, buy tickets by section, and resell or transfer them. Organizers create venues and events split into priced sections, and Tixly creates a ticket for every spot.

It started as a web backend school project and has since been rebuilt on Next.js 16 and Supabase.

### Built With

[![Next.js][Next.js]][Next.js-url]
[![React][React]][React-url]
[![JavaScript][JavaScript]][JavaScript-url]
[![Supabase][Supabase]][Supabase-url]
[![PostgreSQL][PostgreSQL]][PostgreSQL-url]
[![Tailwind CSS][Tailwind CSS]][Tailwind-url]

## Features

**For fans**
- Browse and search upcoming events
- Sign in with Google
- Buy up to 8 tickets at a time from a section (General, Premium, Front row, …)
- Buy resale tickets other fans have listed
- Resell a ticket at your own price, or cancel the listing
- Transfer a ticket to another user by email
- View your tickets and transaction history

**For organizers**
- Become an organizer from the "For organizers" page or your profile
- Add venues and create events with up to 10 sections, each with its own price and capacity

## How it works

- **Supabase Auth** handles Google sign-in. `src/proxy.js` keeps the session fresh and protects signed-in pages.
- **Row Level Security** policies decide what each user can read. For example, you only see your own transaction history.
- **Ticket actions run as Postgres functions** (`buy_tickets`, `buy_resale_ticket`, `list_ticket`, `transfer_ticket`, …), each as a single transaction. `buy_tickets` claims tickets with `FOR UPDATE SKIP LOCKED`, so buyers arriving at the same moment get different tickets instead of waiting on each other, and a ticket can never be sold twice.
- **Table constraints prevent invalid tickets.** For example, a ticket can't be both unsold and owned, or listed without a price.
- **Tested with pgTAP.** SQL tests in `supabase/tests` cover buying, resale, transfers, organizer rules and access rules. GitHub Actions runs them on every pull request.

| Table | Stores |
|---|---|
| `profiles` | One per user, with a role of `user` or `organizer` |
| `venues` | Name, address and capacity |
| `events` | Organizer, venue, category and date |
| `ticket_sections` | An event's sections, each with a price and capacity |
| `tickets` | One per spot, numbered within its section, with a status of `available`, `sold` or `listed` |
| `ticket_transactions` | History of every purchase, resale and transfer |

## Getting Started

**You need:** Node.js 20.9+, a [Supabase](https://supabase.com) project, and a Google OAuth client from [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add your Supabase keys** to `.env.local`. Find them in Supabase under Project Settings → API.
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
   ```

3. **Set up Google sign-in**
   - In Google Cloud, add `https://<project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI.
   - In Supabase → Authentication → Providers, enable **Google** and paste the client ID and secret.
   - In Supabase → Authentication → URL Configuration, set the Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to Redirect URLs.

4. **Create the database and load the demo data**
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push --include-seed
   ```
   The demo data is 3 organizers, 5 venues and 10 events with 2–3 sections each. Two demo fans already own a few tickets, with some listed for resale.

5. **Run the app** at [http://localhost:3000](http://localhost:3000)
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
  app/              Pages, plus the /auth/callback route for Google sign-in
  components/       Event cards, section picker, resale list, modals, navbar
  context/          Signed-in user state for client components
  lib/supabase/     Supabase clients for the browser, server and proxy
  proxy.js          Session refresh and protected pages
supabase/
  migrations/       Schema, security rules and ticket functions
  tests/            pgTAP tests, run by GitHub Actions
  seed.sql          Demo data
```

## Roadmap

- Checkout with Stripe (test mode), with seats held in a cart for 10 minutes
- Live ticket availability with Supabase Realtime
- Event images with Supabase Storage
- Organizer dashboard with sales stats

<!-- MARKDOWN LINKS & IMAGES -->
[Next.js]: https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white
[Next.js-url]: https://nextjs.org/
[React]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://react.dev/
[JavaScript]: https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black
[JavaScript-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript
[Supabase]: https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white
[Supabase-url]: https://supabase.com/
[PostgreSQL]: https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/
[Tailwind CSS]: https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
