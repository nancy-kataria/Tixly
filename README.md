# Tixly

[![Database tests](https://github.com/nancy-kataria/Tixly/actions/workflows/database-tests.yml/badge.svg)](https://github.com/nancy-kataria/Tixly/actions/workflows/database-tests.yml)

**Tixly** is an event ticketing app, inspired by Ticketmaster. Fans browse events, add tickets to a cart, pay with Stripe, and resell or transfer their tickets. Organizers create venues and events split into priced sections, and Tixly creates a ticket for every spot.

It started as a web backend school project and has since been rebuilt on Next.js 16, Supabase and Stripe.

### Built With

[![Next.js][Next.js]][Next.js-url]
[![React][React]][React-url]
[![JavaScript][JavaScript]][JavaScript-url]
[![Supabase][Supabase]][Supabase-url]
[![PostgreSQL][PostgreSQL]][PostgreSQL-url]
[![Stripe][Stripe]][Stripe-url]
[![Tailwind CSS][Tailwind CSS]][Tailwind-url]

## Features

**For fans**
- Browse and search upcoming events
- Sign in with Google
- Add tickets from a section (General, Premium, Front row, …) or from other fans' resale listings to a cart. Tickets are held for 10 minutes, up to 8 per cart.
- Pay with Stripe Checkout (test mode, so no real money moves)
- Resell a ticket at your own price, or cancel the listing
- Transfer a ticket to another user by email
- View your tickets and transaction history

**For organizers**
- Become an organizer from the "For organizers" page or your profile
- Add venues and create events with up to 10 sections, each with its own price and capacity

## How it works

- **Supabase Auth** handles Google sign-in. `src/proxy.js` keeps the session fresh and protects signed-in pages.
- **Row Level Security** policies decide what each user can read. For example, you only see your own orders and transaction history.
- **Ticket actions run as Postgres functions**, each as a single transaction. `hold_tickets` claims tickets with `FOR UPDATE SKIP LOCKED`, so shoppers arriving at the same moment get different tickets instead of waiting on each other.
- **Holds expire on their own.** A ticket counts as held only while `held_until` is in the future, so no background job is needed to release abandoned carts.
- **Payments:** checkout turns the cart into an order, with prices taken from the database, and opens a Stripe payment page. Stripe's webhook then calls `complete_order`, which only the server can call. It hands every ticket over in one step and is safe to run twice. If a ticket was taken in the meantime, the whole payment is refunded.
- **Table constraints prevent invalid tickets.** For example, a ticket can't be both unsold and owned, listed without a price, or held in a cart after it's sold.
- **Tested with pgTAP.** SQL tests in `supabase/tests` cover carts, checkout, payment, resale, transfers, organizer rules and access rules. GitHub Actions runs them on every pull request.

| Table | Stores |
|---|---|
| `profiles` | One per user, with a role of `user` or `organizer` |
| `venues` | Name, address and capacity |
| `events` | Organizer, venue, category and date |
| `ticket_sections` | An event's sections, each with a price and capacity |
| `tickets` | One per spot, numbered within its section. Status is `available`, `sold` or `listed`, plus who holds it in a cart and until when. |
| `orders` / `order_items` | Checkouts and the tickets in them, linked to a Stripe Checkout Session |
| `ticket_transactions` | History of every purchase, resale and transfer |

## Getting Started

**You need:**
- Node.js 20.9+
- A [Supabase](https://supabase.com) project
- A Google OAuth client from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- A [Stripe](https://stripe.com) account (test mode is enough) with the [Stripe CLI](https://docs.stripe.com/stripe-cli)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add your keys** to `.env.local`
   ```bash
   # Supabase → Project Settings → API
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
   SUPABASE_SECRET_KEY=<secret-key>          # server only

   # Stripe → Developers → API keys (test mode)
   STRIPE_SECRET_KEY=sk_test_...
   # Printed by `stripe listen` (step 6)
   STRIPE_WEBHOOK_SECRET=whsec_...
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

6. **Forward Stripe's webhooks** to your machine, in a second terminal
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   To pay, use card `4242 4242 4242 4242` with any future date and any CVC.

## Project Structure

```
src/
  app/              Pages, plus API routes for checkout and Stripe webhooks
  components/       Event cards, section picker, cart, modals, navbar
  context/          Signed-in user and cart state for client components
  lib/              Supabase clients, Stripe client, order fulfillment
  proxy.js          Session refresh and protected pages
supabase/
  migrations/       Schema, security rules and ticket functions
  tests/            pgTAP tests, run by GitHub Actions
  seed.sql          Demo data
```

## Roadmap

- Live ticket availability with Supabase Realtime
- Event images with Supabase Storage
- Organizer dashboard with sales stats
- Digital tickets with QR codes and check-in

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
[Stripe]: https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white
[Stripe-url]: https://stripe.com/
[Tailwind CSS]: https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
