export interface BeadColor {
  code: string;
  name: string;
  hex: string;
  category: string;
  artNo: string;
  isCustom?: boolean;
}

export interface PreciosaCatalogCategory {
  artNo: string;
  category: string;
  colors: Array<{
    code: string;
    hex: string;
    name?: string;
  }>;
}

export interface ProjectSchema {
  schemaVersion: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  rows: number;
  cols: number;
  cellSize: number;
  paletteRef: string;
  cells: (string | null)[][]; // rows x cols, contains colorCode or null
  doneMask: boolean[][];       // rows x cols, true if placed
  customColors: BeadColor[];
  notes: string;
}

export type ToolType =
  | 'pencil'
  | 'eraser'
  | 'bucket'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'diamond'
  | 'triangle'
  | 'star'
  | 'heart'
  | 'flower'
  | 'picker'
  | 'select'
  | 'done'
  | 'hand';

export interface SelectionRect {
  startR: number;
  startC: number;
  endR: number;
  endC: number;
}

export type BeadAspectRatio = '1.6x2.2' | '2.2x1.6' | '1x1';

export interface ViewOptions {
  renderStyle: 'square' | 'bead';
  beadRatio: BeadAspectRatio;
  showGrid: boolean;
  showRulers: boolean;
  showDoneMask: boolean;
  onlyIncomplete: boolean;
  focusColorCode: string | null;
  zoom: number;
  pan: { x: number; y: number };
  showNumbers: boolean;
}

export function getCellDimensions(
  cellSize: number,
  ratio: BeadAspectRatio
): { cellWidth: number; cellHeight: number } {
  if (ratio === '1.6x2.2') {
    const cellWidth = Math.max(2, Math.round(cellSize * (1.6 / 2.0)));
    const cellHeight = Math.max(2, Math.round(cellSize * (2.2 / 2.0)));
    return { cellWidth, cellHeight };
  } else if (ratio === '2.2x1.6') {
    const cellWidth = Math.max(2, Math.round(cellSize * (2.2 / 2.0)));
    const cellHeight = Math.max(2, Math.round(cellSize * (1.6 / 2.0)));
    return { cellWidth, cellHeight };
  } else {
    return { cellWidth: cellSize, cellHeight: cellSize };
  }
}

export interface ColorCountItem {
  color: BeadColor;
  count: number;
  doneCount: number;
  percentage: number;
}

export interface AutosaveSlot {
  slotKey: string;
  timestamp: number;
  name: string;
  rows: number;
  cols: number;
  totalBeads: number;
  project: ProjectSchema;
}
