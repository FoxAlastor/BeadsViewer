import { ProjectSchema, SelectionRect, ToolType } from '../types/beads';
import { createEmptyGrid } from '../utils/projectSerialization';

export interface Point {
  r: number;
  c: number;
}

export function deduplicatePoints(pts: Point[]): Point[] {
  const seen = new Set<string>();
  const res: Point[] = [];
  for (const p of pts) {
    const key = `${p.r},${p.c}`;
    if (!seen.has(key)) {
      seen.add(key);
      res.push(p);
    }
  }
  return res;
}

/**
 * Bresenham's line algorithm for integer grid
 */
export function getLinePoints(r0: number, c0: number, r1: number, c1: number): Point[] {
  const points: Point[] = [];
  const dr = Math.abs(r1 - r0);
  const dc = Math.abs(c1 - c0);
  const sr = r0 < r1 ? 1 : -1;
  const sc = c0 < c1 ? 1 : -1;
  let err = (dc > dr ? dc : -dr) / 2;

  let currR = r0;
  let currC = c0;

  while (true) {
    points.push({ r: currR, c: currC });
    if (currR === r1 && currC === c1) break;
    const e2 = err;
    if (e2 > -dc) {
      err -= dr;
      currC += sc;
    }
    if (e2 < dr) {
      err += dc;
      currR += sr;
    }
  }

  return points;
}

export function getPolygonPerimeter(vertices: Point[]): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const next = (i + 1) % vertices.length;
    pts.push(...getLinePoints(vertices[i].r, vertices[i].c, vertices[next].r, vertices[next].c));
  }
  return deduplicatePoints(pts);
}

function isPointInPolygon(r: number, c: number, vertices: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const ri = vertices[i].r;
    const ci = vertices[i].c;
    const rj = vertices[j].r;
    const cj = vertices[j].c;
    const intersect = ci > c !== cj > c && r < ((rj - ri) * (c - ci)) / (cj - ci + 1e-9) + ri;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * 1. Квадрат / Прямокутник
 */
export function getRectanglePoints(r0: number, c0: number, r1: number, c1: number, filled: boolean): Point[] {
  const minR = Math.min(r0, r1);
  const maxR = Math.max(r0, r1);
  const minC = Math.min(c0, c1);
  const maxC = Math.max(c0, c1);

  const points: Point[] = [];
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (filled || r === minR || r === maxR || c === minC || c === maxC) {
        points.push({ r, c });
      }
    }
  }
  return points;
}

/**
 * 2. Коло / Еліпс
 */
export function getCirclePoints(r0: number, c0: number, r1: number, c1: number, filled: boolean): Point[] {
  const minR = Math.min(r0, r1);
  const maxR = Math.max(r0, r1);
  const minC = Math.min(c0, c1);
  const maxC = Math.max(c0, c1);
  const cr = (minR + maxR) / 2;
  const cc = (minC + maxC) / 2;
  const radR = Math.max(0.5, (maxR - minR) / 2);
  const radC = Math.max(0.5, (maxC - minC) / 2);

  const isInside = (r: number, c: number) => {
    const nr = (r - cr) / radR;
    const nc = (c - cc) / radC;
    return nr * nr + nc * nc <= 1.06;
  };

  const points: Point[] = [];
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (isInside(r, c)) {
        if (filled) {
          points.push({ r, c });
        } else {
          if (!isInside(r - 1, c) || !isInside(r + 1, c) || !isInside(r, c - 1) || !isInside(r, c + 1)) {
            points.push({ r, c });
          }
        }
      }
    }
  }

  return points.length > 0 ? points : [{ r: Math.round(cr), c: Math.round(cc) }];
}

/**
 * 3. Ромб
 */
export function getDiamondPoints(r0: number, c0: number, r1: number, c1: number, filled: boolean): Point[] {
  const minR = Math.min(r0, r1);
  const maxR = Math.max(r0, r1);
  const minC = Math.min(c0, c1);
  const maxC = Math.max(c0, c1);
  const cr = Math.round((minR + maxR) / 2);
  const cc = Math.round((minC + maxC) / 2);

  const vertices: Point[] = [
    { r: minR, c: cc },
    { r: cr, c: maxC },
    { r: maxR, c: cc },
    { r: cr, c: minC },
  ];

  if (!filled) {
    return getPolygonPerimeter(vertices);
  }

  const radR = Math.max(0.5, (maxR - minR) / 2);
  const radC = Math.max(0.5, (maxC - minC) / 2);
  const points: Point[] = [];

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const d = Math.abs(r - cr) / radR + Math.abs(c - cc) / radC;
      if (d <= 1.05) {
        points.push({ r, c });
      }
    }
  }

  points.push(...getPolygonPerimeter(vertices));
  return deduplicatePoints(points);
}

/**
 * 4. Трикутник
 */
export function getTrianglePoints(r0: number, c0: number, r1: number, c1: number, filled: boolean): Point[] {
  const minR = Math.min(r0, r1);
  const maxR = Math.max(r0, r1);
  const minC = Math.min(c0, c1);
  const maxC = Math.max(c0, c1);
  const midC = Math.round((minC + maxC) / 2);

  const vertices: Point[] = [
    { r: minR, c: midC },
    { r: maxR, c: maxC },
    { r: maxR, c: minC },
  ];

  if (!filled) {
    return getPolygonPerimeter(vertices);
  }

  const points: Point[] = [];
  for (let r = minR; r <= maxR; r++) {
    const t = maxR === minR ? 1 : (r - minR) / (maxR - minR);
    const leftC = Math.round(midC + (minC - midC) * t);
    const rightC = Math.round(midC + (maxC - midC) * t);
    const startC = Math.min(leftC, rightC);
    const endC = Math.max(leftC, rightC);
    for (let c = startC; c <= endC; c++) {
      points.push({ r, c });
    }
  }

  points.push(...getPolygonPerimeter(vertices));
  return deduplicatePoints(points);
}

/**
 * 5. Зірка (5-кінцева)
 */
export function getStarPoints(r0: number, c0: number, r1: number, c1: number, filled: boolean): Point[] {
  const minR = Math.min(r0, r1);
  const maxR = Math.max(r0, r1);
  const minC = Math.min(c0, c1);
  const maxC = Math.max(c0, c1);
  const cr = (minR + maxR) / 2;
  const cc = (minC + maxC) / 2;
  const radR = Math.max(1, (maxR - minR) / 2);
  const radC = Math.max(1, (maxC - minC) / 2);

  const vertices: Point[] = [];
  for (let k = 0; k < 10; k++) {
    const angle = -Math.PI / 2 + k * ((2 * Math.PI) / 10);
    const factor = k % 2 === 0 ? 1.0 : 0.42;
    vertices.push({
      r: Math.round(cr + Math.sin(angle) * radR * factor),
      c: Math.round(cc + Math.cos(angle) * radC * factor),
    });
  }

  if (!filled) {
    return getPolygonPerimeter(vertices);
  }

  const points: Point[] = [];
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (isPointInPolygon(r, c, vertices)) {
        points.push({ r, c });
      }
    }
  }

  points.push(...getPolygonPerimeter(vertices));
  return deduplicatePoints(points);
}

/**
 * 6. Сердечко
 */
export function getHeartPoints(r0: number, c0: number, r1: number, c1: number, filled: boolean): Point[] {
  const minR = Math.min(r0, r1);
  const maxR = Math.max(r0, r1);
  const minC = Math.min(c0, c1);
  const maxC = Math.max(c0, c1);
  const h = maxR - minR + 1;
  const w = maxC - minC + 1;

  if (h <= 2 || w <= 2) {
    return getRectanglePoints(r0, c0, r1, c1, filled);
  }

  // Use a sampled parametric heart instead of an implicit curve. The latter
  // becomes disconnected after rounding to cells, especially beyond 10x10.
  // Sampling first and mapping the complete contour to the drag rectangle
  // keeps both lobes and the side bands present at every size.
  const rawVertices: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 96; i++) {
    const t = (i / 96) * Math.PI * 2;
    rawVertices.push({
      x: 16 * Math.pow(Math.sin(t), 3),
      y: 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t),
    });
  }
  const rawMinX = Math.min(...rawVertices.map((p) => p.x));
  const rawMaxX = Math.max(...rawVertices.map((p) => p.x));
  const rawMinY = Math.min(...rawVertices.map((p) => p.y));
  const rawMaxY = Math.max(...rawVertices.map((p) => p.y));
  const vertices = rawVertices.map((p) => ({
    // Screen rows grow downwards, hence the inverted y mapping.
    r: Math.round(minR + ((rawMaxY - p.y) / (rawMaxY - rawMinY)) * (h - 1)),
    c: Math.round(minC + ((p.x - rawMinX) / (rawMaxX - rawMinX)) * (w - 1)),
  }));
  const isHeart = (r: number, c: number) => isPointInPolygon(r, c, vertices);

  const points: Point[] = [];
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (isHeart(r, c)) {
        if (filled) {
          points.push({ r, c });
        } else {
          if (!isHeart(r - 1, c) || !isHeart(r + 1, c) || !isHeart(r, c - 1) || !isHeart(r, c + 1)) {
            points.push({ r, c });
          }
        }
      }
    }
  }

  return points.length > 0 ? deduplicatePoints([...points, ...getPolygonPerimeter(vertices)]) : [{ r: minR, c: Math.round((minC + maxC) / 2) }];
}

/**
 * 7. П'ятипелюсткова квітка
 */
export function getFlowerPoints(r0: number, c0: number, r1: number, c1: number, filled: boolean): Point[] {
  const minR = Math.min(r0, r1);
  const maxR = Math.max(r0, r1);
  const minC = Math.min(c0, c1);
  const maxC = Math.max(c0, c1);
  const h = maxR - minR + 1;
  const w = maxC - minC + 1;

  if (h <= 3 || w <= 3) {
    return getCirclePoints(r0, c0, r1, c1, filled);
  }

  const cr = (minR + maxR) / 2;
  const cc = (minC + maxC) / 2;
  const radR = Math.max(1, (maxR - minR) / 2);
  const radC = Math.max(1, (maxC - minC) / 2);

  const isFlower = (r: number, c: number) => {
    const nr = (r - cr) / radR;
    const nc = (c - cc) / radC;
    const dist = Math.hypot(nr, nc);
    if (dist <= 0.3) return true; // Center pistil disk
    if (dist > 1.05) return false;

    const angle = Math.atan2(nr, nc);
    const petals = Math.cos(2.5 * angle);
    const maxRadius = 0.32 + 0.68 * Math.pow(Math.abs(petals), 0.7);
    return dist <= maxRadius * 1.05;
  };

  const points: Point[] = [];
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (isFlower(r, c)) {
        if (filled) {
          points.push({ r, c });
        } else {
          const nr = (r - cr) / radR;
          const nc = (c - cc) / radC;
          const dist = Math.hypot(nr, nc);
          const isCenterCircle = Math.abs(dist - 0.3) <= 0.12;

          if (
            isCenterCircle ||
            !isFlower(r - 1, c) ||
            !isFlower(r + 1, c) ||
            !isFlower(r, c - 1) ||
            !isFlower(r, c + 1)
          ) {
            points.push({ r, c });
          }
        }
      }
    }
  }

  return points.length > 0 ? points : [{ r: Math.round(cr), c: Math.round(cc) }];
}

export function isShapeTool(tool: ToolType): boolean {
  return (
    tool === 'line' ||
    tool === 'rectangle' ||
    tool === 'circle' ||
    tool === 'diamond' ||
    tool === 'triangle' ||
    tool === 'star' ||
    tool === 'heart' ||
    tool === 'flower'
  );
}

export function getShapePoints(
  tool: ToolType,
  r0: number,
  c0: number,
  r1: number,
  c1: number,
  filled: boolean
): Point[] {
  switch (tool) {
    case 'line':
      return getLinePoints(r0, c0, r1, c1);
    case 'rectangle':
      return getRectanglePoints(r0, c0, r1, c1, filled);
    case 'circle':
      return getCirclePoints(r0, c0, r1, c1, filled);
    case 'diamond':
      return getDiamondPoints(r0, c0, r1, c1, filled);
    case 'triangle':
      return getTrianglePoints(r0, c0, r1, c1, filled);
    case 'star':
      return getStarPoints(r0, c0, r1, c1, filled);
    case 'heart':
      return getHeartPoints(r0, c0, r1, c1, filled);
    case 'flower':
      return getFlowerPoints(r0, c0, r1, c1, filled);
    default:
      return [];
  }
}

/**
 * 4-way flood fill algorithm
 */
export function floodFill(
  cells: (string | null)[][],
  startR: number,
  startC: number,
  newColorCode: string | null
): Point[] {
  const rows = cells.length;
  const cols = cells[0].length;
  if (startR < 0 || startR >= rows || startC < 0 || startC >= cols) return [];

  const targetColor = cells[startR][startC];
  if (targetColor === newColorCode) return []; // Already the target color

  const visited: boolean[][] = createEmptyGrid(rows, cols, false);
  const changedPoints: Point[] = [];
  const queue: Point[] = [{ r: startR, c: startC }];
  visited[startR][startC] = true;

  while (queue.length > 0) {
    const pt = queue.pop()!;
    changedPoints.push(pt);

    const neighbors = [
      { r: pt.r - 1, c: pt.c },
      { r: pt.r + 1, c: pt.c },
      { r: pt.r, c: pt.c - 1 },
      { r: pt.r, c: pt.c + 1 },
    ];

    for (const n of neighbors) {
      if (
        n.r >= 0 &&
        n.r < rows &&
        n.c >= 0 &&
        n.c < cols &&
        !visited[n.r][n.c] &&
        cells[n.r][n.c] === targetColor
      ) {
        visited[n.r][n.c] = true;
        queue.push(n);
      }
    }
  }

  return changedPoints;
}

/**
 * Normalizes selection coordinates
 */
export function normalizeSelection(sel: SelectionRect): SelectionRect {
  return {
    startR: Math.min(sel.startR, sel.endR),
    startC: Math.min(sel.startC, sel.endC),
    endR: Math.max(sel.startR, sel.endR),
    endC: Math.max(sel.startC, sel.endC),
  };
}

/**
 * Resize grid on the fly from any edge (top, bottom, left, right)
 */
export function resizeGridEdges(
  project: ProjectSchema,
  deltaTop: number,
  deltaBottom: number,
  deltaLeft: number,
  deltaRight: number
): ProjectSchema {
  const newRows = project.rows + deltaTop + deltaBottom;
  const newCols = project.cols + deltaLeft + deltaRight;

  if (newRows < 1 || newCols < 1) {
    throw new Error('Розмір полотна не може бути меншим ніж 1×1');
  }

  const newCells = createEmptyGrid<string | null>(newRows, newCols, null);
  const newDoneMask = createEmptyGrid<boolean>(newRows, newCols, false);

  for (let r = 0; r < project.rows; r++) {
    for (let c = 0; c < project.cols; c++) {
      const targetR = r + deltaTop;
      const targetC = c + deltaLeft;

      if (targetR >= 0 && targetR < newRows && targetC >= 0 && targetC < newCols) {
        newCells[targetR][targetC] = project.cells[r][c];
        newDoneMask[targetR][targetC] = project.doneMask[r][c];
      }
    }
  }

  return {
    ...project,
    rows: newRows,
    cols: newCols,
    cells: newCells,
    doneMask: newDoneMask,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Crops canvas to the given rectangular selection
 */
export function cropToSelection(project: ProjectSchema, sel: SelectionRect): ProjectSchema {
  const norm = normalizeSelection(sel);
  const r0 = Math.max(0, norm.startR);
  const c0 = Math.max(0, norm.startC);
  const r1 = Math.min(project.rows - 1, norm.endR);
  const c1 = Math.min(project.cols - 1, norm.endC);

  const newRows = r1 - r0 + 1;
  const newCols = c1 - c0 + 1;

  if (newRows <= 0 || newCols <= 0) {
    throw new Error('Виділена область порожня');
  }

  const newCells = createEmptyGrid<string | null>(newRows, newCols, null);
  const newDoneMask = createEmptyGrid<boolean>(newRows, newCols, false);

  for (let r = 0; r < newRows; r++) {
    for (let c = 0; c < newCols; c++) {
      newCells[r][c] = project.cells[r0 + r][c0 + c];
      newDoneMask[r][c] = project.doneMask[r0 + r][c0 + c];
    }
  }

  return {
    ...project,
    rows: newRows,
    cols: newCols,
    cells: newCells,
    doneMask: newDoneMask,
    updatedAt: new Date().toISOString(),
  };
}
