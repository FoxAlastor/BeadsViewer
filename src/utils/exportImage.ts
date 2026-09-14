import { BeadAspectRatio, getCellDimensions, ProjectSchema } from '../types/beads';
import { findColorByCode } from '../data/preciosaDefaultPalette';
import { calculateColorCounts } from './exportCsv';

export interface ExportImageOptions {
  cellSize: number;
  beadRatio: BeadAspectRatio;
  renderStyle: 'square' | 'bead';
  showGrid: boolean;
  showRulers: boolean;
  showNumbers: boolean;
  includeLegend: boolean;
  backgroundColor: string;
  format: 'png' | 'jpeg';
}

export function exportProjectToImage(project: ProjectSchema, options: ExportImageOptions): string {
  const {
    cellSize,
    beadRatio,
    renderStyle,
    showGrid,
    showRulers,
    showNumbers,
    includeLegend,
    backgroundColor,
    format,
  } = options;

  const { cellWidth, cellHeight } = getCellDimensions(cellSize, beadRatio);

  const gridWidth = project.cols * cellWidth;
  const gridHeight = project.rows * cellHeight;

  // Header and ruler offsets
  const headerHeight = 65;
  const padding = 30;
  const rulerTop = showRulers ? 22 : 0;
  const rulerLeft = showRulers ? 28 : 0;

  let legendHeight = 0;
  const counts = calculateColorCounts(project, project.customColors);

  // Calculate legend rows
  const legendItemWidth = 180;
  const legendItemHeight = 28;
  const totalContentWidth = Math.max(gridWidth + rulerLeft + padding * 2, 520);
  const legendCols = Math.max(1, Math.floor((totalContentWidth - padding * 2) / legendItemWidth));

  if (includeLegend && counts.length > 0) {
    const legendRows = Math.ceil(counts.length / legendCols);
    legendHeight = legendRows * legendItemHeight + 60; // plus heading
  }

  const canvas = document.createElement('canvas');
  canvas.width = totalContentWidth;
  canvas.height = headerHeight + gridHeight + rulerTop + padding * 2 + legendHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Не вдалося створити контекст Canvas');

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(project.name, padding, 36);

  ctx.fillStyle = '#64748b';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const ratioLabel = beadRatio === '1.6x2.2' ? '1.6 × 2.2 мм (боком)' : beadRatio === '2.2x1.6' ? '2.2 × 1.6 мм' : '1:1 (квадрат)';
  ctx.fillText(
    `Розмір: ${project.cols} × ${project.rows} клітинок • Пропорція бісеру: ${ratioLabel} • Всього бісерин: ${counts.reduce((a, b) => a + b.count, 0)} • Дата: ${new Date().toLocaleDateString('uk-UA')}`,
    padding,
    56
  );

  // Position grid centered
  const gridStartX = Math.floor((canvas.width - gridWidth + rulerLeft) / 2);
  const gridStartY = headerHeight + padding + rulerTop;

  // Grid background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(gridStartX, gridStartY, gridWidth, gridHeight);

  // Draw cells
  for (let r = 0; r < project.rows; r++) {
    for (let c = 0; c < project.cols; c++) {
      const code = project.cells[r][c];
      const x = gridStartX + c * cellWidth;
      const y = gridStartY + r * cellHeight;

      if (code) {
        const color = findColorByCode(code, project.customColors);
        const hex = color?.hex || '#888888';

        if (renderStyle === 'bead') {
          // Realistic cylindrical/oval bead
          const cx = x + cellWidth / 2;
          const cy = y + cellHeight / 2;
          const radiusX = (cellWidth / 2) * 0.94;
          const radiusY = (cellHeight / 2) * 0.94;

          // Shadow
          ctx.beginPath();
          ctx.ellipse(cx + 0.5, cy + 0.5, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.fill();

          // Bead body
          ctx.beginPath();
          ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.fillStyle = hex;
          ctx.fill();

          // Radial highlight (pearl sheen)
          const grad = ctx.createRadialGradient(
            cx - radiusX * 0.35,
            cy - radiusY * 0.35,
            Math.min(radiusX, radiusY) * 0.05,
            cx,
            cy,
            Math.max(radiusX, radiusY)
          );
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
          grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.15)');
          grad.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.fill();

          // Threading hole in center
          ctx.beginPath();
          if (beadRatio === '1.6x2.2') {
            ctx.ellipse(cx, cy, Math.max(1.5, radiusX * 0.45), Math.max(1, radiusY * 0.18), 0, 0, Math.PI * 2);
          } else if (beadRatio === '2.2x1.6') {
            ctx.ellipse(cx, cy, Math.max(1, radiusX * 0.18), Math.max(1.5, radiusY * 0.45), 0, 0, Math.PI * 2);
          } else {
            ctx.arc(cx, cy, Math.max(1, radiusX * 0.22), 0, Math.PI * 2);
          }
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fill();
        } else {
          // Flat rectangular cell
          ctx.fillStyle = hex;
          ctx.fillRect(x, y, cellWidth, cellHeight);
        }

        // Show numbers if requested and cell is large enough
        if (showNumbers && cellWidth >= 14 && cellHeight >= 12) {
          ctx.fillStyle = getContrastYIQ(hex);
          ctx.font = `bold ${Math.max(8, Math.floor(Math.min(cellWidth, cellHeight) * 0.36))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const shortCode = code.length > 3 ? code.slice(-3) : code;
          ctx.fillText(shortCode, x + cellWidth / 2, y + cellHeight / 2);
        }
      }
    }
  }

  // Draw grid lines
  if (showGrid && (cellWidth >= 4 || cellHeight >= 4)) {
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let c = 0; c <= project.cols; c++) {
      const x = gridStartX + c * cellWidth + 0.5;
      ctx.moveTo(x, gridStartY);
      ctx.lineTo(x, gridStartY + gridHeight);
    }

    for (let r = 0; r <= project.rows; r++) {
      const y = gridStartY + r * cellHeight + 0.5;
      ctx.moveTo(gridStartX, y);
      ctx.lineTo(gridStartX + gridWidth, y);
    }
    ctx.stroke();

    // Bold lines every 5 and 10 cells
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let c = 0; c <= project.cols; c += 5) {
      const x = gridStartX + c * cellWidth + 0.5;
      ctx.moveTo(x, gridStartY);
      ctx.lineTo(x, gridStartY + gridHeight);
    }
    for (let r = 0; r <= project.rows; r += 5) {
      const y = gridStartY + r * cellHeight + 0.5;
      ctx.moveTo(gridStartX, y);
      ctx.lineTo(gridStartX + gridWidth, y);
    }
    ctx.stroke();
  }

  // Draw row and column rulers (Numbering for printed schemes)
  if (showRulers) {
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Column numbers along top
    for (let c = 0; c < project.cols; c++) {
      const colNum = c + 1;
      const x = gridStartX + c * cellWidth + cellWidth / 2;
      const isMultiple5 = colNum % 5 === 0;
      if (cellWidth >= 16 || isMultiple5 || colNum === 1 || colNum === project.cols) {
        ctx.fillStyle = isMultiple5 ? '#0284c7' : '#64748b';
        ctx.fillText(String(colNum), x, gridStartY - 10);
      }
    }

    // Row numbers along left
    for (let r = 0; r < project.rows; r++) {
      const rowNum = r + 1;
      const y = gridStartY + r * cellHeight + cellHeight / 2;
      const isMultiple5 = rowNum % 5 === 0;
      if (cellHeight >= 14 || isMultiple5 || rowNum === 1 || rowNum === project.rows) {
        ctx.fillStyle = isMultiple5 ? '#0284c7' : '#64748b';
        ctx.fillText(String(rowNum), gridStartX - 14, y);
      }
    }
    ctx.restore();
  }

  // Draw Legend
  if (includeLegend && counts.length > 0) {
    const legendStartY = gridStartY + gridHeight + padding;

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Легенда кольорів бісеру (Preciosa):', padding, legendStartY + 16);

    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    counts.forEach((item, idx) => {
      const colIdx = idx % legendCols;
      const rowIdx = Math.floor(idx / legendCols);

      const lx = padding + colIdx * legendItemWidth;
      const ly = legendStartY + 40 + rowIdx * legendItemHeight;

      // Color swatch box
      ctx.fillStyle = item.color.hex;
      ctx.fillRect(lx, ly - 12, 16, 16);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.strokeRect(lx, ly - 12, 16, 16);

      // Color info text
      ctx.fillStyle = '#334155';
      ctx.textAlign = 'left';
      ctx.fillText(`${item.color.code}: ${item.count} шт.`, lx + 22, ly);
    });
  }

  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  return canvas.toDataURL(mimeType, 0.95);
}

function getContrastYIQ(hexcolor: string): string {
  const hex = hexcolor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#0f172a' : '#ffffff';
}
