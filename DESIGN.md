# passgen Design Documentation

**Version:** 0.3.2  
**Last Updated:** 2026-03-07  
**Technology Stack:** Next.js 16, React 19, TypeScript 5, Bun, custom CSS

---

## System Overview

passgen is a browser-based password generator. Password generation happens entirely on the client. The server only delivers static assets and response headers; it does not receive, store, or process generated passwords.

### Core Principles

- **Local-first:** Passwords are generated in the browser only.
- **Configurable:** Users control length, required character counts, and symbol set.
- **Low state surface:** Generated passwords stay in React state and disappear on reload or flush.
- **Persistent preferences:** Configuration and theme are stored in `localStorage`.
- **Minimal network activity:** No analytics or tracking. Fonts are vendored into the repo and served locally.

### Current Feature Set

- Single-page password generation UI
- Config modal with live validation
- Custom symbol charset support
- Copy-to-clipboard password history
- Light/dark theme toggle
- Privacy and terms panels in the footer
- Production deployment via Bun + systemd

---

## Architecture

### Repository Layout

```text
src/
├── app/
│   ├── layout.tsx              # Root layout, metadata, and font setup
│   ├── page.tsx                # Main client UI
│   └── globals.css             # Global styles and component styling
├── lib/
│   └── passwordGenerator.ts    # Password generation algorithm
deploy/
├── passgen.service             # systemd unit for production
└── update.sh                   # Pull/build/restart helper
```

### Main Modules

#### `src/app/page.tsx`

The page component owns all interactive UI state:

- current password policy
- generated password history
- config modal visibility
- invalid-config modal visibility
- copy toast visibility
- expanded footer policy panel
- light/dark theme

It is also responsible for:

- loading and saving config from `localStorage`
- loading and saving theme from `localStorage`
- validating config before generation
- triggering password generation
- copying passwords to the clipboard

#### `src/lib/passwordGenerator.ts`

This module contains the password generation algorithm and exports:

```ts
export interface PasswordConfig {
  length: number;
  upper: [number, number | null];
  lower: [number, number | null];
  digits: [number, number | null];
  symbols: [number, number | null];
  useSymbols: string;
}

export function generatePassword(config: PasswordConfig): string
```

The generator is framework-independent and can be reused outside the UI layer.

#### `src/app/globals.css`

The application no longer uses Tailwind. All styling is custom CSS, including:

- design tokens
- layout
- button/input styling
- modal styling
- theme variables
- footer/policy panels
- entrance animation

#### `src/app/fonts/`

Vendored `.woff2` files for Archivo, Archivo Black, and Fira Code live in the repo and are loaded through `next/font/local`.

#### `next.config.ts`

The Next.js config disables the `X-Powered-By` header and adds a fixed set of security headers, including CSP, HSTS, `X-Frame-Options`, and `Referrer-Policy`.

---

## Password Generation Algorithm

### Goal

Generate passwords that satisfy user-defined min/max constraints per character class while preventing a symbol in the first character position.

### Character Classes

- uppercase: `A-Z`
- lowercase: `a-z`
- digits: `0-9`
- symbols: user-configurable charset

### Algorithm Flow

1. Build four rules from the current `PasswordConfig`.
2. Validate that the sum of minimum requirements does not exceed the requested length.
3. Fill the output buffer with the minimum required characters for each rule.
4. Fill remaining slots by randomly choosing from rules that have not hit their max.
5. Shuffle the result with Fisher-Yates.
6. Reject and regenerate if the first character is a symbol.

### Randomness Model

The generator now uses the Web Crypto API for all random choices:

- selecting a character from a charset
- selecting which rule to use for remaining slots
- selecting swap indices during shuffle

`getRandomInt()` uses rejection sampling over `crypto.getRandomValues()` to avoid modulo bias for bounded random integers.

### Notes

- The first-character constraint is a usability choice for sites and shells that behave poorly with leading symbols.
- Password history is not persisted anywhere; only the active policy and theme are stored locally.

---

## UI Flow

### Main Screen

- `GENERATE` creates a new password and prepends it to history.
- `CONFIG` opens the configuration modal.
- `FLUSH` clears in-memory password history.
- The config summary bar shows the active ruleset in compact form.
- Clicking a password copies it to the clipboard.

### Configuration Modal

The config modal provides:

- password length slider
- min/max inputs for uppercase, lowercase, digits, and symbols
- symbol charset input
- preset buttons for `SafeSet` and `OWASP`
- reset-to-defaults action

Validation runs on every config change. If the saved config is invalid, generation is blocked and a separate recovery modal offers reset or reopening config.

### Theme and Footer

- Theme is toggled between light and dark modes and persisted in `localStorage`.
- Footer contains source links, license text, and expandable privacy/terms panels.

---

## State Management

### React State

The UI is implemented as a single client component using `useState`, `useEffect`, and `useCallback`.

Key state values include:

- `config`
- `passwords`
- `showCopied`
- `validationError`
- `showConfig`
- `showInvalidConfig`
- `expandedPolicy`
- `theme`
- `mounted`

### Persistence

`localStorage` keys:

- `passgen-config`
- `passgen-theme`

Stored data is plain JSON/string data. No generated passwords are written to storage.

---

## Security Model

### Browser-Side Security

- Password generation is local to the browser.
- Clipboard writes use `navigator.clipboard.writeText()` with a textarea fallback.
- No cookies, analytics, or telemetry are present in the application code.

### Response Headers

Configured in [`next.config.ts`](./next.config.ts):

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: no-referrer`
- `Strict-Transport-Security`
- `Content-Security-Policy`

### Known Tradeoffs

- Font files are vendored locally, so the app no longer depends on external font fetching during runtime or build.
- Config and theme are stored unencrypted in `localStorage`.
- Password history exists in page memory until flushed or the page is reloaded.

---

## Build and Deployment

### Local Commands

```bash
bun run dev
bun run build
bun run start
bun run lint
```

### Production Deployment

The repo includes a Bun-based deployment path:

- [`deploy/passgen.service`](./deploy/passgen.service) runs the app under systemd on port `3012`
- [`deploy/update.sh`](./deploy/update.sh) fetches `origin/main`, rebuilds, and restarts the service
- [`scripts/update-fonts.sh`](./scripts/update-fonts.sh) refreshes vendored font files and runs a build verification pass

The deployment target assumes a working tree at `/var/www/passgen` and a `www-data` service user.

---

## Maintenance Notes

- Keep `README.md`, `CHANGELOG.md`, and this document aligned with actual implementation details.
- If the UI is split into smaller components later, update the architecture section to reflect the new ownership boundaries.
- If font families or subsets change, update the vendored files and the metadata in `src/app/fonts/README.md`.
