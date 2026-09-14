import { BeadColor, ProjectSchema } from '../types/beads';

export function createEmptyGrid<T>(rows: number, cols: number, defaultValue: T): T[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(defaultValue));
}

export function createDefaultProject(rows = 40, cols = 40, name = 'Нова схема бісеру'): ProjectSchema {
  const cells = createEmptyGrid<string | null>(rows, cols, null);
  const doneMask = createEmptyGrid<boolean>(rows, cols, false);

  // Створимо гарний початковий традиційний візерунок (ромб/геометрія) у центрі для демонстрації
  const centerR = Math.floor(rows / 2);
  const centerC = Math.floor(cols / 2);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dr = Math.abs(r - centerR);
      const dc = Math.abs(c - centerC);
      const dist = dr + dc;

      if (dist === 0) {
        cells[r][c] = '83110'; // Жовте серце
      } else if (dist <= 2) {
        cells[r][c] = '93190'; // Червоне
      } else if (dist === 4 || dist === 5) {
        cells[r][c] = '23980'; // Чорний контур
      } else if (dist === 6 || dist === 7) {
        cells[r][c] = '93190'; // Червоний ромб
      } else if (dist === 9 || dist === 10) {
        cells[r][c] = '53270'; // Зелений орнамент
      }
    }
  }

  return {
    schemaVersion: 1,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rows,
    cols,
    cellSize: 20,
    paletteRef: 'preciosa-rocailles-v1',
    cells,
    doneMask,
    customColors: [],
    notes: '',
  };
}

export function validateProject(obj: unknown): { valid: boolean; error?: string; project?: ProjectSchema } {
  if (!obj || typeof obj !== 'object') {
    return { valid: false, error: 'Файл не є дійсним JSON-обʼєктом' };
  }

  const data = obj as Partial<ProjectSchema>;

  if (typeof data.rows !== 'number' || typeof data.cols !== 'number' || data.rows <= 0 || data.cols <= 0) {
    return { valid: false, error: 'Недійсні розміри схеми (rows або cols)' };
  }

  if (!Array.isArray(data.cells) || data.cells.length !== data.rows) {
    return { valid: false, error: `Кількість рядків сітки (${data.cells?.length}) не відповідає розміру (${data.rows})` };
  }

  // Normalize cells
  const normalizedCells: (string | null)[][] = [];
  for (let r = 0; r < data.rows; r++) {
    const row = data.cells[r];
    if (!Array.isArray(row)) {
      return { valid: false, error: `Рядок ${r} у сітці не є масивом` };
    }
    const normalizedRow: (string | null)[] = [];
    for (let c = 0; c < data.cols; c++) {
      const val = row[c];
      normalizedRow.push(typeof val === 'string' && val.trim() !== '' ? val : null);
    }
    normalizedCells.push(normalizedRow);
  }

  // Normalize doneMask
  const normalizedDoneMask: boolean[][] = [];
  const rawDoneMask = Array.isArray(data.doneMask) ? data.doneMask : [];
  for (let r = 0; r < data.rows; r++) {
    const row = rawDoneMask[r];
    const normalizedRow: boolean[] = [];
    for (let c = 0; c < data.cols; c++) {
      normalizedRow.push(Array.isArray(row) && Boolean(row[c]));
    }
    normalizedDoneMask.push(normalizedRow);
  }

  const project: ProjectSchema = {
    schemaVersion: Number(data.schemaVersion) || 1,
    name: typeof data.name === 'string' && data.name ? data.name : 'Схема бісеру',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rows: data.rows,
    cols: data.cols,
    cellSize: Number(data.cellSize) || 20,
    paletteRef: data.paletteRef || 'preciosa-rocailles-v1',
    cells: normalizedCells,
    doneMask: normalizedDoneMask,
    customColors: Array.isArray(data.customColors) ? (data.customColors as BeadColor[]) : [],
    notes: typeof data.notes === 'string' ? data.notes : '',
  };

  return { valid: true, project };
}

export function projectToJSON(project: ProjectSchema): string {
  const toSave = {
    ...project,
    updatedAt: new Date().toISOString(),
  };
  return JSON.stringify(toSave, null, 2);
}

export function projectFromJSON(jsonString: string): ProjectSchema {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e: unknown) {
    throw new Error(`Помилка парсингу JSON файлу: ${e instanceof Error ? e.message : 'Невідома помилка'}`);
  }

  const result = validateProject(parsed);
  if (!result.valid || !result.project) {
    throw new Error(result.error || 'Помилка валідації схеми');
  }

  return result.project;
}

// XML Export & Import
export function projectToXML(project: ProjectSchema): string {
  const escapeXml = (str: string) =>
    str.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<beadsViewerProject schemaVersion="${project.schemaVersion}">\n`;
  xml += `  <name>${escapeXml(project.name)}</name>\n`;
  xml += `  <createdAt>${project.createdAt}</createdAt>\n`;
  xml += `  <updatedAt>${new Date().toISOString()}</updatedAt>\n`;
  xml += `  <dimensions rows="${project.rows}" cols="${project.cols}" cellSize="${project.cellSize}" />\n`;
  xml += `  <paletteRef>${escapeXml(project.paletteRef)}</paletteRef>\n`;
  xml += `  <notes>${escapeXml(project.notes)}</notes>\n`;

  // Custom colors
  xml += `  <customColors>\n`;
  for (const c of project.customColors) {
    xml += `    <color code="${escapeXml(c.code)}" name="${escapeXml(c.name)}" hex="${c.hex}" category="${escapeXml(c.category)}" artNo="${escapeXml(c.artNo)}" />\n`;
  }
  xml += `  </customColors>\n`;

  // Grid cells
  xml += `  <grid>\n`;
  for (let r = 0; r < project.rows; r++) {
    for (let c = 0; c < project.cols; c++) {
      const color = project.cells[r][c];
      const isDone = project.doneMask[r][c];
      if (color !== null || isDone) {
        xml += `    <cell r="${r}" c="${c}"${color ? ` color="${escapeXml(color)}"` : ''}${isDone ? ` done="true"` : ''} />\n`;
      }
    }
  }
  xml += `  </grid>\n`;
  xml += `</beadsViewerProject>`;

  return xml;
}

export function projectFromXML(xmlString: string): ProjectSchema {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

  const parseError = xmlDoc.getElementsByTagName('parsererror');
  if (parseError.length > 0) {
    throw new Error('Помилка парсингу XML: ' + parseError[0].textContent);
  }

  const root = xmlDoc.getElementsByTagName('beadsViewerProject')[0];
  if (!root) {
    throw new Error('Недійсний формат XML: кореневий тег <beadsViewerProject> не знайдено');
  }

  const name = root.getElementsByTagName('name')[0]?.textContent || 'Імпортована схема';
  const createdAt = root.getElementsByTagName('createdAt')[0]?.textContent || new Date().toISOString();
  const notes = root.getElementsByTagName('notes')[0]?.textContent || '';
  const paletteRef = root.getElementsByTagName('paletteRef')[0]?.textContent || 'preciosa-rocailles-v1';

  const dimTag = root.getElementsByTagName('dimensions')[0];
  const rows = parseInt(dimTag?.getAttribute('rows') || '40', 10);
  const cols = parseInt(dimTag?.getAttribute('cols') || '40', 10);
  const cellSize = parseInt(dimTag?.getAttribute('cellSize') || '20', 10);

  const customColors: BeadColor[] = [];
  const colorTags = root.getElementsByTagName('color');
  for (let i = 0; i < colorTags.length; i++) {
    const el = colorTags[i];
    customColors.push({
      code: el.getAttribute('code') || '',
      name: el.getAttribute('name') || '',
      hex: el.getAttribute('hex') || '#000000',
      category: el.getAttribute('category') || 'Користувацька',
      artNo: el.getAttribute('artNo') || 'Custom',
      isCustom: true,
    });
  }

  const cells = createEmptyGrid<string | null>(rows, cols, null);
  const doneMask = createEmptyGrid<boolean>(rows, cols, false);

  const cellTags = root.getElementsByTagName('cell');
  for (let i = 0; i < cellTags.length; i++) {
    const el = cellTags[i];
    const r = parseInt(el.getAttribute('r') || '-1', 10);
    const c = parseInt(el.getAttribute('c') || '-1', 10);
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      const color = el.getAttribute('color');
      if (color) cells[r][c] = color;
      if (el.getAttribute('done') === 'true') doneMask[r][c] = true;
    }
  }

  return {
    schemaVersion: 1,
    name,
    createdAt,
    updatedAt: new Date().toISOString(),
    rows,
    cols,
    cellSize,
    paletteRef,
    cells,
    doneMask,
    customColors,
    notes,
  };
}
