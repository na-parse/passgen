"use client";

import { useState, useEffect, useCallback } from "react";
import { generatePassword, PasswordConfig } from "@/lib/passwordGenerator";

const PASSGEN_SAFESET = "!@#$%&_.,{}[]/";
const OWASP_SAFESET = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";

const DEFAULT_CONFIG: PasswordConfig = {
  length: 40,
  upper: [8, null],
  lower: [8, null],
  digits: [6, null],
  symbols: [6, 10],
  useSymbols: PASSGEN_SAFESET,
};

function loadStoredConfig(): PasswordConfig {
  if (typeof window === "undefined") {
    return DEFAULT_CONFIG;
  }

  const stored = localStorage.getItem("passgen-config");
  if (!stored) {
    return DEFAULT_CONFIG;
  }

  try {
    return JSON.parse(stored) as PasswordConfig;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function loadStoredTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = localStorage.getItem("passgen-theme");
  return storedTheme === "dark" ? "dark" : "light";
}

function validateConfig(config: PasswordConfig): string | null {
  if (config.length < 10) return "ERR: LENGTH < 10";
  const mins = [config.upper[0], config.lower[0], config.digits[0], config.symbols[0]];
  if (mins.some((m) => m < 0)) return "ERR: NEGATIVE VALUE DETECTED";
  const totalMin = mins.reduce((sum, m) => sum + m, 0);
  if (totalMin > config.length) return `ERR: MIN_CHARS(${totalMin}) EXCEEDS LENGTH(${config.length})`;
  const checks = [
    { name: "UPPER",   tuple: config.upper },
    { name: "LOWER",   tuple: config.lower },
    { name: "DIGITS",  tuple: config.digits },
    { name: "SYMBOLS", tuple: config.symbols },
  ];
  for (const check of checks) {
    if (check.tuple[1] !== null && check.tuple[1] < check.tuple[0])
      return `ERR: ${check.name}.MAX < ${check.name}.MIN`;
  }
  if (!config.useSymbols || config.useSymbols.length === 0) return "ERR: EMPTY SYMBOL CHARSET";
  for (const char of config.useSymbols) {
    if (!OWASP_SAFESET.includes(char)) return `ERR: INVALID GLYPH "${char}"`;
  }
  return null;
}

function formatConfigBar(config: PasswordConfig): string {
  const fmt = (t: [number, number | null]) =>
    t[1] === null ? `${t[0]},-` : `${t[0]},${t[1]}`;
  const charset =
    config.useSymbols === PASSGEN_SAFESET ? "safe"
    : config.useSymbols === OWASP_SAFESET ? "owasp"
    : "custom";
  return [
    `L=${config.length}`,
    `U=${fmt(config.upper)}`,
    `lc=${fmt(config.lower)}`,
    `#=${fmt(config.digits)}`,
    `$=${fmt(config.symbols)}`,
    `[${charset}]`,
  ].join("  ·  ");
}

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); resolve(); }
    catch (e) { reject(e); }
    finally { document.body.removeChild(ta); }
  });
}

export default function PassgenPage() {
  const [config, setConfigState] = useState<PasswordConfig>(() => loadStoredConfig());
  const [passwords, setPasswords] = useState<string[]>([]);
  const [showCopied, setShowCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(() =>
    validateConfig(loadStoredConfig())
  );
  const [showConfig, setShowConfig] = useState(false);
  const [showInvalidConfig, setShowInvalidConfig] = useState(false);
  const [expandedPolicy, setExpandedPolicy] = useState<"privacy" | "terms" | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => loadStoredTheme());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  useEffect(() => {
    if (!showConfig) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowConfig(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showConfig]);

  const updateConfig = useCallback((newConfig: PasswordConfig) => {
    setConfigState(newConfig);
    setValidationError(validateConfig(newConfig));
    localStorage.setItem("passgen-config", JSON.stringify(newConfig));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("passgen-theme", next);
      return next;
    });
  }, []);

  const handleGenerate = () => {
    if (validationError) { setShowInvalidConfig(true); return; }
    const pwd = generatePassword(config);
    setPasswords([pwd, ...passwords]);
  };

  const handleCopy = async (password: string) => {
    try {
      await copyToClipboard(password);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch { /* */ }
  };

  return (
    <div className="pg-body" data-theme={theme}>
      {/* Theme Toggle */}
      <button
        className="pg-theme-toggle"
        onClick={toggleTheme}
        title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M9 3.5a7.5 7.5 0 0 0 5.5 12.93A7.5 7.5 0 1 1 9 3.5z"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        )}
      </button>

      {/* Main Content */}
      <div className={`pg-main pg-content${mounted ? " pg-visible" : ""}`}>
        <h1 className="pg-title">PASSGEN</h1>
        <p className="pg-sub">secure password generation</p>

        <hr className="pg-divider" />

        {/* Action Buttons */}
        <div className="pg-actions">
          <button
            onClick={handleGenerate}
            className="pg-btn pg-btn-flex"
          >
            GENERATE
          </button>
          <button onClick={() => setShowConfig(true)} className="pg-btn pg-btn-icon">
            CONFIG
          </button>
          <button
            onClick={() => setPasswords([])}
            disabled={passwords.length === 0}
            className="pg-btn pg-btn-red pg-btn-icon"
          >
            FLUSH
          </button>
        </div>

        {/* Config Summary Bar */}
        <div className="pg-config-bar" onClick={() => setShowConfig(true)}>
          {formatConfigBar(config)}
        </div>

        {/* Empty State */}
        {passwords.length === 0 && (
          <div className="pg-empty-state">
            <p>
              <span style={{ color: "var(--red)", fontWeight: 700 }}>Passgen</span> generates
              cryptographically secure passwords using hardware entropy via the Web Crypto API.
              All operations execute locally in your browser. No data is transmitted.
            </p>
            <p>
              Click <span style={{ fontWeight: 700 }}>GENERATE</span> to generate a password.
              Click any output to copy to your clipboard. Adjust parameters via{" "}
              <span style={{ fontWeight: 700 }}>CONFIG</span>. Use{" "}
              <span style={{ color: "var(--red)", fontWeight: 700 }}>FLUSH</span> to clear all
              generated passwords from memory.
            </p>
          </div>
        )}

        {/* Password hint */}
        {passwords.length > 0 && <div className="pg-hint">click to copy</div>}

        {/* Password List */}
        <div className="pg-list">
          {passwords.map((pwd, idx) => (
            <div key={idx} onClick={() => handleCopy(pwd)} className="pg-password" title="Click to copy">
              {pwd}
            </div>
          ))}
        </div>
      </div>

      {/* Config Modal */}
      {showConfig && (
        <div className="pg-overlay" onClick={() => setShowConfig(false)}>
          <div className="pg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pg-modal-header">
              <span className="pg-modal-title">PARAMETERS</span>
              <button className="pg-close-btn" onClick={() => setShowConfig(false)}>
                &#10005;
              </button>
            </div>
            <div className="pg-modal-body">
              {validationError && (
                <div className="pg-error">{validationError}</div>
              )}

              {/* Length slider */}
              <div style={{ marginBottom: 20 }}>
                <div className="pg-length-row">
                  <span className="pg-label">LENGTH</span>
                  <span className="pg-length-value">{config.length}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="64"
                  value={config.length}
                  onChange={(e) => updateConfig({ ...config, length: parseInt(e.target.value) || 10 })}
                />
              </div>

              {/* Min/max fields */}
              {[
                { label: "UPPER",   key: "upper"   as const },
                { label: "LOWER",   key: "lower"   as const },
                { label: "DIGITS",  key: "digits"  as const },
                { label: "SYMBOLS", key: "symbols" as const },
              ].map(({ label, key }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <span className="pg-label">{label}</span>
                  <div className="pg-field-row">
                    <div>
                      <div className="pg-sublabel">min</div>
                      <input
                        type="number"
                        min="0"
                        value={config[key][0]}
                        onChange={(e) => updateConfig({ ...config, [key]: [parseInt(e.target.value) || 0, config[key][1]] })}
                        className="pg-input"
                      />
                    </div>
                    <div>
                      <div className="pg-sublabel">max</div>
                      <input
                        type="number"
                        min="0"
                        value={config[key][1] ?? ""}
                        placeholder="null"
                        onChange={(e) => updateConfig({ ...config, [key]: [config[key][0], e.target.value === "" ? null : parseInt(e.target.value)] })}
                        className="pg-input"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <hr className="pg-rule-divider" />

              {/* Charset */}
              <div style={{ marginBottom: 16 }}>
                <span className="pg-label">CHARSET</span>
                <input
                  type="text"
                  value={config.useSymbols}
                  onChange={(e) => updateConfig({ ...config, useSymbols: e.target.value })}
                  className="pg-input"
                  style={{ marginBottom: 8 }}
                />
                <div className="pg-charset-chips">
                  <button
                    onClick={() => updateConfig({ ...config, useSymbols: PASSGEN_SAFESET })}
                    className={`pg-chip ${config.useSymbols === PASSGEN_SAFESET ? "pg-chip-active" : ""}`}
                  >
                    SafeSet
                  </button>
                  <button
                    onClick={() => updateConfig({ ...config, useSymbols: OWASP_SAFESET })}
                    className={`pg-chip ${config.useSymbols === OWASP_SAFESET ? "pg-chip-active" : ""}`}
                  >
                    OWASP
                  </button>
                </div>
              </div>

              <button onClick={() => updateConfig(DEFAULT_CONFIG)} className="pg-btn pg-btn-sm">
                RESET DEFAULTS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invalid Config Modal */}
      {showInvalidConfig && (
        <div className="pg-overlay" onClick={() => setShowInvalidConfig(false)}>
          <div className="pg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pg-modal-header">
              <span className="pg-modal-title">INVALID CONFIGURATION</span>
              <button className="pg-close-btn" onClick={() => setShowInvalidConfig(false)}>
                &#10005;
              </button>
            </div>
            <div className="pg-modal-body">
              <div className="pg-error">{validationError}</div>
              <p style={{ margin: "16px 0 20px" }}>
                Your saved configuration is invalid. Reset to defaults to continue generating passwords,
                or close this dialog and adjust your settings via CONFIG.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { updateConfig(DEFAULT_CONFIG); setShowInvalidConfig(false); }}
                  className="pg-btn pg-btn-flex"
                >
                  RESET TO DEFAULTS
                </button>
                <button
                  onClick={() => { setShowInvalidConfig(false); setShowConfig(true); }}
                  className="pg-btn pg-btn-icon"
                >
                  CONFIG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showCopied && <div className="pg-toast">COPIED</div>}

      {/* Footer */}
      <footer className="pg-footer">
        <div className="pg-footer-inner">
          <span className="pg-footer-links">
            <a href="https://www.unit03.net" target="_blank" rel="noopener noreferrer" className="pg-footer-link">
              NA-PARSE
            </a>
            <span className="pg-footer-sep">/</span>
            <a href="https://github.com/na-parse/passgen" target="_blank" rel="noopener noreferrer" className="pg-footer-link">
              PASSGEN-SOURCE
            </a>
          </span>

          <span className="pg-footer-license">MIT License</span>

          <div className="pg-footer-actions">
            <button
              onClick={() => setExpandedPolicy(expandedPolicy === "privacy" ? null : "privacy")}
              className="pg-policy-btn"
            >
              Privacy {expandedPolicy === "privacy" ? "▼" : "▶"}
            </button>
            <button
              onClick={() => setExpandedPolicy(expandedPolicy === "terms" ? null : "terms")}
              className="pg-policy-btn"
            >
              Terms {expandedPolicy === "terms" ? "▼" : "▶"}
            </button>
            <a href="https://github.com/na-parse" target="_blank" rel="noopener noreferrer" className="pg-github-link">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Privacy Policy */}
        {expandedPolicy === "privacy" && (
          <div className="pg-policy-panel">
            <div className="pg-policy-title">PRIVACY POLICY</div>
            <p><strong>Open Source:</strong> This application is open source and publicly available on GitHub under the MIT License. You can review the code, fork it, and modify it as needed.</p>
            <p><strong>Client-Side Generation:</strong> All passwords are generated entirely in your browser using the Web Cryptography API. No passwords are transmitted to any server, stored remotely, or processed by third parties.</p>
            <p><strong>Configuration Storage:</strong> Your password generation settings are stored only in your browser&#39;s localStorage. This data remains on your device and is never transmitted to any server.</p>
            <p><strong>Zero Tracking:</strong> This application contains no analytics, tracking pixels, cookies, or telemetry. We have no mechanism to identify you or track what you do with this tool.</p>
            <p><strong>External Resources:</strong> This app loads fonts from Google Fonts. Review Google&#39;s privacy policy regarding their font services.</p>
            <p><strong>Your Security Responsibility:</strong> Back up generated passwords to your password manager immediately. Clear your browser history/cache if needed. Your security depends on your device and browser security.</p>
          </div>
        )}

        {/* Terms of Service */}
        {expandedPolicy === "terms" && (
          <div className="pg-policy-panel">
            <div className="pg-policy-title">TERMS OF SERVICE</div>
            <p><strong>MIT License:</strong> This software is licensed under the MIT License. View the full license on GitHub. You are free to use, modify, fork, and distribute this code under the MIT terms.</p>
            <p><strong>As-Is Disclaimer:</strong> This application is provided &#34;as-is&#34; without warranty of any kind, express or implied. We implement industry-standard cryptographic practices, but make no guarantees about password strength, randomness quality, or security.</p>
            <p><strong>No Liability:</strong> We are not liable for any damages, data loss, security breaches, or access loss resulting from your use of this application. You assume all risk when using this tool.</p>
            <p><strong>Your Responsibility:</strong> You are responsible for managing and securing generated passwords. Immediately save passwords to your password manager. We have no ability to recover lost passwords.</p>
            <p><strong>Ethical Use:</strong> Use this tool only for legitimate password generation. Do not use it for unauthorized access, system abuse, or any malicious purpose.</p>
            <p><strong>Security Disclosure:</strong> If you discover a security vulnerability, please report it responsibly to the maintainers on GitHub rather than public disclosure.</p>
          </div>
        )}
      </footer>
    </div>
  );
}
