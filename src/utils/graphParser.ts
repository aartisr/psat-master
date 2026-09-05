import { GraphConfig } from '../types';

export interface GraphParserContext {
  rationale?: string;
  options?: { label: string; text: string }[];
  correctAnswer?: string;
  prompt?: string;
}

/**
 * Parses numeric string or fraction (e.g. "3/4", "-7/8", "2.5", "-1", "+") into a number
 */
function parseCoeff(str: string | undefined, defaultVal: number = 1): number {
  if (!str) return defaultVal;
  const clean = str.replace(/\s+/g, '');
  if (clean === '' || clean === '+') return 1;
  if (clean === '-') return -1;
  if (clean.includes('/')) {
    const [num, den] = clean.split('/').map(Number);
    if (!isNaN(num) && !isNaN(den) && den !== 0) return num / den;
  }
  const n = parseFloat(clean);
  return isNaN(n) ? defaultVal : n;
}

/**
 * Modular parser to extract coordinate graph specifications from question text,
 * options, rationale, or visual prompts.
 * Auto-detects linear equations (y = mx + b, y = b + mx, Ax + By = C), inequalities,
 * coordinate points, and systems of equations.
 */
export function extractGraphConfig(text: string, context?: GraphParserContext): GraphConfig | undefined {
  if (!text && !context) return undefined;

  // Aggregate full searchable text corpus
  const fullCorpus = [
    text || '',
    context?.prompt || '',
    context?.rationale || '',
    ...(context?.options?.map((o) => `${o.label}: ${o.text}`) || [])
  ].join('\n');

  const lines: { slope: number; yIntercept: number; points?: [number, number][]; label?: string; style?: 'solid' | 'dashed' }[] = [];
  const points: [number, number][] = [];
  let inequality: { slope: number; yIntercept: number; operator: '>' | '<' | '>=' | '<='; color?: string } | undefined;

  // 1. Explicit Graph Block Parsing (e.g., Graph: line y = 2x + 3)
  const graphBlockMatch = fullCorpus.match(/Graph:\s*([^\n\r]+)/i);
  const targetText = graphBlockMatch ? graphBlockMatch[1] : fullCorpus;

  // 2. Extract Coordinate Points (e.g. (0, -1), (1, -4), $(0, 35)$)
  const pointRegex = /(?:\(|\$|\b)\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*(?:\)|\$|\b)/g;
  let pMatch: RegExpExecArray | null;
  while ((pMatch = pointRegex.exec(targetText)) !== null) {
    const x = parseFloat(pMatch[1]);
    const y = parseFloat(pMatch[2]);
    if (!isNaN(x) && !isNaN(y)) {
      // Avoid duplicate points
      if (!points.some((p) => Math.abs(p[0] - x) < 0.001 && Math.abs(p[1] - y) < 0.001)) {
        points.push([x, y]);
      }
    }
  }

  // 3. Inequality Extraction
  // Look for target inequality from correct option or rationale first if available
  let candidateIneqText = targetText;
  if (context?.correctAnswer && context.options) {
    const correctOpt = context.options.find((o) => o.label.trim().toUpperCase() === context.correctAnswer?.trim().toUpperCase());
    if (correctOpt) {
      candidateIneqText = `${correctOpt.text}\n${context.rationale || ''}\n${targetText}`;
    }
  }

  // 3a. Standard slope-first inequality: y [op] [m]x [+-] [b]
  const ineqSlopeFirstRegex = /y\s*(>=|<=|>|<)\s*(-?\d*(?:\.\d+)?(?:\/\d+)?)\s*x\s*([+-]\s*\d+(?:\.\d+)?)?/i;
  // 3b. Constant-first inequality: y [op] [b] [+-] [m]x (e.g. y > -1 - 3x or y < -1 + 3x)
  const ineqConstFirstRegex = /y\s*(>=|<=|>|<)\s*(-?\d+(?:\.\d+)?)\s*([+-]\s*\d*(?:\.\d+)?(?:\/\d+)?)\s*x/i;

  const ineqMatch1 = candidateIneqText.match(ineqSlopeFirstRegex);
  const ineqMatch2 = candidateIneqText.match(ineqConstFirstRegex);

  if (ineqMatch2) {
    const operator = ineqMatch2[1] as '>' | '<' | '>=' | '<=';
    const yIntercept = parseFloat(ineqMatch2[2]);
    const slope = parseCoeff(ineqMatch2[3]);
    if (!isNaN(slope) && !isNaN(yIntercept)) {
      inequality = { slope, yIntercept, operator, color: '#6366f1' };
    }
  } else if (ineqMatch1) {
    const operator = ineqMatch1[1] as '>' | '<' | '>=' | '<=';
    const slope = parseCoeff(ineqMatch1[2]);
    let yIntercept = 0;
    if (ineqMatch1[3]) {
      yIntercept = parseFloat(ineqMatch1[3].replace(/\s+/g, ''));
    }
    if (!isNaN(slope) && !isNaN(yIntercept)) {
      inequality = { slope, yIntercept, operator, color: '#6366f1' };
    }
  }

  // 4. Linear Equation Detection
  // 4a. Slope-first: y = mx + b
  const lineSlopeFirstRegex = /y\s*=\s*(-?\d*(?:\.\d+)?(?:\/\d+)?)\s*x\s*([+-]\s*\d+(?:\.\d+)?)?/gi;
  let match: RegExpExecArray | null;
  while ((match = lineSlopeFirstRegex.exec(targetText)) !== null) {
    const slope = parseCoeff(match[1]);
    let intercept = 0;
    if (match[2]) {
      intercept = parseFloat(match[2].replace(/\s+/g, ''));
    }
    if (!isNaN(slope) && !isNaN(intercept)) {
      lines.push({
        slope,
        yIntercept: intercept,
        label: `y = ${slope}x ${intercept >= 0 ? '+' : ''}${intercept}`
      });
    }
  }

  // 4b. Constant-first: y = b + mx (e.g. y = 35 - (7/18)x)
  const lineConstFirstRegex = /y\s*=\s*(-?\d+(?:\.\d+)?)\s*([+-]\s*\d*(?:\.\d+)?(?:\/\d+)?)\s*x/gi;
  while ((match = lineConstFirstRegex.exec(targetText)) !== null) {
    const intercept = parseFloat(match[1]);
    const slope = parseCoeff(match[2]);
    if (!isNaN(slope) && !isNaN(intercept)) {
      lines.push({
        slope,
        yIntercept: intercept,
        label: `y = ${intercept} ${slope >= 0 ? '+' : ''}${slope}x`
      });
    }
  }

  // 4c. Standard form: Ax + By = C (e.g. 7x + 18y = 630)
  const stdFormRegex = /(-?\d*(?:\.\d+)?)\s*x\s*([+-]\s*\d*(?:\.\d+)?)\s*y\s*=\s*(-?\d+(?:\.\d+)?)/gi;
  while ((match = stdFormRegex.exec(targetText)) !== null) {
    const A = parseCoeff(match[1]);
    const B = parseCoeff(match[2]);
    const C = parseFloat(match[3]);
    if (B !== 0 && !isNaN(A) && !isNaN(B) && !isNaN(C)) {
      const slope = -A / B;
      const intercept = C / B;
      lines.push({
        slope,
        yIntercept: intercept,
        label: `${A}x + ${B}y = ${C}`
      });
    }
  }

  // 5. Line derived from two points if no explicit equation was parsed but points exist
  if (lines.length === 0 && !inequality && points.length >= 2) {
    const p1 = points[0];
    const p2 = points[1];
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    if (Math.abs(dx) > 0.0001) {
      const slope = dy / dx;
      const intercept = p1[1] - slope * p1[0];
      lines.push({
        slope,
        yIntercept: intercept,
        points: [p1, p2],
        label: `Line through (${p1[0]}, ${p1[1]}) and (${p2[0]}, ${p2[1]})`
      });
    }
  }

  // 6. Check if text explicitly references an actual visual graph/figure in the problem statement
  // We strictly distinguish between abstract math expressions ("the equation y = f(x) has a graph")
  // vs explicit visual problem prompts ("shown in the graph", "shaded region", "the graph represents", "refer to the graph")
  const explicitVisualIndicator =
    /\b(?:shown in the graph|graph shown|shaded region|solutions to which inequality|boundary line|refer to the graph|graph models the|the graph intersects|the graphs of .* intersect|graph of the linear function f contains|points on a line in the xy-plane|passes through \([0-9\.\-]+,\s*[0-9\.\-]+\) and \([0-9\.\-]+,\s*[0-9\.\-]+\)|the graph of the function is shown)\b/i.test(fullCorpus);

  // If there's an inequality, verify it has visual context (e.g. shaded region, boundary)
  if (inequality && !explicitVisualIndicator && !/\b(?:shaded|region|boundary|inequality)\b/i.test(fullCorpus)) {
    return undefined;
  }

  if (!explicitVisualIndicator && !graphBlockMatch) {
    return undefined;
  }

  // 7. Dynamic Range Calculation
  const allX: number[] = points.map((p) => p[0]);
  const allY: number[] = points.map((p) => p[1]);

  if (inequality) {
    allY.push(inequality.yIntercept);
    // Find intercept with x-axis: 0 = m*x + b => x = -b/m
    if (Math.abs(inequality.slope) > 0.0001) {
      allX.push(-inequality.yIntercept / inequality.slope);
    }
  }

  lines.forEach((l) => {
    allY.push(l.yIntercept);
    if (Math.abs(l.slope) > 0.0001) {
      allX.push(-l.yIntercept / l.slope);
    }
    if (l.points) {
      l.points.forEach((p) => {
        allX.push(p[0]);
        allY.push(p[1]);
      });
    }
  });

  // Calculate clean symmetric or positive range
  let minXVal = -8;
  let maxXVal = 8;
  let minYVal = -8;
  let maxYVal = 8;

  if (allX.length > 0 && allY.length > 0) {
    const rawMinX = Math.min(...allX);
    const rawMaxX = Math.max(...allX);
    const rawMinY = Math.min(...allY);
    const rawMaxY = Math.max(...allY);

    // Heuristically detect if this is a first-quadrant positive graph
    // (e.g. real-world context like temperature, volume, time, rate, count)
    const isFirstQuadrantX = rawMinX >= 0 || (rawMinX >= -2 && rawMaxX > 20);
    const isFirstQuadrantY = rawMinY >= 0 || (rawMinY >= -2 && rawMaxY > 10);

    if (isFirstQuadrantX && isFirstQuadrantY) {
      minXVal = 0;
      minYVal = 0;

      const roundMax = (val: number): number => {
        if (val <= 10) return 10;
        if (val <= 12) return 12;
        if (val <= 15) return 15;
        if (val <= 20) return 20;
        if (val <= 50) return 50;
        if (val <= 100) return 100;
        if (val <= 200) return 200;
        if (val <= 500) return 500;
        if (val <= 800) return 800;
        if (val <= 1000) return 1000;
        
        const scale = Math.pow(10, Math.floor(Math.log10(val)));
        const ratio = val / scale;
        if (ratio <= 1.2) return scale * 1.2;
        if (ratio <= 1.5) return scale * 1.5;
        if (ratio <= 2.0) return scale * 2.0;
        if (ratio <= 5.0) return scale * 5.0;
        return scale * 10;
      };

      maxXVal = roundMax(rawMaxX);
      maxYVal = roundMax(rawMaxY);
    } else {
      // Standard four-quadrant graph. If the ratio or span of scales is large,
      // decouple X and Y to prevent lines or points from rendering as flat.
      const isAsymmetric = Math.max(Math.abs(rawMinX), Math.abs(rawMaxX)) > 15 || Math.max(Math.abs(rawMinY), Math.abs(rawMaxY)) > 15;

      if (isAsymmetric) {
        const roundSpan = (minVal: number, maxVal: number): number => {
          const maxAbs = Math.max(Math.abs(minVal), Math.abs(maxVal), 6);
          if (maxAbs <= 10) return 10;
          if (maxAbs <= 20) return 20;
          if (maxAbs <= 50) return 50;
          if (maxAbs <= 100) return 100;
          if (maxAbs <= 500) return 500;
          if (maxAbs <= 1000) return 1000;
          const scale = Math.pow(10, Math.floor(Math.log10(maxAbs)) - 1);
          return Math.ceil((maxAbs * 1.2) / scale) * scale;
        };

        const spanX = roundSpan(rawMinX, rawMaxX);
        const spanY = roundSpan(rawMinY, rawMaxY);

        minXVal = -spanX;
        maxXVal = spanX;
        minYVal = -spanY;
        maxYVal = spanY;
      } else {
        const maxSpan = Math.max(Math.abs(rawMinX), Math.abs(rawMaxX), Math.abs(rawMinY), Math.abs(rawMaxY), 6);
        const roundedSpan = Math.max(8, Math.ceil((maxSpan + 2) / 2) * 2);
        minXVal = -roundedSpan;
        maxXVal = roundedSpan;
        minYVal = -roundedSpan;
        maxYVal = roundedSpan;
      }
    }
  }

  // Populate points on lines for consumers that require points array
  lines.forEach((l) => {
    if (!l.points || l.points.length < 2) {
      l.points = [
        [minXVal, l.slope * minXVal + l.yIntercept],
        [maxXVal, l.slope * maxXVal + l.yIntercept]
      ];
    }
  });

  const spanX = maxXVal - minXVal;
  const spanY = maxYVal - minYVal;
  const xStep = Math.max(1, Math.round(spanX / 8));
  const yStep = Math.max(1, Math.round(spanY / 8));

  // Deduplicate lines with same slope and yIntercept, and omit if identical to inequality boundary
  const uniqueLines: typeof lines = [];
  for (const l of lines) {
    if (inequality && Math.abs(l.slope - inequality.slope) < 0.001 && Math.abs(l.yIntercept - inequality.yIntercept) < 0.001) {
      continue;
    }
    if (!uniqueLines.some((u) => Math.abs(u.slope - l.slope) < 0.001 && Math.abs(u.yIntercept - l.yIntercept) < 0.001)) {
      uniqueLines.push(l);
    }
  }

  return {
    type: inequality ? 'inequality' : uniqueLines.length > 1 ? 'system' : points.length > 0 && uniqueLines.length === 0 ? 'points' : 'line',
    xRange: [minXVal, maxXVal],
    yRange: [minYVal, maxYVal],
    xStep,
    yStep,
    lines: uniqueLines.length > 0 ? uniqueLines : undefined,
    inequality,
    points: points.length > 0 ? points : undefined
  };
}

