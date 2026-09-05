import React, { useId } from 'react';
import { GraphConfig } from '../types';

interface CoordinateGraphProps {
  config: GraphConfig;
  className?: string;
}

/**
 * Clips a polygon by a linear half-plane: A*x + B*y + C >= 0 using the Sutherland-Hodgman algorithm.
 * Guarantees a strictly convex, non-self-intersecting polygon trimmed to the bounding box.
 */
function clipPolygonByHalfPlane(
  polygon: [number, number][],
  A: number,
  B: number,
  C: number
): [number, number][] {
  const evalPt = (p: [number, number]) => A * p[0] + B * p[1] + C;
  const isInside = (p: [number, number]) => evalPt(p) >= -1e-8;

  const output: [number, number][] = [];
  for (let i = 0; i < polygon.length; i++) {
    const cur = polygon[i];
    const prev = polygon[(i + polygon.length - 1) % polygon.length];
    const curIn = isInside(cur);
    const prevIn = isInside(prev);

    if (curIn) {
      if (!prevIn) {
        const vPrev = evalPt(prev);
        const vCur = evalPt(cur);
        const t = vPrev / (vPrev - vCur);
        output.push([
          prev[0] + t * (cur[0] - prev[0]),
          prev[1] + t * (cur[1] - prev[1])
        ]);
      }
      output.push(cur);
    } else if (prevIn) {
      const vPrev = evalPt(prev);
      const vCur = evalPt(cur);
      const t = vPrev / (vPrev - vCur);
      output.push([
        prev[0] + t * (cur[0] - prev[0]),
        prev[1] + t * (cur[1] - prev[1])
      ]);
    }
  }
  return output;
}

/**
 * Calculates the exact two intersection points of a line A*x + B*y + C = 0 with a bounding box [minX, maxX] x [minY, maxY].
 */
function getLineEndpointsInBox(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  A: number,
  B: number,
  C: number
): [number, number][] {
  const pts: [number, number][] = [];
  const eps = 1e-7;

  // Intersect with left: x = minX
  if (Math.abs(B) > eps) {
    const y = -(A * minX + C) / B;
    if (y >= minY - eps && y <= maxY + eps) pts.push([minX, y]);
  }
  // Intersect with right: x = maxX
  if (Math.abs(B) > eps) {
    const y = -(A * maxX + C) / B;
    if (y >= minY - eps && y <= maxY + eps) pts.push([maxX, y]);
  }
  // Intersect with bottom: y = minY
  if (Math.abs(A) > eps) {
    const x = -(B * minY + C) / A;
    if (x >= minX - eps && x <= maxX + eps) pts.push([x, minY]);
  }
  // Intersect with top: y = maxY
  if (Math.abs(A) > eps) {
    const x = -(B * maxY + C) / A;
    if (x >= minX - eps && x <= maxX + eps) pts.push([x, maxY]);
  }

  // Deduplicate points that are nearly identical (e.g. at corners)
  const unique: [number, number][] = [];
  for (const p of pts) {
    if (!unique.some((u) => Math.hypot(u[0] - p[0], u[1] - p[1]) < 1e-4)) {
      unique.push(p);
    }
  }
  return unique;
}

export const CoordinateGraph: React.FC<CoordinateGraphProps> = ({ config, className = '' }) => {
  const rawId = useId();
  const graphId = `graph-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const [minX, maxX] = config.xRange || [-8, 8];
  const [minY, maxY] = config.yRange || [-8, 8];
  const xSpan = maxX - minX;
  const ySpan = maxY - minY;

  // For symmetric Cartesian coordinate systems, maintain true 1:1 square geometry
  const isSquareAspect = Math.abs(xSpan - ySpan) < 0.001;
  const width = 380;
  const height = isSquareAspect ? 380 : 340;
  const padding = 42;

  const xStep = config.xStep || Math.max(1, Math.round(xSpan / 8));
  const yStep = config.yStep || Math.max(1, Math.round(ySpan / 8));

  const plotWidth = width - 2 * padding;
  const plotHeight = height - 2 * padding;

  // Coordinate mapping functions
  const scaleX = (x: number) => padding + ((x - minX) / (maxX - minX)) * plotWidth;
  const scaleY = (y: number) => height - padding - ((y - minY) / (maxY - minY)) * plotHeight;

  const originX = scaleX(0);
  const originY = scaleY(0);

  // Generate grid lines
  const verticalGrid: number[] = [];
  for (let x = minX; x <= maxX; x += xStep) {
    verticalGrid.push(x);
  }

  const horizontalGrid: number[] = [];
  for (let y = minY; y <= maxY; y += yStep) {
    horizontalGrid.push(y);
  }

  // Bounding box in Cartesian coordinates: BL, BR, TR, TL
  const box: [number, number][] = [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY]
  ];

  // 1. Calculate shaded inequality polygon using Sutherland-Hodgman clipping
  let inequalityPolygonString = '';
  let inequalityBoundaryEndpoints: [number, number][] = [];

  if (config.inequality) {
    const { slope, yIntercept, operator } = config.inequality;
    // For y >= slope*x + yIntercept: -slope*x + y - yIntercept >= 0
    // For y <= slope*x + yIntercept: slope*x - y + yIntercept >= 0
    let A: number;
    let B: number;
    let C: number;

    if (operator === '>' || operator === '>=') {
      A = -slope;
      B = 1;
      C = -yIntercept;
    } else {
      A = slope;
      B = -1;
      C = yIntercept;
    }

    const clippedVertices = clipPolygonByHalfPlane(box, A, B, C);
    if (clippedVertices.length >= 3) {
      inequalityPolygonString = clippedVertices
        .map((p) => `${scaleX(p[0]).toFixed(2)},${scaleY(p[1]).toFixed(2)}`)
        .join(' ');
    }

    // Boundary line: -slope*x + y - yIntercept = 0
    inequalityBoundaryEndpoints = getLineEndpointsInBox(minX, maxX, minY, maxY, -slope, 1, -yIntercept);
  }

  // 2. Prepare custom lines
  const resolvedLines = (config.lines || []).map((line) => {
    let endpoints: [number, number][] = [];
    if (line.slope !== undefined && line.yIntercept !== undefined) {
      endpoints = getLineEndpointsInBox(minX, maxX, minY, maxY, -line.slope, 1, -line.yIntercept);
    } else if (line.points && line.points.length === 2) {
      const p1 = line.points[0];
      const p2 = line.points[1];
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      if (Math.abs(dx) < 1e-7) {
        // Vertical line
        endpoints = getLineEndpointsInBox(minX, maxX, minY, maxY, 1, 0, -p1[0]);
      } else {
        const slope = dy / dx;
        const intercept = p1[1] - slope * p1[0];
        endpoints = getLineEndpointsInBox(minX, maxX, minY, maxY, -slope, 1, -intercept);
      }
    }
    return {
      ...line,
      endpoints,
      isPolyline: line.points && line.points.length > 2
    };
  });

  // Visibility checks
  const isXAxisVisible = originY >= padding - 4 && originY <= height - padding + 4;
  const isYAxisVisible = originX >= padding - 4 && originX <= width - padding + 4;

  return (
    <div className={`flex flex-col items-center bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs select-none max-w-full overflow-hidden ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[360px] sm:max-w-[380px] h-auto font-sans block"
        style={{ display: 'block' }}
      >
        <defs>
          {/* Plot Area Clip Path */}
          <clipPath id={`${graphId}-plot-clip`}>
            <rect x={padding} y={padding} width={plotWidth} height={plotHeight} rx="1" />
          </clipPath>

          {/* Line Arrowhead Marker (End) */}
          <marker
            id={`${graphId}-arrow-end`}
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M 1 1 L 7 4 L 1 7 Z" fill="#0f172a" />
          </marker>

          {/* Line Arrowhead Marker (Start) */}
          <marker
            id={`${graphId}-arrow-start`}
            markerWidth="8"
            markerHeight="8"
            refX="2"
            refY="4"
            orient="auto"
          >
            <path d="M 7 1 L 1 4 L 7 7 Z" fill="#0f172a" />
          </marker>

          {/* Indigo Arrowhead for inequality lines */}
          <marker
            id={`${graphId}-arrow-ineq-end`}
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M 1 1 L 7 4 L 1 7 Z" fill="#4338ca" />
          </marker>
          <marker
            id={`${graphId}-arrow-ineq-start`}
            markerWidth="8"
            markerHeight="8"
            refX="2"
            refY="4"
            orient="auto"
          >
            <path d="M 7 1 L 1 4 L 7 7 Z" fill="#4338ca" />
          </marker>
        </defs>

        {/* Background Canvas */}
        <rect
          x={padding}
          y={padding}
          width={plotWidth}
          height={plotHeight}
          fill="#fafbfc"
          stroke="#cbd5e1"
          strokeWidth="1.2"
        />

        {/* Clipped Elements */}
        <g clipPath={`url(#${graphId}-plot-clip)`}>
          {/* Shaded Inequality Region */}
          {inequalityPolygonString && (
            <polygon
              points={inequalityPolygonString}
              fill={config.inequality?.color ? `${config.inequality.color}38` : 'rgba(99, 102, 241, 0.24)'}
              stroke="none"
            />
          )}

          {/* Vertical Grid Lines */}
          {verticalGrid.map((x) => {
            const px = scaleX(x);
            return (
              <line
                key={`vg-${x}`}
                x1={px}
                y1={padding}
                x2={px}
                y2={height - padding}
                stroke="#e2e8f0"
                strokeWidth={x === 0 ? 0 : 0.8}
                strokeDasharray={x === 0 ? undefined : '3,3'}
              />
            );
          })}

          {/* Horizontal Grid Lines */}
          {horizontalGrid.map((y) => {
            const py = scaleY(y);
            return (
              <line
                key={`hg-${y}`}
                x1={padding}
                y1={py}
                x2={width - padding}
                y2={py}
                stroke="#e2e8f0"
                strokeWidth={y === 0 ? 0 : 0.8}
                strokeDasharray={y === 0 ? undefined : '3,3'}
              />
            );
          })}

          {/* Custom Lines */}
          {resolvedLines.map((line, idx) => {
            if (line.isPolyline && line.points) {
              const polyPoints = line.points.map((p) => `${scaleX(p[0])},${scaleY(p[1])}`).join(' ');
              return (
                <polyline
                  key={`line-poly-${idx}`}
                  points={polyPoints}
                  fill="none"
                  stroke={line.color || '#0f172a'}
                  strokeWidth="2.2"
                  strokeDasharray={line.style === 'dashed' ? '5,4' : undefined}
                />
              );
            }

            if (line.endpoints.length >= 2) {
              const [p1, p2] = line.endpoints;
              return (
                <line
                  key={`custom-line-${idx}`}
                  x1={scaleX(p1[0])}
                  y1={scaleY(p1[1])}
                  x2={scaleX(p2[0])}
                  y2={scaleY(p2[1])}
                  stroke={line.color || '#0f172a'}
                  strokeWidth="2.4"
                  strokeDasharray={line.style === 'dashed' ? '5,4' : undefined}
                  markerStart={`url(#${graphId}-arrow-start)`}
                  markerEnd={`url(#${graphId}-arrow-end)`}
                />
              );
            }
            return null;
          })}

          {/* Inequality Boundary Line */}
          {config.inequality && inequalityBoundaryEndpoints.length >= 2 && (
            <line
              x1={scaleX(inequalityBoundaryEndpoints[0][0])}
              y1={scaleY(inequalityBoundaryEndpoints[0][1])}
              x2={scaleX(inequalityBoundaryEndpoints[1][0])}
              y2={scaleY(inequalityBoundaryEndpoints[1][1])}
              stroke="#4338ca"
              strokeWidth="2.5"
              strokeDasharray={config.inequality.operator.includes('=') ? undefined : '6,4'}
              markerStart={`url(#${graphId}-arrow-ineq-start)`}
              markerEnd={`url(#${graphId}-arrow-ineq-end)`}
            />
          )}

          {/* Plotted Coordinate Points */}
          {config.points?.map(([px, py], i) => (
            <circle
              key={`pt-dot-${i}`}
              cx={scaleX(px)}
              cy={scaleY(py)}
              r="4.5"
              fill="#4338ca"
              stroke="#ffffff"
              strokeWidth="2"
            />
          ))}
        </g>

        {/* Main Axes (Thick lines with College Board arrows and ticks) */}
        {isXAxisVisible && (
          <g>
            <line
              x1={padding - 6}
              y1={originY}
              x2={width - padding + 10}
              y2={originY}
              stroke="#1e293b"
              strokeWidth="1.8"
            />
            {/* Arrow at positive X */}
            <polygon
              points={`${width - padding + 12},${originY} ${width - padding + 5},${originY - 4} ${width - padding + 5},${originY + 4}`}
              fill="#1e293b"
            />
            {/* Arrow at negative X if origin is in the middle */}
            {originX > padding + 15 && (
              <polygon
                points={`${padding - 8},${originY} ${padding - 1},${originY - 4} ${padding - 1},${originY + 4}`}
                fill="#1e293b"
              />
            )}
            <text
              x={width - padding + 17}
              y={originY + 4}
              fontSize="12.5"
              fontWeight="700"
              fill="#0f172a"
              fontStyle="italic"
            >
              x
            </text>

            {/* X-axis tick marks */}
            {verticalGrid.map((x) => {
              if (x === 0) return null;
              const px = scaleX(x);
              return (
                <line
                  key={`xtick-${x}`}
                  x1={px}
                  y1={originY - 3.5}
                  x2={px}
                  y2={originY + 3.5}
                  stroke="#1e293b"
                  strokeWidth="1.4"
                />
              );
            })}
          </g>
        )}

        {isYAxisVisible && (
          <g>
            <line
              x1={originX}
              y1={height - padding + 6}
              x2={originX}
              y2={padding - 10}
              stroke="#1e293b"
              strokeWidth="1.8"
            />
            {/* Arrow at positive Y */}
            <polygon
              points={`${originX},${padding - 12} ${originX - 4},${padding - 5} ${originX + 4},${padding - 5}`}
              fill="#1e293b"
            />
            {/* Arrow at negative Y if origin is in the middle */}
            {originY < height - padding - 15 && (
              <polygon
                points={`${originX},${height - padding + 8} ${originX - 4},${height - padding + 1} ${originX + 4},${height - padding + 1}`}
                fill="#1e293b"
              />
            )}
            <text
              x={originX - 3}
              y={padding - 16}
              fontSize="12.5"
              fontWeight="700"
              fill="#0f172a"
              fontStyle="italic"
            >
              y
            </text>

            {/* Y-axis tick marks */}
            {horizontalGrid.map((y) => {
              if (y === 0) return null;
              const py = scaleY(y);
              return (
                <line
                  key={`ytick-${y}`}
                  x1={originX - 3.5}
                  y1={py}
                  x2={originX + 3.5}
                  y2={py}
                  stroke="#1e293b"
                  strokeWidth="1.4"
                />
              );
            })}
          </g>
        )}

        {/* Axis Numbers (X-axis) */}
        {verticalGrid.map((x) => {
          if (x === 0) return null;
          const px = scaleX(x);
          const py = isXAxisVisible
            ? Math.min(Math.max(originY + 14, padding + 14), height - padding + 14)
            : height - padding + 14;

          return (
            <text
              key={`x-lbl-${x}`}
              x={px}
              y={py}
              fontSize="9.5"
              fill="#64748b"
              textAnchor="middle"
              className="font-mono font-medium"
            >
              {x}
            </text>
          );
        })}

        {/* Axis Numbers (Y-axis) */}
        {horizontalGrid.map((y) => {
          if (y === 0) return null;
          const py = scaleY(y);
          const px = isYAxisVisible
            ? Math.max(originX - 7, padding - 7)
            : padding - 7;

          return (
            <text
              key={`y-lbl-${y}`}
              x={px}
              y={py + 3.5}
              fontSize="9.5"
              fill="#64748b"
              textAnchor="end"
              className="font-mono font-medium"
            >
              {y}
            </text>
          );
        })}

        {/* Origin Label O */}
        {isXAxisVisible && isYAxisVisible && (
          <text
            x={originX - 7}
            y={originY + 13}
            fontSize="10"
            fill="#64748b"
            fontStyle="italic"
            fontWeight="bold"
            textAnchor="end"
          >
            O
          </text>
        )}

        {/* Line Labels */}
        {resolvedLines.map((line, idx) => {
          if (!line.label) return null;
          let refPoint: [number, number] | undefined;
          if (line.endpoints.length >= 2) {
            refPoint = line.endpoints[line.endpoints.length - 1];
          } else if (line.points && line.points.length > 0) {
            refPoint = line.points[line.points.length - 1];
          }
          if (!refPoint) return null;

          const px = Math.min(Math.max(scaleX(refPoint[0]), padding + 24), width - padding - 30);
          const py = Math.min(Math.max(scaleY(refPoint[1]) - 8, padding + 16), height - padding - 8);

          return (
            <g key={`line-lbl-${idx}`}>
              <rect
                x={px - 3}
                y={py - 11}
                width={line.label.length * 6.5 + 8}
                height="15"
                fill="rgba(255, 255, 255, 0.92)"
                stroke="#cbd5e1"
                strokeWidth="0.8"
                rx="3"
              />
              <text
                x={px + 2}
                y={py}
                fontSize="10"
                fontWeight="700"
                fill={line.color || '#0f172a'}
              >
                {line.label}
              </text>
            </g>
          );
        })}

        {/* Point Badges (with high-contrast white rounded pill backgrounds) */}
        {config.points?.map(([px, py], i) => {
          const cx = scaleX(px);
          const cy = scaleY(py);
          const isRight = cx < width - padding - 45;
          const isBottom = cy < padding + 25;
          const badgeX = isRight ? cx + 6 : cx - 46;
          const badgeY = isBottom ? cy + 4 : cy - 18;
          const labelText = `(${px}, ${py})`;

          return (
            <g key={`pt-lbl-${i}`}>
              <rect
                x={badgeX}
                y={badgeY}
                width={labelText.length * 6.2 + 8}
                height="15"
                fill="rgba(255, 255, 255, 0.94)"
                stroke="#cbd5e1"
                strokeWidth="0.8"
                rx="3"
              />
              <text
                x={badgeX + 4}
                y={badgeY + 11}
                fontSize="9.5"
                fontWeight="700"
                fill="#1e1b4b"
                className="font-mono"
              >
                {labelText}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Axis title labels below/beside graph if provided */}
      {config.xLabel && (
        <span className="text-xs font-semibold text-slate-700 mt-2 text-center">
          {config.xLabel}
        </span>
      )}
      {config.yLabel && (
        <span className="text-[11px] font-medium text-slate-500 text-center">
          y-axis: {config.yLabel}
        </span>
      )}
    </div>
  );
};

