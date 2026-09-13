# Moving Calculator to `calculator.mynger.com`

Two accounts, done in order: Netlify first (so it tells you what DNS target to use), then
Cloudflare. Takes a few minutes of clicking plus DNS propagation time (usually fast, occasionally
up to ~an hour).

Old URL: `https://mydeepcalculator.netlify.app/` — same Netlify site, no need to recreate it.

## 1. Netlify — add the custom domain

1. Log into Netlify → open the **Calculator** site → **Site configuration → Domain management**.
2. **Add a domain** → enter `calculator.mynger.com` → confirm.
3. Netlify will show you a target to point DNS at — usually your site's own `<sitename>.netlify.app`
   hostname (a CNAME target), sometimes a load-balancer IP for an apex domain (not needed here
   since `calculator` is a subdomain). Copy whatever it shows you; you'll need it in step 2 below.
4. Leave this tab open — you'll come back after the DNS record exists to confirm the certificate
   provisions.

## 2. Cloudflare — add the DNS record

1. Log into Cloudflare → select the `mynger.com` zone → **DNS → Records**.
2. **Add record**:
   - Type: `CNAME`
   - Name: `calculator`
   - Target: the value Netlify gave you in step 1.3 (e.g. `mydeepcalculator.netlify.app` or
     whatever your site's Netlify hostname is)
   - **Proxy status: DNS only (grey cloud)** — this is the one easy-to-miss step. If Cloudflare's
     orange "Proxied" mode is on, Cloudflare terminates TLS instead of Netlify, which breaks
     Netlify's automatic Let's Encrypt certificate issuance for the domain. Click the cloud icon
     to toggle it grey before saving.
   - TTL: Auto is fine.
3. Save.

## 3. Wait for propagation, then verify the cert

Back in the Netlify tab from step 1: once DNS resolves, Netlify auto-issues a Let's Encrypt
certificate for `calculator.mynger.com`. This usually takes a few minutes; refresh the domain
settings page until it shows the certificate as active (green). If it's still pending after ~an
hour, double check the Cloudflare record is DNS-only, not proxied.

You can check propagation yourself before that:

```bash
nslookup calculator.mynger.com
```

It should resolve to a Netlify hostname/IP once it's propagated.

## 4. The old-URL redirect (already done)

`public/_redirects` in this repo already ships:

```
https://mydeepcalculator.netlify.app/*  https://calculator.mynger.com/:splat  301!
```

Scoped to the old host specifically (not a bare `/*`) so it can never redirect the new domain to
itself. Once the custom domain is live, anyone hitting the old `.netlify.app` URL — old bookmarks,
old links — lands on `calculator.mynger.com` automatically. Nothing further to do here; it
deploys with the rest of the site.

## 5. Confirm it's genuinely static

Once `https://calculator.mynger.com` resolves and the cert is active:

1. Open it in a browser, open DevTools → Network tab, reload.
2. Confirm the response for `/` comes from Netlify's static CDN (check response headers — no
   serverless function invocation in the waterfall). This app has no backend anywhere; this step
   is just confirming Netlify is serving it the way the rest of the app assumes.
3. Spot-check a couple of the mode tabs and the Ask bar to make sure nothing broke in the move.

## 6. Housekeeping after it's confirmed live

- Update `MyngerProjects/Mynger/docs/Mynger-owned apps.txt` — Calculator's entry currently reads
  "migrating... DNS/cert pending"; flip it to the plain `https://calculator.mynger.com/ (live) ✅`
  form once you've verified step 5.
- If you use the old `.netlify.app` URL anywhere else (bookmarks, other docs, a homepage link
  list), you can leave those as-is since the redirect covers them, but updating them directly
  avoids the extra hop.
