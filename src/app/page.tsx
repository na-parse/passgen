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
      <div className="max-w-2xl w-full mx-auto pt-8">
        <h1 className="text-5xl font-bold mb-6 text-center bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent pb-2">
          na-parse : passgen
        </h1>
        <p className="text-gray-400 text-center text-lg mb-8">
        Personal alternative to built-in password generators.
        Reflects my preferences in a project intended to help me
        get back up to speed on modern webdev.
        </p>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <h2 className="text-orange-400 font-semibold mb-3">
            Current Rules:
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
    </main>
  );
}