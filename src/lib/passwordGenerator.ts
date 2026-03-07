interface PassRule {
  name: string;
  minChars: number;
  maxChars: number | null;
  charset: string;
  returnedChars: number;
}

export interface PasswordConfig {
  length: number;
  upper: [number, number | null];
  lower: [number, number | null];
  digits: [number, number | null];
  symbols: [number, number | null];
  useSymbols: string;
}

function createRule(
  name: string,
  min: number,
  max: number | null,
  charset: string
): PassRule {
  return { name, minChars: min, maxChars: max, charset, returnedChars: 0 };
}

function validateRules(rules: PassRule[], length: number): void {
  const totalMin = rules.reduce((sum, r) => sum + r.minChars, 0);
  if (totalMin > length) {
    throw new Error(`Minimum requirements exceed password length`);
  }
}

function getRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error("maxExclusive must be a positive integer");
  }

  const randomValues = new Uint32Array(1);
  const uint32Space = 0x1_0000_0000;
  const limit = uint32Space - (uint32Space % maxExclusive);

  do {
    crypto.getRandomValues(randomValues);
  } while (randomValues[0] >= limit);

  return randomValues[0] % maxExclusive;
}

function getRandomChar(charset: string): string {
  return charset[getRandomInt(charset.length)];
}

function generatePasswordUnconstrained(config: PasswordConfig): string {
  const rules = [
    createRule("Upper", config.upper[0], config.upper[1], "ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
    createRule("Lower", config.lower[0], config.lower[1], "abcdefghijklmnopqrstuvwxyz"),
    createRule("Digit", config.digits[0], config.digits[1], "0123456789"),
    createRule("Symbol", config.symbols[0], config.symbols[1], config.useSymbols),
  ];

  validateRules(rules, config.length);

  const passwordChars: string[] = [];

  rules.forEach((rule) => {
    for (let i = 0; i < rule.minChars; i++) {
      passwordChars.push(getRandomChar(rule.charset));
      rule.returnedChars++;
    }
  });

  let availableRules = rules.filter(
    (r) => r.maxChars === null || r.returnedChars < r.maxChars
  );

  while (passwordChars.length < config.length) {
    const rule = availableRules[getRandomInt(availableRules.length)];
    passwordChars.push(getRandomChar(rule.charset));
    rule.returnedChars++;

    if (rule.maxChars !== null && rule.returnedChars >= rule.maxChars) {
      availableRules = availableRules.filter((r) => r !== rule);
    }
  }

  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join("");
}

export function generatePassword(config: PasswordConfig): string {
  let password: string;
  do {
    password = generatePasswordUnconstrained(config);
  } while (config.useSymbols.includes(password[0]));
  return password;
}
