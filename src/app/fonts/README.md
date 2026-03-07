# Vendored Font Assets

These font files are checked into the repo and loaded via `next/font/local` from [`src/app/layout.tsx`](../layout.tsx).

## Source URLs

- `archivo-latin.woff2`
  - `https://fonts.gstatic.com/s/archivo/v25/k3kPo8UDI-1M0wlSV9XAw6lQkqWY8Q82sLydOxKsv4Rn.woff2`
- `archivo-black-latin.woff2`
  - `https://fonts.gstatic.com/s/archivoblack/v23/HTxqL289NzCGg4MzN6KJ7eW6CYyF_jzx13E.woff2`
- `fira-code-latin.woff2`
  - `https://fonts.gstatic.com/s/firacode/v27/uU9NCBsR6Z2vfE9aq3bh3dSDqFGedA.woff2`

## SHA-256

- `archivo-latin.woff2`
  - `7150c0ec5ad356453013d11affec1fbab95de0dd2dcecb043b4f1cb7f87c4ba4`
- `archivo-black-latin.woff2`
  - `4eca2abdbbc1998c3a286e2e83a2256be5263ccb801aa93b00c64fea891efd3a`
- `fira-code-latin.woff2`
  - `d32d5b5a7c9720cf3812f7d1e3ebdb54116f8f656e7471a03a5a93bdd93c98b3`

## Refresh Workflow

Run:

```bash
bun run fonts:update
```

That script re-downloads the vendored files and runs a production build to confirm the app still packages correctly.
