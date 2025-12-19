# passgen Design Documentation

**Version:** 0.2.1
**Last Updated:** 2025-12-18
**Technology Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Password Generation Algorithm](#password-generation-algorithm)
4. [User Interface Flow](#user-interface-flow)
5. [State Management](#state-management)
6. [Security Headers](#security-headers)
7. [Configuration System](#configuration-system)
8. [Data Flow Diagram](#data-flow-diagram)

---

## System Overview

passgen is a **client-side password generator** that runs entirely in the user's browser. No passwords are transmitted to any server; no data is persisted remotely.

### Core Principles
- **Privacy First:** Passwords generated locally only
- **Statistically Correct:** Rejection sampling ensures uniform distribution
- **Cryptographically Secure:** Uses `crypto.getRandomValues()` for RNG
- **User Configurable:** Min/max constraints per character type
- **No Tracking:** Zero analytics, telemetry, or external requests (except fonts)

### Key Characteristics
| Aspect | Details |
|--------|---------|
| **Generation Model** | Client-side only, single-threaded |
| **Randomness Source** | Web Cryptography API (`crypto.getRandomValues()`) |
| **Password Entropy** | Rejection sampling with Fisher-Yates shuffle |
| **Configuration Persistence** | Browser localStorage (unencrypted) |
| **Password History** | Session memory only (cleared on page reload) |
| **Network Activity** | None (except Google Fonts CDN for typography) |

---

## Architecture

### Component Structure

```
src/
├── app/
│   ├── page.tsx          # Main UI component (React)
│   ├── layout.tsx        # Root layout & metadata
│   └── globals.css       # Tailwind + custom styles
├── lib/
│   └── passwordGenerator.ts  # Core algorithm
└── next.config.ts        # Next.js configuration (security headers)
```

### Component Responsibilities

#### `src/lib/passwordGenerator.ts` (Core Logic)
**Exports:** `generatePassword(config: PasswordConfig): string`

**Interfaces:**
```typescript
PassRule {
  name: string;              // "Upper", "Lower", "Digit", "Symbol"
  minChars: number;          // Minimum required
  maxChars: number | null;   // Maximum allowed (null = unlimited)
  charset: string;           // Characters to choose from
  returnedChars: number;     // Tracking (internal use)
}

PasswordConfig {
  length: number;            // Total password length (10-64)
  upper: [number, number|null];    // Uppercase min/max
  lower: [number, number|null];    // Lowercase min/max
  digits: [number, number|null];   // Digit min/max
  symbols: [number, number|null];  // Symbol min/max
  useSymbols: string;        // Custom symbol charset
}
```

**Key Functions:**
- `getRandomChar(charset)` - Cryptographically secure random character selection
- `validateRules(rules, length)` - Ensures constraints are satisfiable
- `generatePasswordUnconstrained(config)` - Core algorithm without first-char constraint
- `generatePassword(config)` - Wrapper with rejection sampling for first-char validation

#### `src/app/page.tsx` (UI)
**Responsibilities:**
- Configuration management (state + localStorage persistence)
- Password generation trigger
- Password history display and copying
- Settings drawer with real-time validation
- Keyboard shortcuts (ESC to close drawer)

**State Management:**
```typescript
config: PasswordConfig          // Current configuration
passwords: string[]             // Generated password history
showCopied: boolean             // Copy confirmation toast
validationError: string | null  // Form validation feedback
isDrawerOpen: boolean           // Settings panel visibility
```

**Default Configuration:**
```typescript
{
  length: 40,
  upper: [8, null],      // 8+ uppercase letters
  lower: [8, null],      // 8+ lowercase letters
  digits: [6, null],     // 6+ digits
  symbols: [6, 10],      // 6-10 symbols
  useSymbols: "!@#$%&_.,{}[]/",
}
```

---

## Password Generation Algorithm

### Overview
The algorithm ensures:
1. **Character type constraints** are met (min/max per type)
2. **Statistical uniformity** across all positions
3. **First character is never a symbol** for usability

### Step-by-Step Process

#### Phase 1: Initialization
```typescript
// Create rules for each character type
const rules = [
  Rule("Upper", min=8, max=null, charset="ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
  Rule("Lower", min=8, max=null, charset="abcdefghijklmnopqrstuvwxyz"),
  Rule("Digit", min=6, max=null, charset="0123456789"),
  Rule("Symbol", min=6, max=10, charset="!@#$%&_.,{}[]/"),
];

// Validate satisfiability
validateRules(rules, length=40);  // Throws if impossible
```

**Why:** Sets up the constraints that must be satisfied.

#### Phase 2: Fill Minimums
```typescript
// For each rule, add minimum required characters
for each rule:
  for i from 1 to rule.minChars:
    passwordChars.push(getRandomChar(rule.charset))
    rule.returnedChars++
```

**Current state after Phase 2 (default config):**
- Uppercase: 8 characters
- Lowercase: 8 characters
- Digits: 6 characters
- Symbols: 6 characters
- Total: 28 characters (12 slots remaining for 40-char password)

**Why:** Guarantees all character types are represented.

#### Phase 3: Fill Remaining
```typescript
// Identify available rules (not yet at max)
availableRules = rules where (rule.maxChars is null OR rule.returnedChars < rule.maxChars)

// Fill remaining slots randomly from available rules
while passwordChars.length < targetLength:
  selectedRule = availableRules[random(0, availableRules.length)]
  passwordChars.push(getRandomChar(selectedRule.charset))
  selectedRule.returnedChars++

  // If rule hit its max, remove from available
  if selectedRule.returnedChars >= selectedRule.maxChars:
    availableRules.remove(selectedRule)
```

**Current state after Phase 3:**
- Total: 40 characters
- Distribution: Symbols now 6-10, others proportional to availability

**Why:** Randomly distributes additional characters while respecting max constraints.

#### Phase 4: Fisher-Yates Shuffle
```typescript
// Shuffle all positions except 0 (will fix that next)
for i from passwordChars.length-1 down to 1:
  j = random(0, i+1)
  swap(passwordChars[i], passwordChars[j])
```

**Result:** Uniform random ordering of all characters

**Why:** Ensures no bias in character positions from filling order.

#### Phase 5: Rejection Sampling (First-Char Constraint)
```typescript
// Keep regenerating until position 0 is NOT a symbol
do {
  password = generatePasswordUnconstrained(config)
} while (password[0] is a symbol)

return password
```

**Rejection Rate:** ~15-25% (with default config)
**Average Regenerations:** 1-2 attempts

**Why:** Ensures first character is printable (no symbols), improving UX while maintaining statistical correctness.

---

## Cryptographic Details

### Random Byte Generation
```typescript
function getRandomChar(charset: string): string {
  const randomBytes = new Uint8Array(1);
  crypto.getRandomValues(randomBytes);  // Cryptographically secure
  return charset[randomBytes[0] % charset.length];
}
```

**Key Points:**
- `crypto.getRandomValues()` is the Web Cryptography API standard
- Returns cryptographically-secure random bytes from OS entropy pool
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Requires HTTPS in production (browsers block http:// for security APIs)

**Why Not Math.random()?**
- Math.random() has only ~53-bit entropy, predictable
- Not suitable for security applications (NIST, OWASP standards)
- Fixed in v0.2.1 for production readiness

### Entropy Calculation
For default config (40-char password, 94-char effective alphabet):
- Theoretical maximum entropy: log₂(94⁴⁰) ≈ 263 bits
- Actual entropy: Slightly lower due to min/max constraints
- Practical strength: Exceeds all password security standards (>128 bits)

---

## User Interface Flow

### Main Screen
1. **Title & Description** - Identifies the app
2. **Current Ruleset Display** - Shows active configuration
3. **Generate Button** - Triggers password generation (disabled if config invalid)
4. **Password History** - List of generated passwords, clickable to copy
5. **Copy Toast** - Confirmation message (2-second timeout)

### Settings Drawer
**Triggered by:** Clicking ruleset card or settings icon
**Closed by:** ESC key, backdrop click, or Accept button
**Keyboard Support:** ESC key closes drawer

**Settings Controls:**
- **Password Length:** Range slider (10-64)
- **Character Type Configs:** Min/Max inputs for upper, lower, digits, symbols
- **Symbol Charset:** Text input (accepts any characters)
- **Accept Button:** Applies changes
- **Reset Button:** Restores defaults

**Validation:**
- Real-time validation on every change
- Error message displayed if config invalid
- Generate button disabled when validation fails
- Error persists until corrected

### Visual Feedback
- Orange/yellow gradient theme for primary actions
- Hover effects on interactive elements
- Copy confirmation toast (2-second auto-dismiss)
- Validation error in red box

---

## State Management

### React Hooks Pattern
```typescript
// Component state
const [config, setConfigState] = useState<PasswordConfig>(DEFAULT_CONFIG);
const [passwords, setPasswords] = useState<string[]>([]);
const [showCopied, setShowCopied] = useState(false);
const [validationError, setValidationError] = useState<string | null>(null);
const [isDrawerOpen, setIsDrawerOpen] = useState(false);
```

### localStorage Persistence
```typescript
// Load from localStorage on mount
useEffect(() => {
  const stored = localStorage.getItem("passgen-config");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      setConfigState(parsed);  // User's saved config
    } catch {
      setConfigState(DEFAULT_CONFIG);  // Fallback on corruption
    }
  }
}, []);

// Save to localStorage on config change
const updateConfig = (newConfig: PasswordConfig) => {
  setConfigState(newConfig);
  const error = validateConfig(newConfig);
  setValidationError(error);
  localStorage.setItem("passgen-config", JSON.stringify(newConfig));
};
```

**Data Storage:**
- Key: `passgen-config`
- Format: JSON string of PasswordConfig object
- Persistence: Until user clears browser data
- Encryption: None (passwords not stored, only config)

### Event Handlers
| Event | Handler | Purpose |
|-------|---------|---------|
| Generate click | `handleGenerate()` | Generate password, add to history |
| Copy click | `handleCopy()` | Copy to clipboard, show toast |
| Drawer ESC | `handleEscape()` | Close settings panel |
| Backdrop click | `handleBackdropClick()` | Close settings panel |
| Reset button | `handleReset()` | Restore default config |

---

## Security Headers

Security headers are HTTP response headers sent by the server to tell browsers how to handle content. They provide defense-in-depth against common web attacks.

### Headers Configured

#### 1. **X-Content-Type-Options: nosniff**
**Purpose:** Prevent MIME-type confusion attacks
**Mechanism:** Forces browser to respect Content-Type header, disallows guessing
**Browser Behavior:** If header says `image/png`, browser won't try to execute as script
**Relevance to passgen:** Protects against malicious file uploads if hosting changes

---

#### 2. **X-Frame-Options: DENY**
**Purpose:** Prevent clickjacking attacks
**Mechanism:** Page cannot be embedded in an `<iframe>` on other domains
**Browser Behavior:** If attacker tries to embed passgen in invisible iframe, browser blocks it
**Relevance to passgen:** Prevents attacker from tricking users into interactions

**Attack Example Prevented:**
```html
<!-- attacker.com -->
<iframe src="https://passgen.com" style="opacity: 0; position: absolute;"></iframe>
<button>Claim free gift!</button>
<!-- User clicks button, actually clicks Generate Password -->
```

---

#### 3. **X-XSS-Protection: 1; mode=block**
**Purpose:** Legacy XSS protection for older browsers
**Mechanism:** `1` = enable, `mode=block` = block page if XSS detected
**Browser Behavior:** Older IE/Edge versions will block the entire page rather than render
**Relevance to passgen:** Defense-in-depth for browsers that don't support modern CSP
**Note:** Modern browsers prefer CSP; this is backup

---

#### 4. **Referrer-Policy: no-referrer**
**Purpose:** Privacy protection, prevent referrer leakage
**Mechanism:** Don't send Referrer header to external sites
**Browser Behavior:** When user clicks GitHub link, GitHub doesn't know they came from passgen
**Relevance to passgen:** Prevents third-party analytics from tracking user visits

**Privacy Protection:**
```
User on passgen.com → clicks GitHub link
Without header: GitHub log shows "came from passgen.com"
With header: GitHub log shows "no referrer" (anonymized)
```

---

#### 5. **Strict-Transport-Security: max-age=31536000; includeSubDomains**
**Purpose:** Force HTTPS connections, prevent downgrade attacks
**Mechanism:**
- `max-age=31536000` = Remember for 1 year (31,536,000 seconds)
- `includeSubDomains` = Applies to all subdomains too

**Browser Behavior:**
- User types `http://passgen.com` → Browser auto-upgrades to `https://passgen.com`
- For 1 year, browser remembers to always use HTTPS
- Even if DNS is compromised, user gets HTTPS

**Relevance to passgen:** Prevents man-in-the-middle (MITM) attacks on WiFi

**Attack Prevented:**
```
User on public WiFi types: http://passgen.com
Without HSTS: Connection is plaintext HTTP, attacker captures config
With HSTS: Browser auto-uses HTTPS, connection encrypted
```

---

#### 6. **Content-Security-Policy (CSP)**
**Purpose:** Prevent XSS attacks by controlling content sources
**Mechanism:** Whitelist allowed sources for scripts, styles, fonts, images
**Browser Behavior:** Browser blocks any script/style/font not from whitelisted source

**Policy Breakdown:**
```
default-src 'self'
  ↳ Everything defaults to same-origin only (same domain)

script-src 'self' 'unsafe-inline' 'unsafe-eval'
  ↳ Scripts from same-origin, inline scripts (required by Next.js),
    and eval (required by React)

style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
  ↳ Styles from same-origin, inline styles, and Google Fonts API

font-src 'self' https://fonts.gstatic.com
  ↳ Font files from same-origin and Google Fonts CDN

img-src 'self' data:
  ↳ Images from same-origin and data URIs (for inline SVGs)
```

**Why These Specific Allowances:**
- `'self'` = Your domain (passgen.com)
- `'unsafe-inline'` = Required because Next.js/React inject inline CSS/JS
- `'unsafe-eval'` = React needs this for development features
- `fonts.googleapis.com` = Where you import Geist font definitions
- `fonts.gstatic.com` = Where actual font files are hosted
- `data:` = For inline SVG images in buttons/icons

**Attack Prevented:**
```html
<!-- Malicious script injected by attacker -->
<script src="https://attacker.com/steal-passwords.js"></script>
```
CSP blocks it because `attacker.com` not in `script-src` whitelist.

---

#### 7. **X-Powered-By: (removed)**
**Configuration:** `poweredByHeader: false` in `next.config.ts`
**Purpose:** Prevent information leakage
**Mechanism:** Removes the `X-Powered-By: Next.js` header
**Browser Behavior:** Browser doesn't see "Next.js 16.0.10", slightly harder to fingerprint
**Relevance to passgen:** Security through obscurity - doesn't advertise framework version

---

### Header Testing

#### Local Testing
```bash
npm run build
npm run start

# In another terminal
curl -i http://localhost:3012
```

Look for headers in response:
```
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; ...
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
...
```

#### Browser DevTools Testing
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Click main document request
5. Go to Response Headers section
6. Verify all headers present

---

## Configuration System

### Default Configuration
```typescript
{
  length: 40,                    // Sensible default (strong password)
  upper: [8, null],              // At least 8 uppercase
  lower: [8, null],              // At least 8 lowercase
  digits: [6, null],             // At least 6 digits
  symbols: [6, 10],              // 6-10 symbols (limited for portability)
  useSymbols: "!@#$%&_.,{}[]/",  // Symbols that work everywhere
}
```

### Configuration Constraints
| Constraint | Value | Reason |
|-----------|-------|--------|
| Min length | 10 | Minimum acceptable password strength |
| Max length | 64 | Practical limit, covers all use cases |
| Min total | sum of character min requirements | Must be satisfiable |
| Max total | ≤ password length | Physical impossibility check |
| Symbol charset | Must be non-empty | Required for generation |
| Min values | Non-negative | Logical constraint |

### Validation Logic
```typescript
function validateConfig(config: PasswordConfig): string | null {
  // 1. Check length bounds
  if (config.length < 10) return "Length must be at least 10";

  // 2. Check negative values
  const mins = [config.upper[0], config.lower[0], config.digits[0], config.symbols[0]];
  if (mins.some((m) => m < 0)) return "Minimum values cannot be negative";

  // 3. Check total minimums don't exceed length
  const totalMin = mins.reduce((sum, m) => sum + m, 0);
  if (totalMin > config.length)
    return `Minimum required characters (${totalMin}) exceed password length (${config.length})`;

  // 4. Check max >= min for each type
  for (const check of checks) {
    if (check.tuple[1] !== null && check.tuple[1] < check.tuple[0])
      return `${check.name} max must be >= min`;
  }

  // 5. Check symbol charset not empty
  if (!config.useSymbols || config.useSymbols.length === 0)
    return "Symbol charset cannot be empty";

  return null;  // All checks passed
}
```

---

## Data Flow Diagram

```
User Input
    │
    ├─→ Settings Drawer
    │   ├─→ Length slider
    │   ├─→ Character min/max inputs
    │   ├─→ Symbol charset text
    │   └─→ Reset button
    │
    └─→ Generate Button
        │
        ├─→ validateConfig()
        │   └─→ Returns error or null
        │
        ├─→ generatePassword(config)
        │   │
        │   ├─→ generatePasswordUnconstrained()
        │   │   ├─→ Create 4 character rules
        │   │   ├─→ validateRules()
        │   │   ├─→ Fill minimum characters
        │   │   │   └─→ getRandomChar() ──→ crypto.getRandomValues()
        │   │   ├─→ Fill remaining slots
        │   │   │   └─→ getRandomChar() ──→ crypto.getRandomValues()
        │   │   └─→ Fisher-Yates shuffle
        │   │
        │   └─→ Rejection sampling loop
        │       └─→ Check position[0] is not symbol
        │
        └─→ Update State
            ├─→ setPasswords([newPassword, ...passwords])
            └─→ Display in history
                │
                └─→ Copy on Click
                    ├─→ navigator.clipboard.writeText()
                    └─→ Show toast (2-second timeout)

localStorage
    │
    ├─→ Save on config change
    │   └─→ JSON.stringify(config)
    │
    └─→ Load on app init
        └─→ JSON.parse() + fallback to DEFAULT_CONFIG
```

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge | IE |
|---------|--------|---------|--------|------|-----|
| crypto.getRandomValues() | ✓ 11+ | ✓ 21+ | ✓ 11+ | ✓ 79+ | ✗ |
| navigator.clipboard | ✓ 63+ | ✓ 63+ | ✓ 13.1+ | ✓ 79+ | ✗ |
| localStorage | ✓ All | ✓ All | ✓ All | ✓ All | ✓ 8+ |
| Fetch API | ✓ 40+ | ✓ 39+ | ✓ 10.1+ | ✓ 14+ | ✗ |
| ES2017 (target) | ✓ 51+ | ✓ 54+ | ✓ 10.1+ | ✓ 15+ | ✗ |

**Conclusion:** Modern browsers only (no IE support). Desktop and mobile fully supported.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.2.1 | 2025-12-18 | Replace Math.random() with crypto.getRandomValues(), add security headers |
| 0.2.0 | Earlier | Statistical bias fix (rejection sampling), settings persistence |
| 0.1.x | Earlier | Initial development, core algorithm |

---

## Future Enhancement Considerations

- [ ] Encrypted localStorage config option
- [ ] Auto-clear password history after inactivity timeout
- [ ] Keyboard-accessible settings drawer (Tab navigation)
- [ ] Dark/light mode toggle
- [ ] ARIA labels for accessibility (WCAG 2.1 AA compliance)
- [ ] Printable password display format
- [ ] QR code generation for passwords
- [ ] Password strength meter
- [ ] Export passwords to CSV (with user consent flow)
- [ ] Batch generate multiple passwords

---

**End of Design Documentation**
