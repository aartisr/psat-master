import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for browser environment
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '6.3.289'}/build/pdf.worker.min.mjs`;

interface TextItem {
  str: string;
  x: number;
  y: number;
  height: number;
}

export interface ExtractedPdfResult {
  text: string;
  pageImages: Record<number, string>; // maps 1-indexed pageNum to Base64 image data-url
  fullPageImages: Record<number, string>; // maps 1-indexed pageNum to Base64 image data-url
}

/**
 * Computer vision heuristic to automatically detect the main diagram/picture bounding box on a rendered page canvas.
 * Spans of black/gray lines with height > 55px (which filters out standard horizontal text lines) are cropped and
 * returned as a high-resolution base64 PNG.
 */
function detectAndCropDiagram(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Helper to check if pixel is not background-white (RGB all >= 242 is considered white background)
  const isNonWhite = (r: number, g: number, b: number) => {
    return r < 242 || g < 242 || b < 242;
  };

  // 1. Calculate row densities (count of content pixels on each horizontal row)
  const rowDensity = new Array(height).fill(0);
  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (isNonWhite(data[idx], data[idx + 1], data[idx + 2])) {
        count++;
      }
    }
    rowDensity[y] = count;
  }

  // 2. Identify continuous vertical blocks of content (filtering out short text blocks)
  const regions: { startY: number; endY: number; blockHeight: number; totalDensity: number }[] = [];
  let inRegion = false;
  let startY = 0;
  let totalDensity = 0;

  for (let y = 0; y < height; y++) {
    const isActive = rowDensity[y] > 4; // row has content

    if (isActive && !inRegion) {
      inRegion = true;
      startY = y;
      totalDensity = rowDensity[y];
    } else if (isActive && inRegion) {
      totalDensity += rowDensity[y];
    } else if (!isActive && inRegion) {
      inRegion = false;
      const endY = y;
      const bHeight = endY - startY;
      // We look for drawing blocks. SAT text lines are typically 8-15px high.
      // Diagrams and charts are always much larger blocks (usually > 55px vertically).
      if (bHeight > 55) {
        regions.push({ startY, endY, blockHeight: bHeight, totalDensity });
      }
    }
  }

  if (inRegion) {
    const endY = height;
    const bHeight = endY - startY;
    if (bHeight > 55) {
      regions.push({ startY, endY, blockHeight: bHeight, totalDensity });
    }
  }

  if (regions.length === 0) {
    return null;
  }

  // Filter candidates to avoid header banners or footer page numbers
  const candidates = regions.filter((r) => {
    const midY = (r.startY + r.endY) / 2;
    return midY > height * 0.05 && midY < height * 0.85;
  });

  if (candidates.length === 0) return null;

  // Prefer the largest block by pixel density
  candidates.sort((a, b) => b.totalDensity - a.totalDensity);
  const bestRegion = candidates[0];

  // 3. Find accurate horizontal boundaries (minX to maxX) for this vertical region
  let minX = width;
  let maxX = 0;
  for (let y = bestRegion.startY; y < bestRegion.endY; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (isNonWhite(data[idx], data[idx + 1], data[idx + 2])) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }

  const rWidth = maxX - minX;
  if (rWidth < 40) return null; // Too narrow to be a valid graph or picture

  // 4. Crop image and add beautiful white margins
  const pad = 15;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, bestRegion.startY - pad);
  const cropW = Math.min(width - cropX, rWidth + 2 * pad);
  const cropH = Math.min(height - cropY, bestRegion.blockHeight + 2 * pad);

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) return null;

  cropCtx.fillStyle = '#ffffff';
  cropCtx.fillRect(0, 0, cropW, cropH);
  cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  // Return a compressed jpeg data URL (reduces payload footprint compared to png)
  return cropCanvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Extracts structured text and also detects and crops visual diagrams from a PDF buffer.
 */
export async function extractTextAndImagesFromPdfBuffer(arrayBuffer: ArrayBuffer, skipImages: boolean = false): Promise<ExtractedPdfResult> {
  const pageImages: Record<number, string> = {};
  const fullPageImages: Record<number, string> = {};
  let accumulatedText = '';

  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      
      // 1. Text extraction
      const textContent = await page.getTextContent();
      const items: TextItem[] = [];
      for (const item of textContent.items) {
        if ('str' in item && item.str.trim().length > 0) {
          const transform = item.transform;
          items.push({
            str: item.str,
            x: transform[4],
            y: transform[5],
            height: Math.abs(transform[3]) || 10
          });
        }
      }

      items.sort((a, b) => {
        const yDiff = Math.abs(a.y - b.y);
        if (yDiff < 8) {
          return a.x - b.x;
        }
        return b.y - a.y;
      });

      const pageLines: string[] = [];
      let currentLineItems: TextItem[] = [];
      let currentY: number | null = null;

      for (const item of items) {
        if (currentY === null) {
          currentY = item.y;
          currentLineItems.push(item);
        } else if (Math.abs(item.y - currentY) < 8) {
          currentLineItems.push(item);
        } else {
          currentLineItems.sort((a, b) => a.x - b.x);
          pageLines.push(currentLineItems.map((i) => i.str).join(' '));
          currentY = item.y;
          currentLineItems = [item];
        }
      }

      if (currentLineItems.length > 0) {
        currentLineItems.sort((a, b) => a.x - b.x);
        pageLines.push(currentLineItems.map((i) => i.str).join(' '));
      }

      const cleanedLines = pageLines.map((line) =>
        line
          .replace(/[\uE000-\uF8FF\uF000-\uFFFF\uFEFF\uFFFD\u25A0-\u25FF\u0000-\u0008\u000B-\u001F]/g, '')
          .replace(/Di\s*ffi\s*culty/gi, 'Difficulty')
          .replace(/\bf\s*fi\b/g, 'ffi')
          .replace(/\bf\s*i\b/g, 'fi')
          .replace(/\bf\s*l\b/g, 'fl')
          .replace(/\s{2,}/g, ' ')
          .trim()
      );

      accumulatedText += `--- Page ${pageNum} ---\n${cleanedLines.join('\n')}\n\n`;

      // 2. High-Accuracy Diagram Rendering & Cropping
      if (!skipImages) {
        try {
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport } as any).promise;
            const croppedDiagram = detectAndCropDiagram(canvas);
            if (croppedDiagram) {
              pageImages[pageNum] = croppedDiagram;
            }
            const fullPageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            fullPageImages[pageNum] = fullPageDataUrl.split(',')[1] || fullPageDataUrl;
          }
        } catch (cropErr) {
          console.warn(`Could not crop diagram on page ${pageNum}:`, cropErr);
        }
      }
    }

    return { text: accumulatedText.trim(), pageImages, fullPageImages };
  } catch (err: any) {
    console.warn('PDF detailed extraction failed:', err);
    return { text: '', pageImages: {}, fullPageImages: {} };
  }
}

/**
 * Legacy compatibility wrapper
 */
export async function extractTextFromPdfBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
  const result = await extractTextAndImagesFromPdfBuffer(arrayBuffer);
  return result.text;
}

/**
 * Strict heuristic to determine if a question prompt actually references a visual graphic/diagram.
 * Explicitly avoids false positives from analytical mathematical phrases like "graph of y = f(x)" or "in the xy-plane".
 */
export function shouldAttachVisualReference(prompt: string): boolean {
  if (!prompt || !prompt.trim()) return false;
  const p = prompt.toLowerCase();

  // Explicit visual figure reference indicators
  const hasShown = /\b(is shown|are shown|shown above|shown below|shown in the (?:figure|graph|xy-plane|image))\b/i.test(p);
  const hasFigureNotDrawnToScale = /figure not drawn to scale/i.test(p);
  const hasFigureRef = /\b(?:in the figure|the figure (?:above|below|at the|shows|illustrates)|see figure)\b/i.test(p);
  const hasReferTo = /\brefer to the (?:graph|figure|diagram|image)\b/i.test(p);
  const hasDiagram = /\bthe diagram (?:above|below|shows|illustrates)\b/i.test(p);
  const hasScatterplotShown = /\b(?:scatterplot|scatter plot)\b/i.test(p) && /\b(?:shows|shown|displays)\b/i.test(p);
  const hasShadedRegion = /\bshaded (?:region|area|triangle|rectangle|section)\b/i.test(p);
  const hasGeometricFigure = /\b(?:in triangle [A-Z]{3}|circle with center [A-Z]|polygon [A-Z]+)\b/i.test(p) && /\b(?:above|below|shown)\b/i.test(p);

  return (
    hasShown ||
    hasFigureNotDrawnToScale ||
    hasFigureRef ||
    hasReferTo ||
    hasDiagram ||
    hasScatterplotShown ||
    hasShadedRegion ||
    hasGeometricFigure
  );
}
