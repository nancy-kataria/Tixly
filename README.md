# Tixly

[![LinkedIn][linkedin-shield]][linkedin-url]

**Tixly** is an event ticketing app, inspired by Ticketmaster. Fans browse events, buy seats, and resell or transfer their tickets. Organizers create venues and events, and Tixly generates a ticket for every seat.

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
- Buy seats, either unsold ones or tickets other fans have listed for resale
- Resell a ticket at your own price, or cancel the listing
- Transfer a ticket to another user by email
- View your tickets and transaction history

**For organizers**
- Become an organizer from the "For organizers" page or your profile
- Add venues and create events. Tickets are created automatically, one per seat.

## How it works

- **Supabase Auth** handles Google sign-in. `src/proxy.js` keeps the session fresh and protects signed-in pages.
- **Row Level Security** policies decide what each user can read. For example, you only see your own transaction history.
- **Ticket actions run as Postgres functions** (`buy_ticket`, `list_ticket`, `transfer_ticket`, …). Each one is a single transaction. The seat row is locked during a purchase, so two people can't buy the same seat.
- **Table constraints prevent invalid tickets.** For example, a ticket can't be both unsold and owned, or listed without a price.

| Table | Stores |
|---|---|
| `profiles` | One per user, with a role of `user` or `organizer` |
| `venues` | Name, address and seat capacity |
| `events` | Organizer, venue, category and date |
| `tickets` | One per seat, with a status of `available`, `sold` or `listed` |
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
   The demo data is 3 organizers, 5 venues and 10 events. Two demo fans already own a few seats, with some listed for resale.

5. **Run the app** at [http://localhost:3000](http://localhost:3000)
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
  app/              Pages, plus the /auth/callback route for Google sign-in
  components/       Event list, ticket grid, modals, navbar
  context/          Signed-in user state for client components
  lib/supabase/     Supabase clients for the browser, server and proxy
  proxy.js          Session refresh and protected pages
supabase/
  migrations/       Schema, security rules and ticket functions
  seed.sql          Demo data
```

## Roadmap

- Live seat updates with Supabase Realtime
- Event images with Supabase Storage
- Checkout with Stripe (test mode)
- Organizer dashboard with sales stats
- Automated tests for the ticket functions

<!-- MARKDOWN LINKS & IMAGES -->
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/nancy-kataria8/
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
