import React from 'react';
import { ProjectSchema, ToolType } from '../../types/beads';
import { Point } from '../../canvas/tools';
import { findColorByCode } from '../../data/preciosaDefaultPalette';

interface StatusBarProps {
  project: ProjectSchema;
  cursorCell: Point | null;
  activeTool: ToolType;
  zoom: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  project,
  cursorCell,
  activeTool,
  zoom,
}) => {
  let cellInfo = 'Поза полотном';
  let currentColorHex = null;

  if (
    cursorCell &&
    cursorCell.r >= 0 &&
    cursorCell.r < project.rows &&
    cursorCell.c >= 0 &&
    cursorCell.c < project.cols
  ) {
    const code = project.cells[cursorCell.r][cursorCell.c];
    const isDone = project.doneMask[cursorCell.r][cursorCell.c];
    const color = findColorByCode(code, project.customColors);
    currentColorHex = color?.hex || null;

    cellInfo = `Рядок: ${cursorCell.r + 1}, Колонка: ${cursorCell.c + 1} • ${
      code ? `Колір ${code} (${color?.name})` : 'Порожня клітинка'
    } ${isDone ? '✓ [Вплетено]' : ''}`;
  }

  const toolHints: Record<ToolType, string> = {
    pencil: 'Олівець: ЛКМ малювати, Shift+ЛКМ позначити як виконано',
    eraser: 'Гумка: ЛКМ очистити клітинку',
    bucket: 'Заливка: ЛКМ зафарбувати суміжну область',
    line: 'Лінія: затисніть ЛКМ та протягніть пряму лінію',
    rectangle: 'Квадрат / Прямокутник: затисніть ЛКМ та розтягніть форму',
    circle: 'Коло / Овал: затисніть ЛКМ та розтягніть коло',
    diamond: 'Ромб: затисніть ЛКМ та розтягніть орнаментний ромб',
    triangle: 'Трикутник: затисніть ЛКМ та розтягніть трикутник',
    star: 'Зірка: затисніть ЛКМ та розтягніть 5-кінцеву зірку',
    heart: 'Сердечко: затисніть ЛКМ та розтягніть сердечко',
    flower: "Квітка: затисніть ЛКМ та розтягніть 5-пелюсткову квітку з серцевиною",
    picker: 'Піпетка: ЛКМ обрати колір зі схеми',
    select: 'Виділення: виділіть прямокутну область для заливки або обрізки',
    done: 'Позначка виконання: ЛКМ відмітити бісерину як вплетену',
    hand: 'Рука: ЛКМ для панорамування (або затисніть Space/середню кнопку)',
  };

  return (
    <footer className="h-7 bg-slate-950 border-t border-slate-800 px-3 flex items-center justify-between text-[11px] text-slate-400 select-none flex-shrink-0">
      {/* Left: Tool Hint & Active coordinates */}
      <div className="flex items-center gap-3">
        <span className="text-slate-300 font-medium">
          {toolHints[activeTool] || ''}
        </span>
        <span className="text-slate-600">|</span>
        <div className="flex items-center gap-1.5">
          {currentColorHex && (
            <div
              className="w-3 h-3 rounded-full border border-black/40 flex-shrink-0"
              style={{ backgroundColor: currentColorHex }}
            />
          )}
          <span className="font-mono text-slate-300">{cellInfo}</span>
        </div>
      </div>

      {/* Right: Dimensions & Scale */}
      <div className="flex items-center gap-4">
        <span>
          Розмір: <strong className="text-slate-200">{project.cols} × {project.rows}</strong> клітинок
        </span>
        <span className="text-slate-600">|</span>
        <span>
          Масштаб: <strong className="text-slate-200">{Math.round(zoom * 100)}%</strong>
        </span>
      </div>
    </footer>
  );
};
