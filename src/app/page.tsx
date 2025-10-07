"use client";

import { useState } from "react";
import { generatePassword, PasswordConfig } from "@/lib/passwordGenerator";

export default function Home() {
  const [passwords, setPasswords] = useState<string[]>([]);
  const [showCopied, setShowCopied] = useState(false);

  const config: PasswordConfig = {
    length: 36,
    upper: [8, null],
    lower: [8, null],
    digits: [6, null],
    symbols: [6, 10],
    useSymbols: "!@#$%&_.,{}[]/",
  };

  const handleGenerate = () => {
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
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <h2 className="text-orange-400 font-semibold mb-3">
            Current Ruleset:
          </h2>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Length: {config.length} characters
            </li>
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Uppercase: min {config.upper[0]}
              {config.upper[1] !== null && `, max ${config.upper[1]}`}
            </li>
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Lowercase: min {config.lower[0]}
              {config.lower[1] !== null && `, max ${config.lower[1]}`}
            </li>
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Digits: min {config.digits[0]}
              {config.digits[1] !== null && `, max ${config.digits[1]}`}
            </li>
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Symbols: min {config.symbols[0]}
              {config.symbols[1] !== null && `, max ${config.symbols[1]}`} (
              {config.useSymbols})
            </li>
          </ul>
        </div>
        <div className="flex justify-center mb-8">
          <button
            onClick={handleGenerate}
            className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-gray-900 font-semibold px-8 py-4 rounded-lg shadow-lg transition-all hover:shadow-xl text-lg"
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
              className="p-5 bg-gray-800 border border-gray-700 rounded-lg font-mono text-lg text-orange-300 shadow-md cursor-pointer hover:bg-gray-750 hover:border-orange-500 transition-all"
            >
              {pwd}
            </div>
          ))}
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