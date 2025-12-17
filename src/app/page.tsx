"use client";

import { useState, useEffect } from "react";
import { generatePassword, PasswordConfig } from "@/lib/passwordGenerator";

const DEFAULT_CONFIG: PasswordConfig = {
  length: 40,
  upper: [8, null],
  lower: [8, null],
  digits: [6, null],
  symbols: [6, 10],
  useSymbols: "!@#$%&_.,{}[]/",
};

function validateConfig(config: PasswordConfig): string | null {
  if (config.length < 10) return "Length must be at least 10";

  const mins = [
    config.upper[0],
    config.lower[0],
    config.digits[0],
    config.symbols[0],
  ];

  if (mins.some((m) => m < 0)) return "Minimum values cannot be negative";

  const totalMin = mins.reduce((sum, m) => sum + m, 0);
  if (totalMin > config.length) {
    return `Minimum required characters (${totalMin}) exceed password length (${config.length}). Reduce character requirements or increase length.`;
  }

  const checks = [
    { name: "uppercase", tuple: config.upper },
    { name: "lowercase", tuple: config.lower },
    { name: "digits", tuple: config.digits },
    { name: "symbols", tuple: config.symbols },
  ];

  for (const check of checks) {
    if (check.tuple[1] !== null && check.tuple[1] < check.tuple[0]) {
      return `${check.name} max must be >= min`;
    }
  }

  if (!config.useSymbols || config.useSymbols.length === 0) {
    return "Symbol charset cannot be empty";
  }

  return null;
}

export default function Home() {
  const [config, setConfigState] = useState<PasswordConfig>(DEFAULT_CONFIG);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [showCopied, setShowCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("passgen-config");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PasswordConfig;
        setConfigState(parsed);
      } catch {
        setConfigState(DEFAULT_CONFIG);
      }
    }
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };

    const handleBackdropClick = (e: MouseEvent) => {
      const drawer = document.getElementById("config-drawer");
      if (drawer && !drawer.contains(e.target as Node)) {
        setIsDrawerOpen(false);
      }
    };

    if (isDrawerOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleBackdropClick);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleBackdropClick);
      document.body.style.overflow = "unset";
    };
  }, [isDrawerOpen]);

  const updateConfig = (newConfig: PasswordConfig) => {
    setConfigState(newConfig);
    const error = validateConfig(newConfig);
    setValidationError(error);
    localStorage.setItem("passgen-config", JSON.stringify(newConfig));
  };

  const handleReset = () => {
    updateConfig(DEFAULT_CONFIG);
  };

  const handleGenerate = () => {
    if (validationError) return;
    const newPassword = generatePassword(config);
    setPasswords([newPassword, ...passwords]);
  };

  const handleCopy = async (password: string) => {
    await navigator.clipboard.writeText(password);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-[rgb(33,33,49)] p-8">
      <div className="max-w-2xl w-full mx-auto pt-8 pb-16">
        <h1 className="text-5xl font-bold mb-6 text-center bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent pb-2">
          na-parse / passgen
        </h1>
        <p className="text-gray-400 text-center text-lg mb-8">
        Simple secure web-app password generator
        </p>
        <div
          onClick={() => setIsDrawerOpen(true)}
          className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6 cursor-pointer hover:border-orange-500 transition-colors group"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-orange-400 font-semibold text-sm">
              Current Ruleset
            </h2>
            <svg
              className="w-5 h-5 text-gray-500 group-hover:text-orange-400 transition-colors"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l1.72-1.34c.15-.12.19-.34.1-.51l-1.63-2.83c-.12-.22-.38-.28-.59-.13l-2.03 1.59c-.42-.32-.9-.6-1.44-.78l-.3-2.34c-.04-.24-.24-.41-.48-.41h-3.26c-.24 0-.43.17-.47.41l-.3 2.34c-.54.18-1.02.46-1.44.78l-2.03-1.59c-.21-.15-.47-.09-.59.13L2.74 8.87c-.1.16-.06.39.1.51l1.72 1.34c-.05.3-.07.62-.07.94s.02.64.07.94l-1.72 1.34c-.15.12-.19.34-.1.51l1.63 2.83c.12.22.38.28.59.13l2.03-1.59c.42.32.9.6 1.44.78l.3 2.34c.05.24.24.41.48.41h3.26c.24 0 .44-.17.47-.41l.3-2.34c.54-.18 1.02-.46 1.44-.78l2.03 1.59c.21.15.47.09.59-.13l1.63-2.83c.1-.16.06-.39-.1-.51l-1.72-1.34zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
          </div>
          <ul className="space-y-2 text-gray-300 text-sm text-center">
            <li>
              <span className="text-green-400 mr-2">✓</span>
              Length: {config.length}
            </li>
            <li>
              <span className="text-green-400 mr-2">✓</span>
              Uppercase: min {config.upper[0]}
              {config.upper[1] !== null && `, max ${config.upper[1]}`}
            </li>
            <li>
              <span className="text-green-400 mr-2">✓</span>
              Lowercase: min {config.lower[0]}
              {config.lower[1] !== null && `, max ${config.lower[1]}`}
            </li>
            <li>
              <span className="text-green-400 mr-2">✓</span>
              Digits: min {config.digits[0]}
              {config.digits[1] !== null && `, max ${config.digits[1]}`}
            </li>
            <li>
              <span className="text-green-400 mr-2">✓</span>
              Symbols: min {config.symbols[0]}
              {config.symbols[1] !== null && `, max ${config.symbols[1]}`}
            </li>
          </ul>
        </div>
        <div className="flex justify-center mb-8">
          <button
            onClick={handleGenerate}
            disabled={validationError !== null}
            className={`font-semibold px-8 py-4 rounded-lg shadow-lg transition-all text-lg ${
              validationError
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-gray-900 hover:shadow-xl"
            }`}
          >
            Generate Password
          </button>
        </div>
        {showCopied && (
          <div className="fixed top-8 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
            Copied to clipboard!
          </div>
        )}
        <div className="space-y-3">
          {passwords.map((pwd, idx) => (
            <div
              key={idx}
              onClick={() => handleCopy(pwd)}
              className="p-5 bg-gray-800 border border-gray-700 rounded-lg font-mono text-lg text-orange-300 shadow-md cursor-pointer hover:bg-gray-750 hover:border-orange-500 transition-all overflow-x-auto whitespace-nowrap"
            >
              {pwd}
            </div>
          ))}
        </div>
      </div>

      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" id="drawer-backdrop" />
      )}

      <div
        id="config-drawer"
        className={`fixed left-0 top-0 h-screen w-80 bg-gray-800 border-r border-gray-700 shadow-2xl overflow-y-auto transition-transform duration-300 z-50 ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-orange-400 font-semibold text-lg">
              Configuration
            </h2>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="text-gray-400 hover:text-gray-300 text-2xl leading-none"
            >
              ✕
            </button>
          </div>

          {validationError && (
            <div className="bg-red-900 border border-red-600 rounded px-3 py-2 text-red-300 text-sm">
              {validationError}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-orange-400 font-semibold text-sm">
                Password Length
              </label>
              <div className="flex items-center gap-2">
                <span className="text-orange-400 font-bold text-lg">
                  {config.length}
                </span>
                <span className="text-gray-500 text-xs">/ 64</span>
              </div>
            </div>
            <input
              type="range"
              min="10"
              max="64"
              value={config.length}
              onChange={(e) =>
                updateConfig({
                  ...config,
                  length: parseInt(e.target.value) || 10,
                })
              }
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          <div>
            <label className="text-orange-400 font-semibold text-sm block mb-2">
              Uppercase Letters
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={config.upper[0]}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      upper: [parseInt(e.target.value) || 0, config.upper[1]],
                    })
                  }
                  className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-gray-300 w-full focus:border-orange-500 focus:outline-none text-sm"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={config.upper[1] ?? ""}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      upper: [
                        config.upper[0],
                        e.target.value === "" ? null : parseInt(e.target.value),
                      ],
                    })
                  }
                  className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-gray-300 w-full focus:border-orange-500 focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-orange-400 font-semibold text-sm block mb-2">
              Lowercase Letters
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={config.lower[0]}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      lower: [parseInt(e.target.value) || 0, config.lower[1]],
                    })
                  }
                  className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-gray-300 w-full focus:border-orange-500 focus:outline-none text-sm"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={config.lower[1] ?? ""}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      lower: [
                        config.lower[0],
                        e.target.value === "" ? null : parseInt(e.target.value),
                      ],
                    })
                  }
                  className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-gray-300 w-full focus:border-orange-500 focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-orange-400 font-semibold text-sm block mb-2">
              Digits
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={config.digits[0]}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      digits: [parseInt(e.target.value) || 0, config.digits[1]],
                    })
                  }
                  className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-gray-300 w-full focus:border-orange-500 focus:outline-none text-sm"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={config.digits[1] ?? ""}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      digits: [
                        config.digits[0],
                        e.target.value === "" ? null : parseInt(e.target.value),
                      ],
                    })
                  }
                  className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-gray-300 w-full focus:border-orange-500 focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-orange-400 font-semibold text-sm block mb-2">
              Symbols
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={config.symbols[0]}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      symbols: [parseInt(e.target.value) || 0, config.symbols[1]],
                    })
                  }
                  className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-gray-300 w-full focus:border-orange-500 focus:outline-none text-sm"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={config.symbols[1] ?? ""}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      symbols: [
                        config.symbols[0],
                        e.target.value === "" ? null : parseInt(e.target.value),
                      ],
                    })
                  }
                  className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-gray-300 w-full focus:border-orange-500 focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-orange-400 font-semibold text-sm block mb-2">
              Symbol Charset
            </label>
            <input
              type="text"
              value={config.useSymbols}
              onChange={(e) =>
                updateConfig({
                  ...config,
                  useSymbols: e.target.value,
                })
              }
              className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-gray-300 w-full focus:border-orange-500 focus:outline-none font-mono text-sm"
            />
          </div>

          <button
            onClick={() => setIsDrawerOpen(false)}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-gray-900 px-4 py-3 rounded transition-all text-sm font-semibold mt-6"
          >
            Accept
          </button>
          <button
            onClick={handleReset}
            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded transition-all text-sm font-semibold mt-3"
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-sm text-gray-400">
          <span><a href="https://github.com/na-parse/passgen"
            >Simple secure password generator</a>
          </span>
          <div className="flex items-center gap-2">
            <span>unit03:na-parse</span>
            <a
              href="https://github.com/na-parse"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-400 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>      
    </main>
  );
}