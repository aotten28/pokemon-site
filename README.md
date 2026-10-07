# DexLab Pokédex

## Run the website

1. Open Terminal.
2. Go to this project folder:

   ```bash
   cd /Users/a.otten03/dev/pokemon-site
   ```

3. Start the website:

   ```bash
   bun run dev
   ```

4. Open the address shown in Terminal, usually [http://localhost:3000](http://localhost:3000).

Keep the Terminal window open while using the website. To stop the website, click that Terminal window and press `Control + C`.

## Other useful commands

```bash
bun run build
```

Creates a production build before deploying to Vercel or another host.

```bash
bun run start
```

## Pokémon card archive

Pokémon card data is provided by the Pokémon TCG API. The archive works without
an API key, but add `POKEMON_TCG_API_KEY` to `.env.local` for production-friendly
rate limits. This key is used only by the server-side card route.

## Authentication setup

DexLab uses Supabase email-and-password authentication. Before deploying, configure
these settings in **Supabase Dashboard → Authentication**:

1. Enable **Confirm email** under Providers → Email.
2. Set the Site URL to the deployed website address.
3. Add both `http://localhost:3000/auth/callback` and
   `https://your-production-domain/auth/callback` to Redirect URLs.
4. Apply every SQL file in `supabase/migrations/` to the connected project, in
   filename order. This includes `20260823042016_user_cards.sql`, which creates
   the private card collection used by the **Have** and **Want** buttons.

New accounts receive a permanent, private handle using lowercase letters, numbers,
and underscores. Supabase's default email templates are sufficient; configure custom
SMTP before attempting to customize them on a new free-tier project.

Runs the production build locally after `bun run build` finishes.

## If the website disconnects

Open Terminal again, return to this folder, and run `bun run dev` again. Then reopen the localhost address shown in Terminal.
