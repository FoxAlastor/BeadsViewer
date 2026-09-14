import { BeadColor, ColorCountItem, ProjectSchema } from '../types/beads';
import { findColorByCode } from '../data/preciosaDefaultPalette';
import { downloadBlob } from './fileSystem';

export function calculateColorCounts(project: ProjectSchema, customColors: BeadColor[]): ColorCountItem[] {
  const tally = new Map<string, { count: number; doneCount: number }>();
  let totalCount = 0;

  for (let r = 0; r < project.rows; r++) {
    for (let c = 0; c < project.cols; c++) {
      const colorCode = project.cells[r][c];
      if (colorCode !== null) {
        totalCount++;
        const isDone = project.doneMask[r][c];
        const existing = tally.get(colorCode) || { count: 0, doneCount: 0 };
        existing.count++;
        if (isDone) existing.doneCount++;
        tally.set(colorCode, existing);
      }
    }
  }

  const items: ColorCountItem[] = [];
  tally.forEach((val, code) => {
    const color = findColorByCode(code, customColors) || {
      code,
      name: `Колір ${code}`,
      hex: '#888888',
      category: 'Користувацька',
      artNo: '—',
    };
    items.push({
      color,
      count: val.count,
      doneCount: val.doneCount,
      percentage: totalCount > 0 ? (val.count / totalCount) * 100 : 0,
    });
  });

  // Default sort by count descending
  return items.sort((a, b) => b.count - a.count);
}

export function exportBeadsCountToCsv(items: ColorCountItem[], projectName: string) {
  // UTF-8 BOM so Excel opens it with proper Cyrillic characters
  let csv = '\uFEFF';
  csv += 'Артикул;Код кольору;Назва / Категорія;HEX;Кількість (шт);Вже вплетено (шт);Залишок (шт);Відсоток (%)\n';

  let totalCount = 0;
  let totalDone = 0;

  for (const item of items) {
    totalCount += item.count;
    totalDone += item.doneCount;
    const remaining = item.count - item.doneCount;
    const cleanArt = `"${item.color.artNo.replace(/"/g, '""')}"`;
    const cleanName = `"${item.color.name.replace(/"/g, '""')} (${item.color.category})"`;
    csv += `${cleanArt};"${item.color.code}";${cleanName};"${item.color.hex}";${item.count};${item.doneCount};${remaining};${item.percentage.toFixed(1)}%\n`;
  }

  csv += `\n"РАЗОМ";"";"Всього бісерин";"";${totalCount};${totalDone};${totalCount - totalDone};100%\n`;

  const fileName = `список_бісеру_${projectName.toLowerCase().replace(/[^a-z0-9а-яіїєґ_]+/gi, '_')}.csv`;
  downloadBlob(csv, fileName, 'text/csv;charset=utf-8;');
}
