import React, { useState, useEffect } from 'react';
import { useVault } from '../../context/VaultContext';
import { X, RefreshCw, Copy, Check } from 'lucide-react';

export default function PasswordGeneratorModal({ isOpen, onClose, onUsePassword }) {
  const { addToast } = useVault();
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    let chars = '';
    if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useNumbers) chars += '0123456789';
    if (useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) {
      setGeneratedPassword('');
      return;
    }

    const randomArray = new Uint32Array(length);
    window.crypto.getRandomValues(randomArray);

    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars[randomArray[i] % chars.length];
    }

    setGeneratedPassword(password);
    setCopied(false);
  };

  useEffect(() => {
    if (isOpen) {
      generatePassword();
    }
  }, [isOpen, length, useUpper, useLower, useNumbers, useSymbols]);

  if (!isOpen) return null;

  const getStrength = () => {
    let score = 0;
    if (length >= 12) score += 2;
    else if (length >= 8) score += 1;
    if (useUpper && useLower) score += 1;
    if (useNumbers) score += 1;
    if (useSymbols) score += 1;

    if (score <= 2) return { label: 'Weak', color: 'bg-rose-100 text-rose-700 border-rose-200' };
    if (score === 3) return { label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    if (score === 4) return { label: 'Strong', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    return { label: 'Very Strong', color: 'bg-emerald-600 text-white border-emerald-600' };
  };

  const handleCopy = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    addToast('Password copied to clipboard.', 'success');

    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  const strength = getStrength();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Password Generator 🔑</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display Box */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-mono text-sm sm:text-base text-emerald-600 dark:text-emerald-400 tracking-wider break-all select-all font-bold">
              {generatedPassword || 'Select options to generate'}
            </div>
            <button
              onClick={generatePassword}
              className="p-2 text-slate-400 hover:text-emerald-600 transition"
              title="Regenerate"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80 pt-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Strength:</span>
            <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${strength.color}`}>
              {strength.label}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold mb-1">
              <span>Password Length:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{length} characters</span>
            </div>
            <input
              type="range"
              min="8"
              max="64"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={useUpper}
                onChange={(e) => setUseUpper(e.target.checked)}
                className="accent-emerald-600 rounded w-4 h-4"
              />
              <span>Uppercase (A-Z)</span>
            </label>

            <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={useLower}
                onChange={(e) => setUseLower(e.target.checked)}
                className="accent-emerald-600 rounded w-4 h-4"
              />
              <span>Lowercase (a-z)</span>
            </label>

            <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={useNumbers}
                onChange={(e) => setUseNumbers(e.target.checked)}
                className="accent-emerald-600 rounded w-4 h-4"
              />
              <span>Numbers (0-9)</span>
            </label>

            <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={useSymbols}
                onChange={(e) => setUseSymbols(e.target.checked)}
                className="accent-emerald-600 rounded w-4 h-4"
              />
              <span>Symbols (!@#$)</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition border border-slate-200 dark:border-slate-700"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Password'}</span>
          </button>

          {onUsePassword && (
            <button
              onClick={() => {
                onUsePassword(generatedPassword);
                onClose();
              }}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition shadow-md shadow-emerald-600/20"
            >
              <span>Use This Password</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
