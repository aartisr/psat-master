import React, { useState } from 'react';
import { X, Delete, Minimize2, Maximize2, Calculator as CalcIcon, Sparkles } from 'lucide-react';

interface ScientificCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState<string>('0');
  const [equation, setEquation] = useState<string>('');
  const [isScientific, setIsScientific] = useState<boolean>(true);
  const [isDegree, setIsDegree] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleNum = (n: string) => {
    setDisplay((prev) => (prev === '0' || prev === 'Error' ? n : prev + n));
  };

  const handleOp = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleBackspace = () => {
    setDisplay((prev) => (prev.length <= 1 || prev === 'Error' ? '0' : prev.slice(0, -1)));
  };

  const handleEqual = () => {
    try {
      const fullExpr = equation + display;
      // Sanitize expression
      const sanitized = fullExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/\^/g, '**');

      // eslint-disable-next-line no-eval
      const result = Function(`'use strict'; return (${sanitized})`)();
      if (typeof result === 'number' && !isNaN(result)) {
        // Format nicely to max 8 decimal places
        const formatted = Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(6)).toString();
        setDisplay(formatted);
        setEquation('');
      } else {
        setDisplay('Error');
      }
    } catch (e) {
      setDisplay('Error');
    }
  };

  const handleFunc = (fn: string) => {
    try {
      const val = parseFloat(display);
      if (isNaN(val)) return;

      let res = 0;
      const angleMultiplier = isDegree ? Math.PI / 180 : 1;

      switch (fn) {
        case 'sin':
          res = Math.sin(val * angleMultiplier);
          break;
        case 'cos':
          res = Math.cos(val * angleMultiplier);
          break;
        case 'tan':
          res = Math.tan(val * angleMultiplier);
          break;
        case 'sqrt':
          res = Math.sqrt(val);
          break;
        case 'sq':
          res = Math.pow(val, 2);
          break;
        case 'cube':
          res = Math.pow(val, 3);
          break;
        case 'log':
          res = Math.log10(val);
          break;
        case 'ln':
          res = Math.log(val);
          break;
        case 'inv':
          res = 1 / val;
          break;
        case 'abs':
          res = Math.abs(val);
          break;
        case 'neg':
          res = -val;
          break;
        default:
          break;
      }

      setDisplay(parseFloat(res.toFixed(6)).toString());
    } catch (e) {
      setDisplay('Error');
    }
  };

  return (
    <div className="fixed bottom-3 right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6 z-50 w-auto sm:w-96 max-w-[calc(100vw-1.5rem)] bg-slate-900 text-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/90 overflow-hidden animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/80">
        <div className="flex items-center gap-2">
          <CalcIcon className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-200">PSAT Scientific Calculator</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScientific(!isScientific)}
            className="text-[10px] px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold transition-colors"
          >
            {isScientific ? 'Basic' : 'Sci'}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Screen */}
      <div className="p-4 bg-slate-950/90 text-right space-y-1">
        <div className="text-xs font-mono text-slate-400 min-h-[16px] truncate">
          {equation || '\u00A0'}
        </div>
        <div className="text-2xl sm:text-3xl font-mono font-extrabold text-white tracking-wider truncate">
          {display}
        </div>
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setIsDegree(!isDegree)}
            className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50"
          >
            {isDegree ? 'DEG' : 'RAD'}
          </button>
          <span className="text-[10px] text-slate-500 font-sans">PSAT/SAT Digital Approved</span>
        </div>
      </div>

      {/* Buttons Grid */}
      <div className="p-3 bg-slate-900 space-y-2">
        {/* Scientific Row if active */}
        {isScientific && (
          <div className="grid grid-cols-5 gap-1.5 text-xs font-semibold">
            <button onClick={() => handleFunc('sin')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300">sin</button>
            <button onClick={() => handleFunc('cos')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300">cos</button>
            <button onClick={() => handleFunc('tan')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300">tan</button>
            <button onClick={() => handleFunc('sqrt')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300">√x</button>
            <button onClick={() => handleFunc('sq')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300">x²</button>

            <button onClick={() => handleFunc('log')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">log</button>
            <button onClick={() => handleFunc('ln')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">ln</button>
            <button onClick={() => handleNum('3.14159265')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">π</button>
            <button onClick={() => handleOp('^')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">xʸ</button>
            <button onClick={() => handleFunc('inv')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">1/x</button>
          </div>
        )}

        {/* Standard Keypad */}
        <div className="grid grid-cols-4 gap-1.5 text-sm font-bold">
          <button onClick={handleClear} className="p-2.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50">C</button>
          <button onClick={handleBackspace} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center">
            <Delete className="w-4 h-4" />
          </button>
          <button onClick={() => handleFunc('neg')} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">±</button>
          <button onClick={() => handleOp('÷')} className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white">÷</button>

          <button onClick={() => handleNum('7')} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">7</button>
          <button onClick={() => handleNum('8')} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">8</button>
          <button onClick={() => handleNum('9')} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">9</button>
          <button onClick={() => handleOp('×')} className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white">×</button>

          <button onClick={() => handleNum('4')} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">4</button>
          <button onClick={() => handleNum('5')} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">5</button>
          <button onClick={() => handleNum('6')} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">6</button>
          <button onClick={() => handleOp('-')} className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white">−</button>

          <button onClick={() => handleNum('1')} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">1</button>
          <button onClick={() => handleNum('2')} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">2</button>
          <button onClick={() => handleNum('3')} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">3</button>
          <button onClick={() => handleOp('+')} className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white">+</button>

          <button onClick={() => handleNum('0')} className="col-span-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">0</button>
          <button onClick={() => handleNum('.')} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white">.</button>
          <button onClick={handleEqual} className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black">=</button>
        </div>
      </div>
    </div>
  );
};
