import React from 'react';
import { BeadColor, SelectionRect, ToolType, ViewOptions } from '../../types/beads';
import {
  CheckSquare,
  Circle,
  Crop,
  Diamond,
  Eraser,
  Eye,
  EyeOff,
  Flower2,
  Grid,
  Hand,
  Hash,
  Heart,
  Minus,
  PaintBucket,
  Pencil,
  Pipette,
  Plus,
  Ruler,
  Scan,
  Square,
  Star,
  Trash2,
  Triangle,
} from 'lucide-react';

interface ToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  activeColor: BeadColor;
  shapeFilled: boolean;
  onToggleShapeFilled: () => void;
  view: ViewOptions;
  onChangeView: (updater: (prev: ViewOptions) => ViewOptions) => void;
  selection: SelectionRect | null;
  onFillSelection: () => void;
  onClearSelection: () => void;
  onCropToSelection: () => void;
  onClearActiveSelection: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  activeColor,
  shapeFilled,
  onToggleShapeFilled,
  view,
  onChangeView,
  selection,
  onFillSelection,
  onClearSelection,
  onCropToSelection,
  onClearActiveSelection,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  const primaryTools: Array<{ id: ToolType; label: string; icon: React.ReactNode; shortcut: string }> = [
    { id: 'pencil', label: 'Олівець', icon: <Pencil className="w-3.5 h-3.5" />, shortcut: 'B' },
    { id: 'eraser', label: 'Гумка', icon: <Eraser className="w-3.5 h-3.5" />, shortcut: 'E' },
    { id: 'bucket', label: 'Заливка', icon: <PaintBucket className="w-3.5 h-3.5" />, shortcut: 'G' },
    { id: 'picker', label: 'Піпетка', icon: <Pipette className="w-3.5 h-3.5" />, shortcut: 'I' },
    { id: 'select', label: 'Виділення прямокутником', icon: <Scan className="w-3.5 h-3.5" />, shortcut: 'M' },
    { id: 'done', label: 'Позначити виконано', icon: <CheckSquare className="w-3.5 h-3.5" />, shortcut: 'D' },
    { id: 'hand', label: 'Рука (Панорамування)', icon: <Hand className="w-3.5 h-3.5" />, shortcut: 'H' },
  ];

  const shapeTools: Array<{ id: ToolType; label: string; icon: React.ReactNode }> = [
    { id: 'line', label: 'Лінія (L)', icon: <Minus className="w-3.5 h-3.5 -rotate-45" /> },
    { id: 'rectangle', label: 'Квадрат / Прямокутник', icon: <Square className="w-3.5 h-3.5" /> },
    { id: 'circle', label: 'Коло / Овал', icon: <Circle className="w-3.5 h-3.5" /> },
    { id: 'diamond', label: 'Ромб', icon: <Diamond className="w-3.5 h-3.5" /> },
    { id: 'triangle', label: 'Трикутник', icon: <Triangle className="w-3.5 h-3.5" /> },
    { id: 'star', label: 'Зірка (5-кінцева)', icon: <Star className="w-3.5 h-3.5" /> },
    { id: 'heart', label: 'Сердечко', icon: <Heart className="w-3.5 h-3.5" /> },
    { id: 'flower', label: "П'ятипелюсткова квітка", icon: <Flower2 className="w-3.5 h-3.5" /> },
  ];

  const isCurrentToolShape = shapeTools.some((s) => s.id === activeTool);

  return (
    <div className="h-12 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between select-none text-xs flex-shrink-0">
      {/* Left: Tools & Active Color */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        {/* Active Color Swatch */}
        <div
          title={`Активний колір: ${activeColor.code} - ${activeColor.name}`}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-700 mr-0.5 flex-shrink-0"
        >
          <div
            className="w-4 h-4 rounded-full border border-black/30 shadow-inner flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: activeColor.hex }}
          >
            <div className="w-1 h-1 rounded-full bg-slate-900/50" />
          </div>
          <span className="font-mono font-bold text-slate-200 text-xs">{activeColor.code}</span>
        </div>

        {/* Primary Tool buttons */}
        <div className="flex items-center bg-slate-950/60 p-0.5 rounded-lg border border-slate-800 gap-0.5 flex-shrink-0">
          {primaryTools.map((t) => {
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTool(t.id)}
                title={`${t.label} (${t.shortcut})`}
                className={`p-1.5 rounded-md transition flex items-center justify-center ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {t.icon}
              </button>
            );
          })}
        </div>

        {/* Shape tools group */}
        <div className="flex items-center bg-slate-950/60 p-0.5 rounded-lg border border-slate-800 gap-0.5 flex-shrink-0">
          {shapeTools.map((t) => {
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTool(t.id)}
                title={t.label}
                className={`p-1.5 rounded-md transition flex items-center justify-center ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {t.icon}
              </button>
            );
          })}

          {/* Outline vs Filled toggle for shapes */}
          {isCurrentToolShape && activeTool !== 'line' && (
            <button
              onClick={onToggleShapeFilled}
              title={shapeFilled ? 'Режим: Заповнена фігура' : 'Режим: Тільки контур'}
              className={`ml-1 px-1.5 py-1 rounded text-[10px] font-semibold transition ${
                shapeFilled
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {shapeFilled ? '■ Заливка' : '□ Контур'}
            </button>
          )}
        </div>

        {/* Selection actions bar if selection exists */}
        {selection && (
          <div className="flex items-center bg-sky-950/40 border border-sky-600/40 rounded-lg p-1 gap-1 text-[11px] animate-in fade-in">
            <span className="text-sky-300 font-mono px-1">
              {Math.abs(selection.endC - selection.startC) + 1}×
              {Math.abs(selection.endR - selection.startR) + 1}
            </span>
            <button
              onClick={onFillSelection}
              title="Залити виділення активним кольором"
              className="px-2 py-0.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium transition"
            >
              Залити
            </button>
            <button
              onClick={onClearSelection}
              title="Очистити клітинки у виділенні"
              className="p-1 text-slate-300 hover:text-rose-400 rounded transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onCropToSelection}
              title="Обрізати полотно до виділення"
              className="p-1 text-slate-300 hover:text-amber-400 rounded transition"
            >
              <Crop className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClearActiveSelection}
              title="Зняти виділення (Esc)"
              className="px-1 text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Right: View & Crafting Toggles */}
      <div className="flex items-center gap-2">
        {/* Bead Aspect Ratio Switcher (1.6x2.2, 2.2x1.6, 1:1) */}
        <div className="flex items-center bg-slate-950/60 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => onChangeView((v) => ({ ...v, beadRatio: '1.6x2.2' }))}
            title="Розмір бісеру боком (1.6 × 2.2 мм — як під час плетіння на станку/мозаїкою)"
            className={`px-2 py-1 rounded-md transition font-medium ${
              view.beadRatio === '1.6x2.2'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1.6×2.2 (Боком)
          </button>
          <button
            onClick={() => onChangeView((v) => ({ ...v, beadRatio: '2.2x1.6' }))}
            title="Розмір бісеру сторч (2.2 × 1.6 мм)"
            className={`px-1.5 py-1 rounded-md transition font-medium ${
              view.beadRatio === '2.2x1.6'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2.2×1.6
          </button>
          <button
            onClick={() => onChangeView((v) => ({ ...v, beadRatio: '1x1' }))}
            title="Квадратні клітинки 1:1"
            className={`px-1.5 py-1 rounded-md transition font-medium ${
              view.beadRatio === '1x1'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1:1
          </button>
        </div>

        {/* Style switch: Beads vs Squares */}
        <div className="flex items-center bg-slate-950/60 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => onChangeView((v) => ({ ...v, renderStyle: 'bead' }))}
            title="Реалістичний вигляд бісеринок з відблиском"
            className={`px-2 py-1 rounded-md transition font-medium ${
              view.renderStyle === 'bead'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ● Бісер
          </button>
          <button
            onClick={() => onChangeView((v) => ({ ...v, renderStyle: 'square' }))}
            title="Квадратні піксельні клітинки"
            className={`px-2 py-1 rounded-md transition font-medium ${
              view.renderStyle === 'square'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ■ Сітка
          </button>
        </div>

        {/* Rulers / Numbers toggle */}
        <button
          onClick={() => onChangeView((v) => ({ ...v, showRulers: !v.showRulers }))}
          title={view.showRulers ? 'Приховати нумерацію рядків і стовпчиків' : 'Показати нумерацію рядків і стовпчиків'}
          className={`flex items-center gap-1.5 p-1.5 px-2 rounded-lg border transition ${
            view.showRulers
              ? 'bg-slate-800 border-slate-700 text-sky-400'
              : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          <Ruler className="w-4 h-4" />
          <span className="text-[11px] hidden xl:inline">Нумерація</span>
        </button>

        {/* Grid lines toggle */}
        <button
          onClick={() => onChangeView((v) => ({ ...v, showGrid: !v.showGrid }))}
          title={view.showGrid ? 'Вимкнути сітку' : 'Увімкнути розмітку сітки'}
          className={`p-1.5 rounded-lg border transition ${
            view.showGrid
              ? 'bg-slate-800 border-slate-700 text-sky-400'
              : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Numbers inside cells toggle */}
        <button
          onClick={() => onChangeView((v) => ({ ...v, showNumbers: !v.showNumbers }))}
          title={view.showNumbers ? 'Приховати коди на клітинках' : 'Показувати коди кольорів на клітинках'}
          className={`p-1.5 rounded-lg border transition ${
            view.showNumbers
              ? 'bg-slate-800 border-slate-700 text-sky-400'
              : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          <Hash className="w-4 h-4" />
        </button>

        {/* Done-mask Visibility Toggle ("Приховати позначки виконано") */}
        <button
          onClick={() => onChangeView((v) => ({ ...v, showDoneMask: !v.showDoneMask }))}
          title={
            view.showDoneMask
              ? 'Приховати позначки "зроблено" (дивитись чистий малюнок)'
              : 'Показати позначки "зроблено"'
          }
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition ${
            view.showDoneMask
              ? 'bg-emerald-950/50 border-emerald-600/50 text-emerald-300'
              : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span className="text-[11px] hidden sm:inline">Позначки</span>
        </button>

        {/* Only Incomplete Toggle ("Показати тільки не завершене") */}
        <button
          onClick={() => onChangeView((v) => ({ ...v, onlyIncomplete: !v.onlyIncomplete }))}
          title={
            view.onlyIncomplete
              ? 'Показати всю схему'
              : 'Тільки незавершені (приховати/затемнити вже вплетені)'
          }
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition ${
            view.onlyIncomplete
              ? 'bg-amber-950/50 border-amber-600/50 text-amber-300'
              : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          {view.onlyIncomplete ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span className="text-[11px] hidden md:inline">Тільки незавершені</span>
        </button>

        {/* Zoom controls */}
        <div className="flex items-center bg-slate-950/60 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={onZoomOut}
            title="Зменшити масштаб (Ctrl + -)"
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetZoom}
            title="Скинути зум (Ctrl + 0)"
            className="px-2 py-0.5 font-mono text-[11px] text-slate-300 hover:text-white"
          >
            {Math.round(view.zoom * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            title="Збільшити масштаб (Ctrl + +)"
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
