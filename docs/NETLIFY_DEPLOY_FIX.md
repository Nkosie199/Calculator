# Fixing Calculator's Netlify deploys

Written 2026-11-08.

## The problem

calculator.mynger.com (Netlify project `mydeepcalculator`) is stuck on the build from 14 September 2026 (`cdc74aa`), so it has no Google Analytics tag and shows as "Unmeasured" on Ringer's Valuations page.

Every deploy since then fails before the build starts:

```
Failed during stage 'preparing repo': Unable to access repository.
Host key verification failed.
fatal: Could not read from remote repository.
```

## What has been ruled out

- The repo is public and `https://github.com/Nkosie199/Calculator` can be read without signing in.
- Netlify's settings are correct: repository linked, GitHub app connected, branch `master`.
- Re-linking the repo on Netlify did not help.
- The dashboard's build settings (`npm install`, publish `public`) are wrong but not the cause: the failure comes first, and `netlify.toml` overrides them with `npm run build` and `dist`.

## Likely cause (not confirmed)

The Netlify app on GitHub may not have access to this repo. The GitHub setting could not be checked from Netlify.

## The fix

1. Go to https://github.com/settings/installations, signed in as Nkosie199.
2. Click **Configure** next to **Netlify**. If Netlify isn't listed, install it from https://github.com/apps/netlify.
3. Under **Repository access**, choose **All repositories**, or add **Calculator** under **Only select repositories**. Click **Save**.
4. On https://app.netlify.com/projects/mydeepcalculator/deploys click **Trigger deploy → Clear cache and deploy site**.
5. When it says **Published**, view the source of calculator.mynger.com and search for `G-KDGHSW0CJH`.

## If it still fails

Publish by hand from an up-to-date `master` checkout:

```bash
npm ci
```

```bash
npm run build
```

Then drag the `dist` folder onto the drop area at the bottom of the Netlify Deploys page. Automatic deploys stay broken until the cause is fixed, so raise it with Netlify support, quoting the error above.
