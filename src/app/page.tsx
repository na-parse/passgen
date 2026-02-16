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

function validateConfig(config: PasswordConfig): string | null {
  if (config.length < 10) return "ERR: LENGTH < 10";
  const mins = [config.upper[0], config.lower[0], config.digits[0], config.symbols[0]];
  if (mins.some((m) => m < 0)) return "ERR: NEGATIVE VALUE DETECTED";
  const totalMin = mins.reduce((sum, m) => sum + m, 0);
  if (totalMin > config.length) return `ERR: MIN_CHARS(${totalMin}) EXCEEDS LENGTH(${config.length})`;
  const checks = [
    { name: "UPPER", tuple: config.upper },
    { name: "LOWER", tuple: config.lower },
    { name: "DIGITS", tuple: config.digits },
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
  const [config, setConfigState] = useState<PasswordConfig>(DEFAULT_CONFIG);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [showCopied, setShowCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [expandedPolicy, setExpandedPolicy] = useState<"privacy" | "terms" | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("passgen-config");
    if (stored) {
      try { setConfigState(JSON.parse(stored) as PasswordConfig); }
      catch { setConfigState(DEFAULT_CONFIG); }
    }
    const storedTheme = localStorage.getItem("passgen-theme");
    if (storedTheme === "dark" || storedTheme === "light") setTheme(storedTheme);
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
    if (validationError) return;
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
    <>
      <style jsx global>{`
        /* ============================================================= */
        /* Design Tokens                                                 */
        /* ============================================================= */

        .pg-body {
          --bg: #e1e1e1;
          --fg: #0a0a0a;
          --surface: #f0f0f0;
          --red: #ff0000;
          --desc: #555555;
          --rule: #d0d0d0;
          --gray-mid: #999999;
          --overlay: rgba(10, 10, 10, 0.4);

          background: var(--bg);
          min-height: 100vh;
          font-family: var(--font-archivo), 'Archivo', sans-serif;
          color: var(--fg);
          position: relative;
          overflow-x: hidden;
        }

        .pg-body[data-theme="dark"] {
          --bg: #081a19;
          --fg: #f0f0f0;
          --surface: #1a1a1a;
          --desc: #9a9a9a;
          --rule: #2a2a2a;
          --gray-mid: #777777;
          --overlay: rgba(0, 0, 0, 0.6);
        }

        /* ============================================================= */
        /* Slide-up Entrance Animation                                   */
        /* ============================================================= */

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pg-main {
          opacity: 0;
          transform: translateY(24px);
        }

        .pg-main.pg-visible {
          animation: slideUp 0.5s ease-out forwards;
        }

        /* ============================================================= */
        /* Title                                                         */
        /* ============================================================= */

        .pg-title {
          font-family: var(--font-archivo-black), 'Archivo Black', sans-serif;
          font-weight: 400;
          font-size: clamp(2rem, 5vw, 3.2rem);
          text-transform: uppercase;
          letter-spacing: -0.03em;
          text-align: center;
          color: var(--fg);
          margin: 0;
        }

        .pg-sub {
          font-family: var(--font-archivo), 'Archivo', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: var(--desc);
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-top: 6px;
        }

        /* ============================================================= */
        /* Buttons                                                       */
        /* ============================================================= */

        .pg-btn {
          font-family: var(--font-archivo-black), 'Archivo Black', sans-serif;
          font-weight: 400;
          font-size: 16px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: var(--surface);
          color: var(--fg);
          border: 1px solid var(--rule);
          padding: 14px 24px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
        }

        .pg-btn:hover {
          background: var(--fg);
          color: var(--bg);
          border-color: var(--fg);
        }

        .pg-btn:disabled {
          color: var(--gray-mid);
          border-color: var(--rule);
          cursor: not-allowed;
          background: var(--surface);
          opacity: 0.5;
        }

        .pg-btn:disabled:hover {
          background: var(--surface);
          color: var(--gray-mid);
          border-color: var(--rule);
        }

        .pg-btn-red {
          color: var(--red);
          border-color: var(--red);
        }

        .pg-btn-red:hover {
          background: var(--red);
          color: #ffffff;
          border-color: var(--red);
        }

        .pg-btn-red:disabled {
          color: var(--red);
          border-color: var(--red);
          opacity: 0.3;
        }

        .pg-btn-red:disabled:hover {
          background: var(--surface);
          color: var(--red);
          border-color: var(--red);
        }

        /* ============================================================= */
        /* Inputs                                                        */
        /* ============================================================= */

        .pg-input {
          font-family: var(--font-fira-code), 'Fira Code', monospace;
          font-size: 14px;
          background: var(--surface);
          border: 1px solid var(--rule);
          color: var(--fg);
          padding: 10px 14px;
          outline: none;
          width: 100%;
          transition: border-color 0.2s;
        }

        .pg-input:focus {
          border-color: var(--fg);
        }

        .pg-input::placeholder { color: var(--gray-mid); }

        /* ============================================================= */
        /* Password Items                                                */
        /* ============================================================= */

        .pg-password {
          padding: 14px 16px;
          background: var(--surface);
          border: 1px solid var(--rule);
          cursor: pointer;
          font-family: var(--font-fira-code), 'Fira Code', monospace;
          font-size: 15px;
          color: var(--fg);
          transition: background 0.2s, border-color 0.2s;
          overflow-x: auto;
          white-space: nowrap;
        }

        .pg-password:hover {
          border-color: var(--fg);
          background: var(--bg);
        }

        /* ============================================================= */
        /* Config Labels                                                 */
        /* ============================================================= */

        .pg-label {
          font-family: var(--font-archivo-black), 'Archivo Black', sans-serif;
          font-weight: 400;
          font-size: 12px;
          color: var(--red);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          display: block;
          margin-bottom: 6px;
        }

        /* ============================================================= */
        /* Toast                                                         */
        /* ============================================================= */

        .pg-toast {
          position: fixed;
          top: 16px;
          right: 70px;
          background: var(--surface);
          border: 2px solid var(--red);
          color: var(--fg);
          padding: 12px 20px;
          font-family: var(--font-archivo-black), 'Archivo Black', sans-serif;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          z-index: 100;
        }

        /* ============================================================= */
        /* Config Modal                                                  */
        /* ============================================================= */

        .pg-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: var(--overlay);
          backdrop-filter: blur(4px);
          z-index: 90;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .pg-modal {
          background: var(--surface);
          border: 2px solid var(--fg);
          width: 100%;
          max-width: 520px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .pg-modal::-webkit-scrollbar { width: 6px; }
        .pg-modal::-webkit-scrollbar-track { background: var(--bg); }
        .pg-modal::-webkit-scrollbar-thumb { background: var(--gray-mid); }

        .pg-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid var(--rule);
        }

        .pg-close-btn {
          background: none;
          border: 1px solid var(--rule);
          color: var(--desc);
          font-family: var(--font-archivo), 'Archivo', sans-serif;
          font-size: 16px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pg-close-btn:hover {
          color: var(--red);
          border-color: var(--red);
          background: var(--bg);
        }

        /* ============================================================= */
        /* Chips                                                         */
        /* ============================================================= */

        .pg-chip {
          font-family: var(--font-archivo), 'Archivo', sans-serif;
          font-size: 16px;
          font-weight: 600;
          padding: 5px 12px;
          border: 1px solid var(--rule);
          cursor: pointer;
          transition: all 0.2s;
          background: var(--surface);
          color: var(--desc);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .pg-chip:hover {
          border-color: var(--fg);
          color: var(--fg);
        }

        .pg-chip-active {
          background: var(--fg);
          border-color: var(--fg);
          color: var(--bg);
        }

        /* ============================================================= */
        /* Theme Toggle                                                  */
        /* ============================================================= */

        .pg-theme-toggle {
          position: fixed;
          top: 16px;
          right: 16px;
          background: var(--surface);
          border: 2px solid var(--fg);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--fg);
          transition: background 0.2s, color 0.2s;
          z-index: 80;
        }

        .pg-theme-toggle:hover {
          background: var(--fg);
          color: var(--bg);
        }
      `}</style>

      <div className="pg-body" data-theme={theme}>
        {/* Theme Toggle */}
        <button className="pg-theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? (
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
        <div
          className={`pg-main${mounted ? ' pg-visible' : ''}`}
          style={{ maxWidth: 760, margin: '0 auto', padding: '28px 2.5rem 100px', position: 'relative', zIndex: 1 }}
        >
          {/* Header */}
          <h1 className="pg-title" style={{ marginBottom: 2 }}>PASSGEN</h1>
          <p className="pg-sub">secure password generation</p>

          {/* Divider */}
          <div style={{ borderBottom: '4px solid var(--fg)', margin: '16px 0' }} />

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <button onClick={handleGenerate} disabled={validationError !== null}
              className="pg-btn" style={{ flex: 1, padding: '14px 24px' }}>
              GENERATE
            </button>
            <button onClick={() => setShowConfig(true)}
              className="pg-btn" style={{ padding: '14px 20px' }}>
              CONFIG
            </button>
            <button onClick={() => setPasswords([])} disabled={passwords.length === 0}
              className="pg-btn pg-btn-red" style={{ padding: '14px 20px' }}>
              FLUSH
            </button>
          </div>

          {/* Empty State */}
          {passwords.length === 0 && (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--rule)',
              padding: '20px 18px',
              color: 'var(--desc)',
              fontSize: 16,
              lineHeight: 1.8,
              fontFamily: "var(--font-archivo), 'Archivo', sans-serif",
            }}>
              <p style={{ marginBottom: 10 }}>
                <span style={{ color: 'var(--red)', fontWeight: 700 }}>Passgen</span> generates cryptographically
                secure passwords using hardware entropy via the Web Crypto API. All operations
                execute locally in your browser. No data is transmitted.
              </p>
              <p>
                Click <span style={{ color: 'var(--fg)', fontWeight: 700 }}>GENERATE</span> to generate a password.
                Click any output to copy to your clipboard. Adjust parameters via <span style={{ color: 'var(--fg)', fontWeight: 700 }}>CONFIG</span>.
                Use <span style={{ color: 'var(--red)', fontWeight: 700 }}>FLUSH</span> to clear all generated passwords from memory.
              </p>
            </div>
          )}

          {/* Password hint */}
          {passwords.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--gray-mid)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              click to copy
            </div>
          )}

          {/* Password List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                <span style={{
                  fontSize: 12,
                  fontFamily: "var(--font-archivo-black), 'Archivo Black', sans-serif",
                  color: 'var(--red)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  PARAMETERS
                </span>
                <button className="pg-close-btn" onClick={() => setShowConfig(false)}>
                  &#10005;
                </button>
              </div>
              <div style={{ padding: 20 }}>
                {validationError && (
                  <div style={{
                    borderLeft: '3px solid var(--red)',
                    padding: '8px 12px',
                    color: 'var(--red)',
                    fontSize: 13,
                    marginBottom: 14,
                    background: 'var(--bg)',
                    fontFamily: "var(--font-fira-code), 'Fira Code', monospace",
                  }}>
                    {validationError}
                  </div>
                )}

                {/* Length slider */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                    <span className="pg-label" style={{ marginBottom: 0 }}>LENGTH</span>
                    <span style={{
                      fontFamily: "var(--font-archivo-black), 'Archivo Black', sans-serif",
                      fontSize: 26,
                      color: 'var(--fg)',
                    }}>{config.length}</span>
                  </div>
                  <input type="range" min="10" max="64" value={config.length}
                    onChange={(e) => updateConfig({ ...config, length: parseInt(e.target.value) || 10 })}
                  />
                </div>

                {/* Min/max fields */}
                {[
                  { label: 'UPPER', key: 'upper' as const },
                  { label: 'LOWER', key: 'lower' as const },
                  { label: 'DIGITS', key: 'digits' as const },
                  { label: 'SYMBOLS', key: 'symbols' as const },
                ].map(({ label, key }) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <span className="pg-label">{label}</span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: 'var(--gray-mid)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>min</div>
                        <input type="number" min="0" value={config[key][0]}
                          onChange={(e) => updateConfig({ ...config, [key]: [parseInt(e.target.value) || 0, config[key][1]] })}
                          className="pg-input"
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: 'var(--gray-mid)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>max</div>
                        <input type="number" min="0" value={config[key][1] ?? ""} placeholder="null"
                          onChange={(e) => updateConfig({ ...config, [key]: [config[key][0], e.target.value === "" ? null : parseInt(e.target.value)] })}
                          className="pg-input"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{ borderBottom: '1px solid var(--rule)', margin: '10px 0' }} />

                {/* Charset */}
                <div style={{ marginBottom: 16 }}>
                  <span className="pg-label">CHARSET</span>
                  <input type="text" value={config.useSymbols}
                    onChange={(e) => updateConfig({ ...config, useSymbols: e.target.value })}
                    className="pg-input" style={{ marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => updateConfig({ ...config, useSymbols: PASSGEN_SAFESET })}
                      className={`pg-chip ${config.useSymbols === PASSGEN_SAFESET ? 'pg-chip-active' : ''}`}>
                      SafeSet
                    </button>
                    <button onClick={() => updateConfig({ ...config, useSymbols: OWASP_SAFESET })}
                      className={`pg-chip ${config.useSymbols === OWASP_SAFESET ? 'pg-chip-active' : ''}`}>
                      OWASP
                    </button>
                  </div>
                </div>

                <button onClick={() => updateConfig(DEFAULT_CONFIG)}
                  className="pg-btn" style={{ width: '100%', fontSize: 12, padding: '8px', letterSpacing: '0.08em' }}>
                  RESET DEFAULTS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {showCopied && (
          <div className="pg-toast">
            COPIED
          </div>
        )}

        {/* Footer */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          borderTop: '4px solid var(--fg)',
          background: 'var(--surface)',
          zIndex: 1,
        }}>
          <div style={{
            maxWidth: 760,
            margin: '0 auto',
            padding: '10px 2.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: "var(--font-archivo), 'Archivo', sans-serif",
            fontSize: 12,
            color: 'var(--desc)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            <span style={{ display: 'flex', gap: 8 }}>
              <a href="https://www.unit03.net"
                target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--desc)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fg)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '')}>
                NA-PARSE
              </a>
              <span style={{ color: 'var(--rule)' }}>/</span>
              <a href="https://github.com/na-parse/passgen"
                target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--desc)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fg)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '')}>
                PASSGEN-SOURCE
              </a>
            </span>
            <span style={{ color: 'var(--gray-mid)' }}>MIT License</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                onClick={() => setExpandedPolicy(expandedPolicy === "privacy" ? null : "privacy")}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "var(--font-archivo), 'Archivo', sans-serif",
                  fontSize: 12, fontWeight: 600,
                  color: 'var(--desc)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fg)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '')}
              >
                Privacy {expandedPolicy === "privacy" ? "▼" : "▶"}
              </button>
              <button
                onClick={() => setExpandedPolicy(expandedPolicy === "terms" ? null : "terms")}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "var(--font-archivo), 'Archivo', sans-serif",
                  fontSize: 12, fontWeight: 600,
                  color: 'var(--desc)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fg)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '')}
              >
                Terms {expandedPolicy === "terms" ? "▼" : "▶"}
              </button>
              <a
                href="https://github.com/na-parse"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--desc)', transition: 'color 0.2s', display: 'flex' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fg)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '')}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Privacy Policy Expanded */}
          {expandedPolicy === "privacy" && (
            <div style={{
              padding: '14px 2.5rem',
              background: 'var(--bg)',
              borderTop: '1px solid var(--rule)',
              fontFamily: "var(--font-archivo), 'Archivo', sans-serif",
              fontSize: 13,
              color: 'var(--desc)',
              lineHeight: 1.8,
              maxHeight: 200,
              overflowY: 'auto',
            }}>
              <div style={{ fontFamily: "var(--font-archivo-black), 'Archivo Black', sans-serif", color: 'var(--red)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 }}>PRIVACY POLICY</div>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--fg)' }}>Open Source:</strong> This application is open source and publicly available on GitHub under the MIT License. You can review the code, fork it, and modify it as needed.</p>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--fg)' }}>Client-Side Generation:</strong> All passwords are generated entirely in your browser using the Web Cryptography API. No passwords are transmitted to any server, stored remotely, or processed by third parties.</p>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--fg)' }}>Configuration Storage:</strong> Your password generation settings are stored only in your browser&#39;s localStorage. This data remains on your device and is never transmitted to any server.</p>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--fg)' }}>Zero Tracking:</strong> This application contains no analytics, tracking pixels, cookies, or telemetry. We have no mechanism to identify you or track what you do with this tool.</p>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--fg)' }}>External Resources:</strong> This app loads fonts from Google Fonts. Review Google&#39;s privacy policy regarding their font services.</p>
              <p><strong style={{ color: 'var(--fg)' }}>Your Security Responsibility:</strong> Back up generated passwords to your password manager immediately. Clear your browser history/cache if needed. Your security depends on your device and browser security.</p>
            </div>
          )}

          {/* Terms Expanded */}
          {expandedPolicy === "terms" && (
            <div style={{
              padding: '14px 2.5rem',
              background: 'var(--bg)',
              borderTop: '1px solid var(--rule)',
              fontFamily: "var(--font-archivo), 'Archivo', sans-serif",
              fontSize: 13,
              color: 'var(--desc)',
              lineHeight: 1.8,
              maxHeight: 200,
              overflowY: 'auto',
            }}>
              <div style={{ fontFamily: "var(--font-archivo-black), 'Archivo Black', sans-serif", color: 'var(--red)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 }}>TERMS OF SERVICE</div>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--fg)' }}>MIT License:</strong> This software is licensed under the MIT License. View the full license on GitHub. You are free to use, modify, fork, and distribute this code under the MIT terms.</p>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--fg)' }}>As-Is Disclaimer:</strong> This application is provided &#34;as-is&#34; without warranty of any kind, express or implied. We implement industry-standard cryptographic practices, but make no guarantees about password strength, randomness quality, or security.</p>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--fg)' }}>No Liability:</strong> We are not liable for any damages, data loss, security breaches, or access loss resulting from your use of this application. You assume all risk when using this tool.</p>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--fg)' }}>Your Responsibility:</strong> You are responsible for managing and securing generated passwords. Immediately save passwords to your password manager. We have no ability to recover lost passwords.</p>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--fg)' }}>Ethical Use:</strong> Use this tool only for legitimate password generation. Do not use it for unauthorized access, system abuse, or any malicious purpose.</p>
              <p><strong style={{ color: 'var(--fg)' }}>Security Disclosure:</strong> If you discover a security vulnerability, please report it responsibly to the maintainers on GitHub rather than public disclosure.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
