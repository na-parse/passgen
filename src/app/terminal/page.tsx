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

function timestamp(): string {
  const d = new Date();
  return d.toTimeString().split(" ")[0];
}

export default function CRTv2Design() {
  const [config, setConfigState] = useState<PasswordConfig>(DEFAULT_CONFIG);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [showCopied, setShowCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [expandedPolicy, setExpandedPolicy] = useState<"privacy" | "terms" | null>(null);
  const [cursorOn, setCursorOn] = useState(true);
  const [termLines, setTermLines] = useState<Array<{ text: string; type: 'system' | 'cmd' | 'ok' | 'err' | 'data' | 'header' }>>([
    { text: "╔══════════════════════════════════════════════════════════╗", type: "header" },
    { text: "║  PASSGEN v0.3.2 — Secure Password Generation             ║", type: "header" },
    { text: "║  Cryptographic Credential Interface                      ║", type: "header" },
    { text: "║  na-parse // MIT License                                 ║", type: "header" },
    { text: "╚══════════════════════════════════════════════════════════╝", type: "header" },
    { text: "", type: "system" },
    { text: `[${timestamp()}] SYS: Neural interface online. Deck ready.`, type: "system" },
    { text: `[${timestamp()}] SYS: Entropy source: crypto.getRandomValues()`, type: "system" },
    { text: `[${timestamp()}] SYS: Shuffle algorithm: Fisher-Yates (unbiased)`, type: "system" },
    { text: `[${timestamp()}] SYS: Awaiting commands, cowboy.`, type: "system" },
    { text: "", type: "system" },
  ]);

  useEffect(() => {
    const stored = localStorage.getItem("passgen-config");
    if (stored) {
      try { setConfigState(JSON.parse(stored) as PasswordConfig); }
      catch { setConfigState(DEFAULT_CONFIG); }
    }
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setCursorOn((v) => !v), 500);
    return () => clearInterval(iv);
  }, []);

  const updateConfig = useCallback((newConfig: PasswordConfig) => {
    setConfigState(newConfig);
    setValidationError(validateConfig(newConfig));
    localStorage.setItem("passgen-config", JSON.stringify(newConfig));
  }, []);

  const addLines = (...lines: Array<{ text: string; type: 'system' | 'cmd' | 'ok' | 'err' | 'data' | 'header' }>) => {
    setTermLines((prev) => [...prev, ...lines]);
  };

  const handleGenerate = () => {
    const ts = timestamp();
    if (validationError) {
      addLines(
        { text: `[${ts}] $ passgen --generate`, type: "cmd" },
        { text: `[${ts}] ${validationError}`, type: "err" },
        { text: "", type: "system" },
      );
      return;
    }
    const pwd = generatePassword(config);
    setPasswords([pwd, ...passwords]);
    addLines(
      { text: `[${ts}] $ passgen --generate \\`, type: "cmd" },
      { text: `         --length=${config.length} \\`, type: "data" },
      { text: `         --upper=${config.upper[0]}${config.upper[1] !== null ? `,${config.upper[1]}` : ''} \\`, type: "data" },
      { text: `         --lower=${config.lower[0]}${config.lower[1] !== null ? `,${config.lower[1]}` : ''} \\`, type: "data" },
      { text: `         --digits=${config.digits[0]}${config.digits[1] !== null ? `,${config.digits[1]}` : ''} \\`, type: "data" },
      { text: `         --symbols=${config.symbols[0]}${config.symbols[1] !== null ? `,${config.symbols[1]}` : ''} \\`, type: "data" },
      { text: `         --charset="${config.useSymbols}"`, type: "data" },
      { text: `[${ts}] OK: Password generated (${pwd.length} chars)`, type: "ok" },
      { text: `[${ts}] >> ${pwd}`, type: "ok" },
      { text: "", type: "system" },
    );
  };

  const handleCopy = async (password: string) => {
    try {
      await copyToClipboard(password);
      setShowCopied(true);
      const ts = timestamp();
      addLines(
        { text: `[${ts}] $ clipboard --write "${password.substring(0, 12)}..."`, type: "cmd" },
        { text: `[${ts}] OK: ${password.length} bytes written to clipboard buffer.`, type: "ok" },
        { text: "", type: "system" },
      );
      setTimeout(() => setShowCopied(false), 2000);
    } catch { /* */ }
  };

  const lineColor = (type: string) => {
    switch (type) {
      case 'cmd': return '#00DDFF';
      case 'ok': return '#00FF88';
      case 'err': return '#FF4444';
      case 'data': return '#00BB99';
      case 'header': return '#FF8800';
      default: return '#668877';
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Orbitron:wght@400;600;700;900&display=swap');

        .crt2-body {
          --crt-bg: #050A08;
          --crt-panel: #081210;
          --crt-border: #0A2A1E;
          --crt-green: #00FF88;
          --crt-green-dim: #00AA55;
          --crt-green-faint: #0A3D2A;
          --crt-cyan: #00DDFF;
          --crt-cyan-dim: #006688;
          --crt-amber: #FF8800;
          --crt-red: #FF4444;
          --crt-teal: #00BB99;

          background: var(--crt-bg);
          min-height: 100vh;
          font-family: 'Fira Code', monospace;
          color: var(--crt-green);
          position: relative;
          overflow-x: hidden;
        }

        /* Deep scanlines */
        .crt2-body::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none;
          z-index: 80;
          background: repeating-linear-gradient(
            0deg,
            rgba(0,0,0,0.12) 0px,
            rgba(0,0,0,0.12) 1px,
            transparent 1px,
            transparent 3px
          );
        }

        /* Vignette + glow */
        .crt2-body::after {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none;
          z-index: 81;
          background:
            radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%),
            radial-gradient(ellipse at 50% 0%, rgba(0,255,136,0.02) 0%, transparent 60%);
        }

        .crt2-title {
          font-family: 'Orbitron', sans-serif;
          font-weight: 900;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          text-align: center;
          text-shadow:
            0 0 10px rgba(0,255,136,0.5),
            0 0 30px rgba(0,255,136,0.2),
            0 0 60px rgba(0,255,136,0.1);
        }

        .crt2-sub {
          font-family: 'Fira Code', monospace;
          font-size: 14px;
          color: var(--crt-green-dim);
          text-align: center;
          text-shadow: 0 0 6px rgba(0,255,136,0.3);
          margin-top: 4px;
        }

        .crt2-glow {
          text-shadow: 0 0 6px rgba(0,255,136,0.4);
        }

        .terminal-window {
          background: var(--crt-panel);
          border: 1px solid var(--crt-border);
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 0 30px rgba(0,255,136,0.03), inset 0 0 30px rgba(0,0,0,0.3);
        }

        .terminal-bar {
          background: var(--crt-border);
          padding: 6px 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--crt-green-dim);
        }

        .terminal-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1px solid;
        }

        .terminal-log {
          padding: 14px 16px;
          max-height: 200px;
          overflow-y: auto;
          font-size: 14px;
          line-height: 1.6;
          white-space: pre;
        }

        .terminal-log::-webkit-scrollbar { width: 6px; }
        .terminal-log::-webkit-scrollbar-track { background: var(--crt-bg); }
        .terminal-log::-webkit-scrollbar-thumb { background: var(--crt-green-faint); border-radius: 3px; }

        .cursor-block {
          display: inline-block;
          width: 9px;
          height: 16px;
          background: var(--crt-green);
          vertical-align: text-bottom;
          margin-left: 2px;
          box-shadow: 0 0 6px rgba(0,255,136,0.5);
        }

        .crt2-btn {
          font-family: 'Orbitron', sans-serif;
          font-weight: 600;
          font-size: 15px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          background: transparent;
          color: var(--crt-green);
          border: 1px solid var(--crt-green-dim);
          padding: 16px 28px;
          cursor: pointer;
          transition: all 0.2s;
          text-shadow: 0 0 6px rgba(0,255,136,0.3);
        }

        .crt2-btn:hover {
          background: rgba(0,255,136,0.1);
          border-color: var(--crt-green);
          box-shadow: 0 0 20px rgba(0,255,136,0.15), inset 0 0 20px rgba(0,255,136,0.05);
        }

        .crt2-btn:disabled {
          color: var(--crt-green-faint);
          border-color: var(--crt-green-faint);
          cursor: not-allowed;
          text-shadow: none;
        }

        .crt2-btn:disabled:hover {
          background: transparent;
          box-shadow: none;
        }

        .crt2-btn-red {
          color: var(--crt-red);
          border-color: rgba(255,68,68,0.4);
          text-shadow: 0 0 6px rgba(255,68,68,0.3);
        }

        .crt2-btn-red:hover {
          background: rgba(255,68,68,0.1);
          border-color: var(--crt-red);
          box-shadow: 0 0 20px rgba(255,68,68,0.15);
        }

        .crt2-btn-red:disabled {
          color: rgba(255,68,68,0.2);
          border-color: rgba(255,68,68,0.15);
          text-shadow: none;
        }

        .crt2-input {
          font-family: 'Fira Code', monospace;
          font-size: 15px;
          background: rgba(0,255,136,0.03);
          border: 1px solid var(--crt-green-faint);
          color: var(--crt-green);
          padding: 10px 14px;
          outline: none;
          width: 100%;
          border-radius: 2px;
          transition: border-color 0.2s;
          text-shadow: 0 0 3px rgba(0,255,136,0.2);
        }

        .crt2-input:focus {
          border-color: var(--crt-green-dim);
          box-shadow: 0 0 10px rgba(0,255,136,0.06);
        }

        .crt2-input::placeholder { color: var(--crt-green-faint); }

        .password-crt2 {
          padding: 16px 18px;
          background: rgba(0,255,136,0.02);
          border: 1px solid var(--crt-green-faint);
          border-radius: 3px;
          cursor: pointer;
          font-family: 'Fira Code', monospace;
          font-size: 15px;
          color: var(--crt-green);
          transition: all 0.2s;
          overflow-x: auto;
          white-space: nowrap;
          text-shadow: 0 0 4px rgba(0,255,136,0.3);
        }

        .password-crt2:hover {
          border-color: var(--crt-green-dim);
          background: rgba(0,255,136,0.05);
          box-shadow: 0 0 12px rgba(0,255,136,0.08);
        }

        .config-crt2 {
          background: var(--crt-panel);
          border: 1px solid var(--crt-border);
          border-radius: 4px;
        }

        .crt2-label {
          font-family: 'Fira Code', monospace;
          font-weight: 500;
          font-size: 13px;
          color: var(--crt-cyan);
          display: block;
          margin-bottom: 6px;
          text-shadow: 0 0 4px rgba(0,221,255,0.2);
        }

        .crt2-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          background: var(--crt-green-faint);
          outline: none;
          border-radius: 2px;
        }

        .crt2-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: var(--crt-green);
          border: none;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0,255,136,0.5);
          border-radius: 2px;
        }

        .crt2-range::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: var(--crt-green);
          border: none;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0,255,136,0.5);
          border-radius: 2px;
        }

        .toast-crt2 {
          position: fixed;
          top: 16px;
          right: 16px;
          background: var(--crt-panel);
          border: 1px solid var(--crt-green-dim);
          color: var(--crt-green);
          padding: 12px 20px;
          font-family: 'Fira Code', monospace;
          font-size: 14px;
          text-shadow: 0 0 6px rgba(0,255,136,0.4);
          box-shadow: 0 0 20px rgba(0,255,136,0.1);
          z-index: 100;
        }

        .config-toggle-crt2 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          cursor: pointer;
          background: var(--crt-panel);
          border: 1px solid var(--crt-border);
          border-radius: 4px;
          transition: border-color 0.2s;
        }

        .config-toggle-crt2:hover {
          border-color: var(--crt-green-faint);
        }

        .crt2-chip {
          font-family: 'Fira Code', monospace;
          font-size: 13px;
          padding: 5px 12px;
          border: 1px solid var(--crt-green-faint);
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: var(--crt-green-dim);
        }

        .crt2-chip:hover { border-color: var(--crt-green-dim); color: var(--crt-green); }

        .crt2-chip-active {
          background: rgba(0,255,136,0.15);
          border-color: var(--crt-green);
          color: var(--crt-green);
        }

        .crt2-status-bar {
          display: flex;
          gap: 16px;
          padding: 6px 12px;
          font-size: 12px;
          color: var(--crt-green-dim);
          border-top: 1px solid var(--crt-border);
          background: rgba(0,0,0,0.3);
        }

        .crt2-status-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin-right: 4px;
          vertical-align: middle;
        }
      `}</style>

      <div className="crt2-body">
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 20px 100px', position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <h1 className="crt2-title" style={{ marginBottom: 2 }}>PASSGEN</h1>
          <p className="crt2-sub">secure password generation terminal</p>

          <div style={{ borderBottom: '1px solid var(--crt-border)', margin: '16px 0' }} />

          {/* Terminal Window */}
          <div className="terminal-window" style={{ marginBottom: 16 }}>
            <div className="terminal-bar">
              <span className="terminal-dot" style={{ borderColor: 'var(--crt-red)', background: 'rgba(255,68,68,0.6)' }} />
              <span className="terminal-dot" style={{ borderColor: 'var(--crt-amber)', background: 'rgba(255,136,0,0.6)' }} />
              <span className="terminal-dot" style={{ borderColor: 'var(--crt-green)', background: 'rgba(0,255,136,0.6)' }} />
              <span style={{ marginLeft: 8 }}>passgen://terminal</span>
            </div>
            <div className="terminal-log">
              {termLines.map((line, i) => (
                <div key={i} style={{ color: lineColor(line.type), minHeight: line.text === '' ? 10 : undefined }}>
                  {line.text}
                </div>
              ))}
              <div style={{ color: 'var(--crt-green-dim)' }}>
                $ <span className="cursor-block" style={{ opacity: cursorOn ? 1 : 0 }} />
              </div>
            </div>
            <div className="crt2-status-bar">
              <span><span className="crt2-status-dot" style={{ background: 'var(--crt-green)' }} />DECK ONLINE</span>
              <span><span className="crt2-status-dot" style={{ background: 'var(--crt-cyan)' }} />ICE: NONE</span>
              <span><span className="crt2-status-dot" style={{ background: 'var(--crt-amber)' }} />ENTROPY: HIGH</span>
              <span style={{ marginLeft: 'auto' }}>PWD_COUNT: {passwords.length}</span>
            </div>
          </div>

          {/* Config Toggle */}
          <div
            className="config-toggle-crt2"
            onClick={() => setShowConfig(!showConfig)}
            style={{ marginBottom: 12 }}
          >
            <div>
              <div style={{ fontSize: 13, color: 'var(--crt-cyan)', marginBottom: 2, textShadow: '0 0 4px rgba(0,221,255,0.2)' }}>
                // PARAMETERS
              </div>
              <div style={{ fontSize: 14, color: 'var(--crt-green-dim)' }}>
                len={config.length} upper={config.upper[0]} lower={config.lower[0]} digits={config.digits[0]} sym={config.symbols[0]}
              </div>
            </div>
            <span style={{
              color: 'var(--crt-green-faint)', fontSize: 18,
              transition: 'transform 0.2s', display: 'inline-block',
              transform: showConfig ? 'rotate(180deg)' : 'none',
            }}>&#9662;</span>
          </div>

          {/* Config Panel */}
          {showConfig && (
            <div className="config-crt2" style={{ padding: 20, marginBottom: 12 }}>
              {validationError && (
                <div style={{
                  borderLeft: '3px solid var(--crt-red)',
                  padding: '8px 12px',
                  color: 'var(--crt-red)',
                  fontSize: 14,
                  marginBottom: 14,
                  background: 'rgba(255,68,68,0.05)',
                  textShadow: '0 0 4px rgba(255,68,68,0.3)',
                }}>
                  {validationError}
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span className="crt2-label" style={{ marginBottom: 0 }}>--length</span>
                  <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 26, fontWeight: 700, color: 'var(--crt-green)', textShadow: '0 0 8px rgba(0,255,136,0.4)' }}>{config.length}</span>
                </div>
                <input type="range" min="10" max="64" value={config.length}
                  onChange={(e) => updateConfig({ ...config, length: parseInt(e.target.value) || 10 })}
                  className="crt2-range"
                />
              </div>

              {[
                { label: '--upper', key: 'upper' as const },
                { label: '--lower', key: 'lower' as const },
                { label: '--digits', key: 'digits' as const },
                { label: '--symbols', key: 'symbols' as const },
              ].map(({ label, key }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <span className="crt2-label">{label}</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--crt-green-faint)', marginBottom: 3 }}>min</div>
                      <input type="number" min="0" value={config[key][0]}
                        onChange={(e) => updateConfig({ ...config, [key]: [parseInt(e.target.value) || 0, config[key][1]] })}
                        className="crt2-input"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--crt-green-faint)', marginBottom: 3 }}>max</div>
                      <input type="number" min="0" value={config[key][1] ?? ""} placeholder="null"
                        onChange={(e) => updateConfig({ ...config, [key]: [config[key][0], e.target.value === "" ? null : parseInt(e.target.value)] })}
                        className="crt2-input"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ borderBottom: '1px solid var(--crt-border)', margin: '10px 0' }} />

              <div style={{ marginBottom: 16 }}>
                <span className="crt2-label">--charset</span>
                <input type="text" value={config.useSymbols}
                  onChange={(e) => updateConfig({ ...config, useSymbols: e.target.value })}
                  className="crt2-input" style={{ marginBottom: 8 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => updateConfig({ ...config, useSymbols: PASSGEN_SAFESET })}
                    className={`crt2-chip ${config.useSymbols === PASSGEN_SAFESET ? 'crt2-chip-active' : ''}`}>
                    SafeSet
                  </button>
                  <button onClick={() => updateConfig({ ...config, useSymbols: OWASP_SAFESET })}
                    className={`crt2-chip ${config.useSymbols === OWASP_SAFESET ? 'crt2-chip-active' : ''}`}>
                    OWASP
                  </button>
                </div>
              </div>

              <button onClick={() => {
                updateConfig(DEFAULT_CONFIG);
                addLines({ text: `[${timestamp()}] SYS: Parameters reset to factory defaults.`, type: "system" });
              }}
                className="crt2-btn" style={{ width: '100%', fontSize: 12, padding: '8px', letterSpacing: '0.08em' }}>
                RESET DEFAULTS
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <button onClick={handleGenerate} disabled={validationError !== null}
              className="crt2-btn" style={{ flex: 1, padding: '16px 24px' }}>
              EXEC.passgen()
            </button>
            <button onClick={() => {
              setPasswords([]);
              addLines(
                { text: `[${timestamp()}] $ flush --history`, type: "cmd" },
                { text: `[${timestamp()}] OK: Password history flushed.`, type: "ok" },
                { text: "", type: "system" },
              );
            }} disabled={passwords.length === 0}
              className="crt2-btn crt2-btn-red" style={{ padding: '16px 20px' }}>
              FLUSH
            </button>
          </div>

          {/* Empty State */}
          {passwords.length === 0 && (
            <div style={{
              background: 'var(--crt-panel)',
              border: '1px solid var(--crt-border)',
              borderRadius: 4,
              padding: '20px 18px',
              color: 'var(--crt-green-dim)',
              fontSize: 15,
              lineHeight: 1.8,
            }}>
              <p style={{ marginBottom: 10 }}>
                <span style={{ color: 'var(--crt-cyan)' }}>Passgen</span> generates cryptographically
                secure passwords using hardware entropy via the Web Crypto API. All operations
                execute locally in your browser. No data is transmitted.
              </p>
              <p>
                Click <span style={{ color: 'var(--crt-green)' }}>EXEC.passgen()</span> to generate a password.
                Click any output to copy to your clipboard. Configure parameters in the settings panel.
                The terminal logs every operation for your review.
              </p>
            </div>
          )}

          {/* Passwords */}
          {passwords.length > 0 && (
            <div style={{ fontSize: 13, color: 'var(--crt-green-faint)', marginBottom: 8 }}>
              // click to copy to clipboard buffer
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {passwords.map((pwd, idx) => (
              <div key={idx} onClick={() => handleCopy(pwd)} className="password-crt2" title="Click to copy">
                {pwd}
              </div>
            ))}
          </div>
        </div>

        {/* Toast */}
        {showCopied && (
          <div className="toast-crt2">
            CLIPBOARD &lt;&lt; OK
          </div>
        )}

        {/* Footer */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          borderTop: '1px solid var(--crt-green-faint)',
          background: '#0B1A14',
          zIndex: 1,
        }}>
          <div style={{
            maxWidth: 760,
            margin: '0 auto',
            padding: '10px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: "'Fira Code', monospace",
            fontSize: 13,
            color: 'var(--crt-green)',
            fontWeight: 500,
          }}>
            <span>
              <a href="https://github.com/na-parse/passgen"
                target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--crt-green)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--crt-cyan)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--crt-green)')}>
                na-parse / passgen
              </a>
            </span>
            <span style={{ color: 'var(--crt-green-dim)' }}>MIT License</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                onClick={() => setExpandedPolicy(expandedPolicy === "privacy" ? null : "privacy")}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'Fira Code', monospace", fontSize: 13, fontWeight: 500,
                  color: 'var(--crt-green)',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--crt-cyan)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--crt-green)')}
              >
                Privacy {expandedPolicy === "privacy" ? "▼" : "▶"}
              </button>
              <button
                onClick={() => setExpandedPolicy(expandedPolicy === "terms" ? null : "terms")}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'Fira Code', monospace", fontSize: 13, fontWeight: 500,
                  color: 'var(--crt-green)',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--crt-cyan)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--crt-green)')}
              >
                Terms {expandedPolicy === "terms" ? "▼" : "▶"}
              </button>
              <a
                href="https://github.com/na-parse"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--crt-green)', transition: 'color 0.2s', display: 'flex' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--crt-cyan)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--crt-green)')}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>

          {expandedPolicy === "privacy" && (
            <div style={{
              padding: '14px 20px',
              background: 'var(--crt-panel)',
              borderTop: '1px solid var(--crt-green-faint)',
              fontFamily: "'Fira Code', monospace",
              fontSize: 13,
              color: 'var(--crt-green-dim)',
              lineHeight: 1.8,
              maxHeight: 200,
              overflowY: 'auto',
            }}>
              <div style={{ color: 'var(--crt-cyan)', fontWeight: 600, marginBottom: 8 }}>// PRIVACY POLICY</div>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--crt-green)' }}>Open Source:</strong> This application is open source and publicly available on GitHub under the MIT License. You can review the code, fork it, and modify it as needed.</p>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--crt-green)' }}>Client-Side Generation:</strong> All passwords are generated entirely in your browser using the Web Cryptography API. No passwords are transmitted to any server, stored remotely, or processed by third parties.</p>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--crt-green)' }}>Configuration Storage:</strong> Your password generation settings are stored only in your browser&#39;s localStorage. This data remains on your device and is never transmitted to any server.</p>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--crt-green)' }}>Zero Tracking:</strong> This application contains no analytics, tracking pixels, cookies, or telemetry. We have no mechanism to identify you or track what you do with this tool.</p>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--crt-green)' }}>External Resources:</strong> This app loads fonts from Google Fonts. Review Google&#39;s privacy policy regarding their font services.</p>
              <p><strong style={{ color: 'var(--crt-green)' }}>Your Security Responsibility:</strong> Back up generated passwords to your password manager immediately. Clear your browser history/cache if needed. Your security depends on your device and browser security.</p>
            </div>
          )}

          {expandedPolicy === "terms" && (
            <div style={{
              padding: '14px 20px',
              background: 'var(--crt-panel)',
              borderTop: '1px solid var(--crt-green-faint)',
              fontFamily: "'Fira Code', monospace",
              fontSize: 13,
              color: 'var(--crt-green-dim)',
              lineHeight: 1.8,
              maxHeight: 200,
              overflowY: 'auto',
            }}>
              <div style={{ color: 'var(--crt-cyan)', fontWeight: 600, marginBottom: 8 }}>// TERMS OF SERVICE</div>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--crt-green)' }}>MIT License:</strong> This software is licensed under the MIT License. View the full license on GitHub. You are free to use, modify, fork, and distribute this code under the MIT terms.</p>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--crt-green)' }}>As-Is Disclaimer:</strong> This application is provided &#34;as-is&#34; without warranty of any kind, express or implied. We implement industry-standard cryptographic practices, but make no guarantees about password strength, randomness quality, or security.</p>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--crt-green)' }}>No Liability:</strong> We are not liable for any damages, data loss, security breaches, or access loss resulting from your use of this application. You assume all risk when using this tool.</p>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--crt-green)' }}>Your Responsibility:</strong> You are responsible for managing and securing generated passwords. Immediately save passwords to your password manager. We have no ability to recover lost passwords.</p>
              <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--crt-green)' }}>Ethical Use:</strong> Use this tool only for legitimate password generation. Do not use it for unauthorized access, system abuse, or any malicious purpose.</p>
              <p><strong style={{ color: 'var(--crt-green)' }}>Security Disclosure:</strong> If you discover a security vulnerability, please report it responsibly to the maintainers on GitHub rather than public disclosure.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
