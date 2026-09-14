import { getCellDimensions, ProjectSchema, SelectionRect, ViewOptions } from '../types/beads';
import { findColorByCode } from '../data/preciosaDefaultPalette';
import { Point } from './tools';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  project: ProjectSchema;
  view: ViewOptions;
  hoverCell: Point | null;
  linePreview: Point[] | null;
  selection: SelectionRect | null;
}

export class CanvasRenderer {
  public render(params: RenderContext) {
    const { ctx, width, height, project, view, hoverCell, linePreview, selection } = params;
    const { rows, cols, cellSize } = project;
    const {
      zoom,
      pan,
      renderStyle,
      beadRatio,
      showGrid,
      showRulers,
      showDoneMask,
      onlyIncomplete,
      focusColorCode,
      showNumbers,
    } = view;

    const { cellWidth, cellHeight } = getCellDimensions(cellSize, beadRatio);

    // Clear viewport
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Dark backdrop with subtle grid dots
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Apply transform (pan + zoom)
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const sheetWidth = cols * cellWidth;
    const sheetHeight = rows * cellHeight;

    // Sheet drop shadow & background
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 18 / zoom;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4 / zoom;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, sheetWidth, sheetHeight);
    ctx.restore();

    // Viewport culling: calculate visible range of cells
    const effWidth = cellWidth * zoom;
    const effHeight = cellHeight * zoom;
    const minC = Math.max(0, Math.floor((-pan.x) / effWidth));
    const maxC = Math.min(cols - 1, Math.ceil((width - pan.x) / effWidth));
    const minR = Math.max(0, Math.floor((-pan.y) / effHeight));
    const maxR = Math.min(rows - 1, Math.ceil((height - pan.y) / effHeight));

    // 1. Render empty cell placeholders
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, sheetWidth, sheetHeight);

    // 2. Render Beads/Cells
    const customColors = project.customColors;

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const colorCode = project.cells[r][c];
        const isDone = project.doneMask[r][c];
        const x = c * cellWidth;
        const y = r * cellHeight;

        if (colorCode !== null) {
          const color = findColorByCode(colorCode, customColors);
          const hex = color?.hex || '#888888';

          // Focus Mode & Incomplete Mode Opacity Calculations
          let cellAlpha = 1.0;
          const isFocused = focusColorCode === null || focusColorCode === colorCode;
          if (!isFocused) {
            cellAlpha *= 0.18; // Dim non-focused colors
          }

          if (onlyIncomplete && isDone) {
            cellAlpha *= 0.15; // Dim already finished beads
          }

          ctx.save();
          ctx.globalAlpha = cellAlpha;

          if (renderStyle === 'bead') {
            this.drawRealisticBead(ctx, x, y, cellWidth, cellHeight, hex, beadRatio);
          } else {
            // Rectangular/Square cell
            ctx.fillStyle = hex;
            ctx.fillRect(x, y, cellWidth, cellHeight);
          }

          // Focused color indicator ring
          if (focusColorCode !== null && focusColorCode === colorCode) {
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = Math.max(1.5, 2 / zoom);
            if (renderStyle === 'bead') {
              ctx.beginPath();
              ctx.ellipse(
                x + cellWidth / 2,
                y + cellHeight / 2,
                cellWidth / 2 - 1,
                cellHeight / 2 - 1,
                0,
                0,
                Math.PI * 2
              );
              ctx.stroke();
            } else {
              ctx.strokeRect(x + 0.5, y + 0.5, cellWidth - 1, cellHeight - 1);
            }
          }

          // Cell short text code if enabled and cell size on screen is readable
          if (showNumbers && effWidth >= 14 && effHeight >= 12) {
            ctx.fillStyle = this.getContrastColor(hex);
            ctx.font = `bold ${Math.max(7, Math.floor(Math.min(cellWidth, cellHeight) * 0.36))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const shortCode = colorCode.length > 3 ? colorCode.slice(-3) : colorCode;
            ctx.fillText(shortCode, x + cellWidth / 2, y + cellHeight / 2);
          }

          ctx.restore();
        }

        // 3. Render Done-Mask
        if (isDone && showDoneMask) {
          this.drawDoneMask(ctx, x, y, cellWidth, cellHeight, renderStyle);
        }
      }
    }

    // 4. Grid lines
    if (showGrid && (effWidth >= 3 || effHeight >= 3)) {
      this.drawGridLines(ctx, sheetWidth, sheetHeight, rows, cols, cellWidth, cellHeight, zoom);
    }

    // 5. Line tool preview
    if (linePreview && linePreview.length > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5 / zoom;
      for (const pt of linePreview) {
        if (pt.r >= 0 && pt.r < rows && pt.c >= 0 && pt.c < cols) {
          const x = pt.c * cellWidth;
          const y = pt.r * cellHeight;
          ctx.fillRect(x, y, cellWidth, cellHeight);
          ctx.strokeRect(x, y, cellWidth, cellHeight);
        }
      }
      ctx.restore();
    }

    // 6. Selection rectangle
    if (selection) {
      const startC = Math.min(selection.startC, selection.endC);
      const endC = Math.max(selection.startC, selection.endC);
      const startR = Math.min(selection.startR, selection.endR);
      const endR = Math.max(selection.startR, selection.endR);

      const sx = startC * cellWidth;
      const sy = startR * cellHeight;
      const sw = (endC - startC + 1) * cellWidth;
      const sh = (endR - startR + 1) * cellHeight;

      ctx.save();
      ctx.fillStyle = 'rgba(14, 165, 233, 0.2)';
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.restore();
    }

    // 7. Hover cell cursor highlight
    if (hoverCell && hoverCell.r >= 0 && hoverCell.r < rows && hoverCell.c >= 0 && hoverCell.c < cols) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 / zoom;
      ctx.strokeRect(hoverCell.c * cellWidth, hoverCell.r * cellHeight, cellWidth, cellHeight);
      ctx.restore();
    }

    // Sheet outer border
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(0, 0, sheetWidth, sheetHeight);

    // 8. Row and Column Numbering Rulers
    if (showRulers) {
      this.drawRulers(
        ctx,
        rows,
        cols,
        cellWidth,
        cellHeight,
        zoom,
        minC,
        maxC,
        minR,
        maxR,
        hoverCell
      );
    }

    ctx.restore();
  }

  private drawRealisticBead(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    hex: string,
    beadRatio: string
  ) {
    const cx = x + cellWidth / 2;
    const cy = y + cellHeight / 2;
    const radiusX = (cellWidth / 2) * 0.94;
    const radiusY = (cellHeight / 2) * 0.94;

    // Drop shadow under bead
    ctx.beginPath();
    ctx.ellipse(cx + 0.6, cy + 0.8, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.fill();

    // Bead body
    ctx.beginPath();
    ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = hex;
    ctx.fill();

    // 3D Glass / Pearl Sheen reflection
    const grad = ctx.createRadialGradient(
      cx - radiusX * 0.35,
      cy - radiusY * 0.35,
      Math.min(radiusX, radiusY) * 0.05,
      cx,
      cy,
      Math.max(radiusX, radiusY)
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.68)');
    grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.14)');
    grad.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bead hole (threading channel)
    // When bead is sideways 1.6 x 2.2: the hole runs horizontally through the center!
    // When bead is 2.2 x 1.6: the hole runs vertically!
    ctx.beginPath();
    if (beadRatio === '1.6x2.2') {
      // Horizontal threading hole (inner channel)
      ctx.ellipse(cx, cy, Math.max(1.5, radiusX * 0.45), Math.max(1, radiusY * 0.18), 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.fill();

      // Side thread entry notches
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(x, cy - radiusY * 0.15, 1.2, radiusY * 0.3);
      ctx.fillRect(x + cellWidth - 1.2, cy - radiusY * 0.15, 1.2, radiusY * 0.3);
    } else if (beadRatio === '2.2x1.6') {
      // Vertical threading hole
      ctx.ellipse(cx, cy, Math.max(1, radiusX * 0.18), Math.max(1.5, radiusY * 0.45), 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.fill();
    } else {
      // Center round hole
      ctx.arc(cx, cy, Math.max(1, Math.min(radiusX, radiusY) * 0.22), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fill();
    }
  }

  private drawDoneMask(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    renderStyle: 'square' | 'bead'
  ) {
    ctx.save();
    // Semi-transparent checkmark / hatch overlay
    ctx.fillStyle = 'rgba(16, 185, 129, 0.28)'; // Emerald tint
    if (renderStyle === 'bead') {
      const cx = x + cellWidth / 2;
      const cy = y + cellHeight / 2;
      const radiusX = (cellWidth / 2) * 0.94;
      const radiusY = (cellHeight / 2) * 0.94;
      ctx.beginPath();
      ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, cellWidth, cellHeight);
    }

    // Diagonal hatch lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = Math.max(1, Math.min(cellWidth, cellHeight) * 0.08);
    ctx.beginPath();
    ctx.moveTo(x + cellWidth * 0.2, y + cellHeight * 0.8);
    ctx.lineTo(x + cellWidth * 0.8, y + cellHeight * 0.2);
    ctx.stroke();

    ctx.restore();
  }

  private drawGridLines(
    ctx: CanvasRenderingContext2D,
    sheetWidth: number,
    sheetHeight: number,
    rows: number,
    cols: number,
    cellWidth: number,
    cellHeight: number,
    zoom: number
  ) {
    // Normal grid lines
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();

    for (let c = 0; c <= cols; c++) {
      const x = c * cellWidth;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, sheetHeight);
    }

    for (let r = 0; r <= rows; r++) {
      const y = r * cellHeight;
      ctx.moveTo(0, y);
      ctx.lineTo(sheetWidth, y);
    }
    ctx.stroke();

    // Accent lines every 5 cells
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1.5 / zoom;
    ctx.beginPath();

    for (let c = 0; c <= cols; c += 5) {
      if (c === 0 || c === cols) continue;
      const x = c * cellWidth;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, sheetHeight);
    }

    for (let r = 0; r <= rows; r += 5) {
      if (r === 0 || r === rows) continue;
      const y = r * cellHeight;
      ctx.moveTo(0, y);
      ctx.lineTo(sheetWidth, y);
    }
    ctx.stroke();

    // Major division lines every 10 cells
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();

    for (let c = 0; c <= cols; c += 10) {
      if (c === 0 || c === cols) continue;
      const x = c * cellWidth;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, sheetHeight);
    }

    for (let r = 0; r <= rows; r += 10) {
      if (r === 0 || r === rows) continue;
      const y = r * cellHeight;
      ctx.moveTo(0, y);
      ctx.lineTo(sheetWidth, y);
    }
    ctx.stroke();

    ctx.restore();
  }

  private drawRulers(
    ctx: CanvasRenderingContext2D,
    rows: number,
    cols: number,
    cellWidth: number,
    cellHeight: number,
    zoom: number,
    minC: number,
    maxC: number,
    minR: number,
    maxR: number,
    hoverCell: Point | null
  ) {
    const rulerThicknessTop = 22;
    const rulerThicknessLeft = 28;
    const sheetWidth = cols * cellWidth;
    const sheetHeight = rows * cellHeight;

    ctx.save();

    // Top Ruler Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, -rulerThicknessTop, sheetWidth, rulerThicknessTop);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2 / zoom;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(sheetWidth, 0);
    ctx.stroke();

    // Left Ruler Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(-rulerThicknessLeft, 0, rulerThicknessLeft, sheetHeight);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, sheetHeight);
    ctx.stroke();

    // Corner box
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-rulerThicknessLeft, -rulerThicknessTop, rulerThicknessLeft, rulerThicknessTop);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(-rulerThicknessLeft, -rulerThicknessTop, rulerThicknessLeft, rulerThicknessTop);
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('№', -rulerThicknessLeft / 2, -rulerThicknessTop / 2);

    // Column Numbers (Top Ruler)
    const effWidth = cellWidth * zoom;
    const showEveryCol = effWidth >= 16;
    const showEvery5Col = effWidth >= 7;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let c = minC; c <= maxC; c++) {
      const colNum = c + 1;
      const isMultiple5 = colNum % 5 === 0;
      const isMultiple10 = colNum % 10 === 0;
      const isHovered = hoverCell && hoverCell.c === c;

      const x = c * cellWidth + cellWidth / 2;
      const tickX = c * cellWidth;

      // Vertical tick mark
      ctx.strokeStyle = isMultiple10 ? '#38bdf8' : isMultiple5 ? '#94a3b8' : '#334155';
      ctx.lineWidth = (isMultiple10 ? 1.5 : 1) / zoom;
      ctx.beginPath();
      ctx.moveTo(tickX, -6);
      ctx.lineTo(tickX, 0);
      ctx.stroke();

      // Number label
      if (showEveryCol || (showEvery5Col && isMultiple5) || isMultiple10 || isHovered) {
        if (isHovered) {
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 10px sans-serif';
        } else if (isMultiple10) {
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 10px sans-serif';
        } else if (isMultiple5) {
          ctx.fillStyle = '#e2e8f0';
          ctx.font = 'bold 9px sans-serif';
        } else {
          ctx.fillStyle = '#64748b';
          ctx.font = '8px sans-serif';
        }
        ctx.fillText(String(colNum), x, -rulerThicknessTop / 2);
      }
    }

    // Row Numbers (Left Ruler)
    const effHeight = cellHeight * zoom;
    const showEveryRow = effHeight >= 14;
    const showEvery5Row = effHeight >= 7;

    for (let r = minR; r <= maxR; r++) {
      const rowNum = r + 1;
      const isMultiple5 = rowNum % 5 === 0;
      const isMultiple10 = rowNum % 10 === 0;
      const isHovered = hoverCell && hoverCell.r === r;

      const y = r * cellHeight + cellHeight / 2;
      const tickY = r * cellHeight;

      // Horizontal tick mark
      ctx.strokeStyle = isMultiple10 ? '#38bdf8' : isMultiple5 ? '#94a3b8' : '#334155';
      ctx.lineWidth = (isMultiple10 ? 1.5 : 1) / zoom;
      ctx.beginPath();
      ctx.moveTo(-6, tickY);
      ctx.lineTo(0, tickY);
      ctx.stroke();

      // Number label
      if (showEveryRow || (showEvery5Row && isMultiple5) || isMultiple10 || isHovered) {
        if (isHovered) {
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 10px sans-serif';
        } else if (isMultiple10) {
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 10px sans-serif';
        } else if (isMultiple5) {
          ctx.fillStyle = '#e2e8f0';
          ctx.font = 'bold 9px sans-serif';
        } else {
          ctx.fillStyle = '#64748b';
          ctx.font = '8px sans-serif';
        }
        ctx.fillText(String(rowNum), -rulerThicknessLeft / 2, y);
      }
    }

    ctx.restore();
  }

  private getContrastColor(hexcolor: string): string {
    const hex = hexcolor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#0f172a' : '#ffffff';
  }
}
