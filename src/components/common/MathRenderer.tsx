import React from 'react';
import katex from 'katex';

interface MathViewProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * Normalizes unicode math characters and common shorthand into standard LaTeX
 */
export function normalizeLatex(raw: string): string {
  if (!raw) return '';

  return raw
    .trim()
    .replace(/\\le(?![a-zA-Z])/g, '\\le ')
    .replace(/\\ge(?![a-zA-Z])/g, '\\ge ')
    .replace(/\\ne(?![a-zA-Z])/g, '\\neq ')
    .replace(/≤/g, '\\le ')
    .replace(/≥/g, '\\ge ')
    .replace(/≠/g, '\\neq ')
    .replace(/±/g, '\\pm ')
    .replace(/·/g, '\\cdot ')
    .replace(/×/g, '\\times ')
    .replace(/π/g, '\\pi ')
    .replace(/θ/g, '\\theta ')
    .replace(/⁴⁄₃/g, '\\frac{4}{3}')
    .replace(/⅓/g, '\\frac{1}{3}')
    .replace(/½/g, '\\frac{1}{2}')
    .replace(/²(?![0-9])/g, '^2')
    .replace(/³(?![0-9])/g, '^3')
    .replace(/√\(([^)]+)\)/g, '\\sqrt{$1}')
    .replace(/√([a-zA-Z0-9]+)/g, '\\sqrt{$1}')
    // Convert common simple fraction formats like -(1/9)x or (1/2)x or (27/4)x or -92/3
    .replace(/-\s*\((\d+)\/(\d+)\)/g, '-\\frac{$1}{$2}')
    .replace(/\((\d+)\/(\d+)\)/g, '\\frac{$1}{$2}')
    // Convert (expression)/(expression) or (expression)/number
    .replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, '\\frac{$1}{$2}')
    .replace(/\(([^()]+)\)\s*\/\s*(\d+)/g, '\\frac{$1}{$2}')
    .replace(/([a-zA-Z0-9_]+)\s*\/\s*(\d+)(?=[^a-zA-Z0-9]|$)/g, '\\frac{$1}{$2}');
}

/**
 * Safely renders LaTeX into an HTML string using KaTeX
 */
export function renderLatexToString(tex: string, displayMode = false): string {
  try {
    const clean = normalizeLatex(tex);
    return katex.renderToString(clean, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
      trust: false,
    });
  } catch {
    return tex;
  }
}

/**
 * Standalone KaTeX React component
 */
export const MathView: React.FC<MathViewProps> = React.memo(({ math, displayMode = false, className = '' }) => {
  const html = React.useMemo(() => renderLatexToString(math, displayMode), [math, displayMode]);

  return (
    <span
      className={`inline-math max-w-full ${displayMode ? 'block my-2 text-center overflow-x-auto py-1' : 'inline-block mx-0.5 align-middle max-w-full overflow-x-auto overflow-y-hidden'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

MathView.displayName = 'MathView';

/**
 * Determines whether text between dollar signs is actual LaTeX math or currency
 */
function isTrueMathContent(inner: string): boolean {
  const trimmed = inner.trim();
  if (!trimmed) return false;

  // Has LaTeX escape sequences like \frac, \sqrt, \le, \Delta, \times
  if (/\\\w+/.test(trimmed)) return true;

  // Variable names or multi-letter variables (e.g. $x$, $y$, $xy$, $xz$, $yz$, $ab$, $m$, $b$, $t$)
  if (/^[a-zA-Z]+$/.test(trimmed)) return true;

  // Coordinate pairs like $(x, y)$, $(h, k)$, $(0, 0)$, $(3, 2)$
  if (/^\([a-zA-Z0-9,\s\-+/.]+\)$/.test(trimmed)) return true;

  // Algebraic terms or functions like $2x$, $14y$, $3xy$, $f(x)$, $g(x)$, $P(A)$, $x_1$, $y_2$, $a^2$
  if (/^[+-]?\d*(\.\d+)?[a-zA-Z0-9_()^.+*-]+$/.test(trimmed)) {
    // Exclude currency like $20.00 if it's pure numbers without letters/operators
    if (/^[+-]?\d+(\.\d+)?$/.test(trimmed)) return true;
    return true;
  }

  // Pure numbers/decimals like $17$, $0.5$, $-3$
  if (/^[+-]?\d+(\.\d+)?$/.test(trimmed)) return true;

  // Contains math operators: =, +, -, *, /, ^, _, <, >, \le, \ge, ≤, ≥, etc.
  if (/[=+\\^_\/<>≤≥≠±·×()]/.test(trimmed)) {
    // Check if it looks like an English sentence between two separate currency signs
    const englishWords = (trimmed.match(/\b(and|or|for|to|spent|charges|equipment|per|hour|cost|bought|the|is|in|of|each|total|dollars)\b/gi) || []).length;
    if (englishWords >= 2) return false;
    return true;
  }

  // Percentage expressions like $20\%$, $15\%$, $20%$
  if (/^\d+(\.\d+)?\\?%$/.test(trimmed)) return true;

  return false;
}

/**
 * Checks if a standalone line is purely a mathematical equation or formula
 * (e.g., "y = -(1/9)x", "11x + 14y ≤ 115", "-92/3", "5 ≤ x ≤ 6")
 */
function isStandaloneFormulaLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 1 || trimmed.length > 100) return false;

  // Exclude common English question sentences
  if (/\b(what|which|find|where|when|how|if|the|for|each|then|given|table|graph|represents|system|solution|values|between|pairs|approximately|fluid|ounces|context|models|number|participants|different|programs|years|since|intersect|line|intercept|could|amount|spend|purchase|museum|charges|additional|person|tour|group|relationship|fundraiser|snack|bags|event|before|tax|box|chips|crackers|bought|members|club|increased|measure|degrees|triangle|angle)\b/i.test(trimmed)) {
    return false;
  }

  // Pure fractions like -92/3 or 7/2 or (n + 92)/-3
  if (/^-?\d+\/\d+$/.test(trimmed)) return true;
  if (/^\(?[-+a-zA-Z0-9\s]+\)?\/-?\d+$/.test(trimmed)) return true;

  // Must contain relational or arithmetic equality/inequality
  const hasRelation = /[=≤≥<>≠]/.test(trimmed);
  if (!hasRelation) return false;

  // Check that it's composed mostly of math characters, numbers, variables, and parentheses
  const mathCharsOnly = trimmed.replace(/[\s0-9a-zA-Z+\-*/()=≤≥<>≠.,_^\\%[\]]/g, '');
  return mathCharsOnly.length === 0;
}

/**
 * Formats a block of text containing embedded LaTeX ($...$ or $$...$$)
 * or standalone formulas into rich KaTeX-rendered React elements.
 */
/**
 * Pre-processes text to distinguish standalone currency dollar signs (e.g. $115, $21, $14, \$525, $1,000)
 * from LaTeX math delimiters ($...$), preventing offset errors and broken math rendering.
 */
function protectCurrencyDollarSigns(text: string): string {
  if (!text) return '';

  const ESCAPED_DOLLAR = '\uE000';

  // 1. Convert explicit escaped dollar signs (\$) and preserve block math ($$)
  let processed = text.replace(/\\\$|\$\$/g, (match) => {
    if (match === '$$') return '$$';
    return ESCAPED_DOLLAR;
  });

  // 2. Identify unescaped currency dollar signs (e.g. $115, $ 21, -$0.05, $-0.05, $1,000.50, $20)
  // A dollar sign followed by optional minus sign and numbers, NOT followed by math operators/variables or closing $
  processed = processed.replace(/\$\s*-?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|\d+(?:\.\d+)?)(?!\d|\w|\s*[,=+\-*/^_<>≤≥≠±\\%:\(\)]|\$)/g, `${ESCAPED_DOLLAR}$1`);

  return processed;
}

/**
 * Auto-detects un-delimited ASCII math expressions (like x^2, x^2 - 1x - 5x + 5, (x - 1)(x - 5), a^2)
 * in plain text segments that lack $...$ delimiters, auto-wrapping them in $...$ for KaTeX math rendering.
 */
function autoWrapAsciiMath(text: string): string {
  if (!text) return '';

  // Split by existing math blocks ($...$, $$...$$, \[...\], \(...\)) so we only modify non-math text
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g);

  return parts.map((part, idx) => {
    // Odd indices are existing math blocks, leave untouched
    if (idx % 2 !== 0) return part;

    let converted = part;

    // 1. Convert polynomial/caret expressions like x^2, x^2 - 1x - 5x + 5, y = x^2 + 3, a^2 + b^2
    converted = converted.replace(/\b([a-zA-Z0-9_\(\)]+(?:\s*[\+\-\*\/=]\s*[a-zA-Z0-9_\(\)]+)*\s*\^\s*[0-9a-zA-Z]+(?:\s*[\+\-\*\/=]\s*[a-zA-Z0-9_\(\)\^]+)*)\b/g, (match) => {
      if (match.includes('http') || match.includes('www')) return match;
      return `$${match.trim()}$`;
    });

    // 2. Convert factored products like (x - 1)(x - 5) or (2x + 3)(x - 7)
    converted = converted.replace(/(?<![\$a-zA-Z0-9])(\([a-zA-Z0-9_\s\+\-\*\/]+\)\s*\([a-zA-Z0-9_\s\+\-\*\/]+\))(?![\$a-zA-Z0-9])/g, (match) => {
      return `$${match.trim()}$`;
    });

    return converted;
  }).join('');
}

const FORMAT_MATH_CACHE = new Map<string, React.ReactNode>();

/**
 * Formats a block of text containing embedded LaTeX ($...$ or $$...$$)
 * or standalone formulas into rich KaTeX-rendered React elements.
 */
export function formatMathText(text: string): React.ReactNode {
  if (!text) return '';

  if (FORMAT_MATH_CACHE.has(text)) {
    return FORMAT_MATH_CACHE.get(text)!;
  }

  // 1. Preserve escaped dollar signs & currency dollar signs
  let sanitizedText = protectCurrencyDollarSigns(text);

  // 2. Auto-wrap un-delimited ASCII math terms (x^2, x^2 - 1x - 5x + 5, (x - 1)(x - 5))
  sanitizedText = autoWrapAsciiMath(sanitizedText);

  // 3. Check for block math $$...$$ or \[...\]
  const blockRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\])/g;
  const blockParts = sanitizedText.split(blockRegex);

  const result = blockParts.map((blockPart, bIdx) => {
    if ((blockPart.startsWith('$$') && blockPart.endsWith('$$')) ||
        (blockPart.startsWith('\\[') && blockPart.endsWith('\\]'))) {
      const mathInner = blockPart.startsWith('$$') 
        ? blockPart.slice(2, -2) 
        : blockPart.slice(2, -2);
      return <MathView key={`block-${bIdx}`} math={mathInner.replace(/\uE000/g, '\\$')} displayMode={true} />;
    }

    // 2. Process paragraphs & lines within non-block text
    const lines = blockPart.split('\n');
    return (
      <React.Fragment key={`b-${bIdx}`}>
        {lines.map((line, lineIdx) => {
          const displayLine = line.replace(/\uE000/g, '$');
          // Check if this entire line is a standalone formula (e.g. system of equations or option)
          if (isStandaloneFormulaLine(displayLine)) {
            return (
              <span key={`line-${lineIdx}`} className="inline-block my-0.5">
                <MathView math={displayLine} displayMode={false} className="text-[1.02em] font-medium text-indigo-950" />
              </span>
            );
          }

          // Parse inline math ($...$ or \(...\))
          const inlineRegex = /(\$[^$\n]+?\$|\\\([\s\S]+?\\\))/g;
          const inlineParts = line.split(inlineRegex);

          const lineContent = inlineParts.map((part, pIdx) => {
            // Handle \( ... \)
            if (part.startsWith('\\(') && part.endsWith('\\)')) {
              const mathInner = part.slice(2, -2);
              return <MathView key={`math-${lineIdx}-${pIdx}`} math={mathInner.replace(/\uE000/g, '\\$')} displayMode={false} />;
            }

            // Handle $ ... $
            if (part.startsWith('$') && part.endsWith('$')) {
              const inner = part.slice(1, -1);
              if (isTrueMathContent(inner)) {
                return (
                  <MathView 
                    key={`math-${lineIdx}-${pIdx}`} 
                    math={inner.replace(/\uE000/g, '\\$')} 
                    displayMode={false} 
                    className="text-indigo-950 font-medium"
                  />
                );
              }
              // It's a dollar amount or non-math, restore original text with $
              return <span key={`txt-${lineIdx}-${pIdx}`}>{part.replace(/\uE000/g, '$')}</span>;
            }

            // Regular text: restore escaped/currency dollar sign as literal $
            return <span key={`txt-${lineIdx}-${pIdx}`}>{part.replace(/\uE000/g, '$')}</span>;
          });

          return (
            <React.Fragment key={`l-${lineIdx}`}>
              {lineContent}
              {lineIdx < lines.length - 1 && <br />}
            </React.Fragment>
          );
        })}
      </React.Fragment>
    );
  });

  FORMAT_MATH_CACHE.set(text, result);
  if (FORMAT_MATH_CACHE.size > 1000) {
    const firstKey = FORMAT_MATH_CACHE.keys().next().value;
    if (firstKey) FORMAT_MATH_CACHE.delete(firstKey);
  }

  return result;
}

/**
 * MathText Component for declarative rendering in JSX
 */
export const MathText: React.FC<{ text: string; className?: string }> = React.memo(({ text, className = '' }) => {
  return (
    <span className={className}>
      {formatMathText(text)}
    </span>
  );
});

MathText.displayName = 'MathText';
