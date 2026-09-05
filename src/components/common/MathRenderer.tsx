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
      className={`inline-math ${displayMode ? 'block my-2 text-center overflow-x-auto py-1' : 'inline-block mx-0.5 align-middle'} ${className}`}
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

  // Single variable (e.g. $x$, $y$, $m$, $b$, $t$)
  if (/^[a-zA-Z]$/.test(trimmed)) return true;

  // Coordinate pairs like $(x, y)$, $(h, k)$, $(0, 0)$
  if (/^\([a-zA-Z0-9,\s\-+/]+\)$/.test(trimmed)) return true;

  // Single algebraic term like $2x$, $14y$, $3b$, $-5x$, or decimals $9.5x$, $0.5x$
  if (/^[+-]?\d*(\.\d+)?[a-zA-Z](\^[0-9]+)?$/.test(trimmed)) return true;

  // Pure numbers/decimals like $17$, $0.5$, $-3$
  if (/^[+-]?\d+(\.\d+)?$/.test(trimmed)) return true;

  // Contains math operators: =, +, -, *, /, ^, _, <, >, \le, \ge, ≤, ≥, etc.
  if (/[=+\\^_\/<>≤≥≠±·×]/.test(trimmed)) {
    // Check if it looks like an English sentence between two separate currency signs
    const englishWords = (trimmed.match(/\b(and|or|for|to|spent|charges|equipment|per|hour|cost|bought|the|is|in|of|each|total|dollars)\b/gi) || []).length;
    if (englishWords >= 2) return false;
    return true;
  }

  // Percentage expressions like $20\%$, $15\%$
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
export function formatMathText(text: string): React.ReactNode {
  if (!text) return '';

  // 1. Check for block math $$...$$ or \[...\]
  const blockRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\])/g;
  const blockParts = text.split(blockRegex);

  return blockParts.map((blockPart, bIdx) => {
    if ((blockPart.startsWith('$$') && blockPart.endsWith('$$')) ||
        (blockPart.startsWith('\\[') && blockPart.endsWith('\\]'))) {
      const mathInner = blockPart.startsWith('$$') 
        ? blockPart.slice(2, -2) 
        : blockPart.slice(2, -2);
      return <MathView key={`block-${bIdx}`} math={mathInner} displayMode={true} />;
    }

    // 2. Process paragraphs & lines within non-block text
    const lines = blockPart.split('\n');
    return (
      <React.Fragment key={`b-${bIdx}`}>
        {lines.map((line, lineIdx) => {
          // Check if this entire line is a standalone formula (e.g. system of equations or option)
          if (isStandaloneFormulaLine(line)) {
            return (
              <span key={`line-${lineIdx}`} className="inline-block my-0.5">
                <MathView math={line} displayMode={false} className="text-[1.02em] font-medium text-indigo-950" />
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
              return <MathView key={`math-${lineIdx}-${pIdx}`} math={mathInner} displayMode={false} />;
            }

            // Handle $ ... $
            if (part.startsWith('$') && part.endsWith('$')) {
              const inner = part.slice(1, -1);
              if (isTrueMathContent(inner)) {
                return (
                  <MathView 
                    key={`math-${lineIdx}-${pIdx}`} 
                    math={inner} 
                    displayMode={false} 
                    className="text-indigo-950 font-medium"
                  />
                );
              }
              // It's a dollar amount like "$20.00", keep original text
              return <span key={`txt-${lineIdx}-${pIdx}`}>{part}</span>;
            }

            // Regular text
            return <span key={`txt-${lineIdx}-${pIdx}`}>{part}</span>;
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
