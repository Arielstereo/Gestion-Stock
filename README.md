This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## MongoDB setup 🗄️

This project can be backed by a MongoDB database instead of the in-browser
zustand store. To prepare the environment:

1. Add the `mongodb` driver to your dependencies:
   ```bash
   pnpm add mongodb      # or `npm install mongodb` or `yarn add mongodb`
   ```
2. Create a database (Atlas, local server, etc.) and copy the connection
   string.
3. Duplicate `.env.local.example` to `.env.local` and fill in
   `MONGODB_URI` (and optionally `MONGODB_DB`). Next.js loads this file
   automatically in development.
4. Run the initialization script to create collections and seed default data:
   ```bash
   pnpm run init-db
   ```
   This will create `products`, `adjustments` and `entries` collections and
   set up a few helpful indexes. If the `products` collection is empty it
   will also insert the known product keys/labels with zero stock.
5. A helper client is provided at `src/lib/mongodb.js` which exposes a
   `clientPromise`. You can import it from any server-side code.
6. Example API handlers have been added under `src/app/api`:
   - `products/route.js` (GET, POST) — validates body with Zod
   - `products/[key]/route.js` (GET, PUT, DELETE) — PUT is also validated
   - `adjustments/route.js` (GET/POST/DELETE) — request bodies are checked
   - `adjustments/[id]/route.js` (PUT, DELETE) with validation
   - `entries/route.js` (GET/POST) and `entries/[id]/route.js` (PUT, DELETE)
     for monthly stock records; schemas ensure `month`, `year` and `products`.

   All handlers perform simple schema validation and return structured JSON
   errors if data is invalid.

   The frontend stores in `src/stores` (and the `useStock` hook) now use
   `axios` to talk to these endpoints; persistence has been removed so there are
   no more `localStorage` calls, which also eliminates a server-side rendering
   error on startup. UI components that previously depended on the old stores
   work unchanged but now receive live data from the database.

### Environment tips

- The initialization script (`pnpm run init-db`) and the Next.js server need
  `MONGODB_URI` in the environment. Create a `.env.local` file or set the
  variable manually. The init script automatically loads `.env.local` via
  `dotenv` now, so you can run it directly without additional flags.
- If you see a `Please add MONGODB_URI` error when running the app, the
  environment variable is missing or malformed; the connection helper now
  logs a warning to help debug the value.

Once your database is available you can start using the app normally —
product lists and adjustments will be fetched from the server instead of
being kept in the browser.

---

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
