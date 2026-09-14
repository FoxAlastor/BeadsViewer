import React, { useMemo, useState } from 'react';
import { BeadColor } from '../../types/beads';
import { PRECIOSA_CATALOG } from '../../data/preciosaDefaultPalette';
import { Eye, EyeOff, FileUp, Pencil, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { AddCustomColorModal } from './AddCustomColorModal';
import { ImportPaletteModal } from './ImportPaletteModal';
import { EditCustomColorModal } from './EditCustomColorModal';

interface PalettePanelProps {
  activeColorCode: string;
  onSelectColor: (code: string) => void;
  customColors: BeadColor[];
  onAddCustomColor: (color: BeadColor) => void;
  onUpdateCustomColor: (color: BeadColor) => void;
  onDeleteCustomColor: (code: string) => void;
  onImportColors: (colors: BeadColor[]) => void;
  focusColorCode: string | null;
  onSetFocusColor: (code: string | null) => void;
}

export const PalettePanel: React.FC<PalettePanelProps> = ({
  activeColorCode,
  onSelectColor,
  customColors,
  onAddCustomColor,
  onUpdateCustomColor,
  onDeleteCustomColor,
  onImportColors,
  focusColorCode,
  onSetFocusColor,
}) => {
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<BeadColor | null>(null);

  // Group colors by category
  const groupedCategories = useMemo(() => {
    const list: Array<{ title: string; artNo: string; colors: BeadColor[] }> = [];

    // 1. Custom colors category (if any)
    if (customColors.length > 0) {
      list.push({
        title: 'Користувацькі кольори',
        artNo: 'Custom',
        colors: customColors,
      });
    }

    // 2. Standard Preciosa categories
    for (const cat of PRECIOSA_CATALOG) {
      list.push({
        title: cat.category,
        artNo: cat.artNo,
        colors: cat.colors.map((c) => ({
          code: c.code,
          name: c.name || `Preciosa ${c.code}`,
          hex: c.hex,
          category: cat.category,
          artNo: cat.artNo,
        })),
      });
    }

    // Filter by search query
    if (!search.trim()) return list;

    const query = search.toLowerCase().trim();
    return list
      .map((cat) => {
        const matchesCategory = cat.title.toLowerCase().includes(query) || cat.artNo.toLowerCase().includes(query);
        const filteredColors = cat.colors.filter(
          (c) =>
            c.code.toLowerCase().includes(query) ||
            c.name.toLowerCase().includes(query) ||
            matchesCategory
        );
        return {
          ...cat,
          colors: filteredColors,
        };
      })
      .filter((cat) => cat.colors.length > 0);
  }, [customColors, search]);

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full flex-shrink-0 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <h2 className="font-semibold text-slate-100 text-sm">Палітра Preciosa</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsImportOpen(true)}
            title="Імпортувати палітру (JSON/CSV)"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs flex items-center gap-1"
          >
            <FileUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            title="Додати власний колір"
            className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition text-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Focus Mode Banner (if active) */}
      {focusColorCode && (
        <div className="px-3 py-2 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-300">
            <Eye className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>
              Фокус на кольорі: <strong>{focusColorCode}</strong>
            </span>
          </div>
          <button
            onClick={() => onSetFocusColor(null)}
            className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 transition text-[11px]"
          >
            Скинути
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="p-3 border-b border-slate-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Пошук за кодом, назвою або ART..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Categories & Color Swatches List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {groupedCategories.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Кольорів не знайдено
          </div>
        ) : (
          groupedCategories.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1">
                <span className="truncate">{group.title}</span>
                <span className="text-slate-600 font-mono text-[10px]">{group.artNo}</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {group.colors.map((color) => {
                  const isSelected = activeColorCode === color.code;
                  const isFocused = focusColorCode === color.code;

                  return (
                    <div
                      key={color.code}
                      onClick={() => onSelectColor(color.code)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        onSetFocusColor(isFocused ? null : color.code);
                      }}
                      title={`${color.code} - ${color.name}\nКлік: вибрати для малювання\nПравий клік: фокус на цьому кольорі`}
                      className={`group relative p-1 rounded-lg border cursor-pointer transition flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'bg-slate-800 border-sky-500 shadow-md shadow-sky-500/20 ring-1 ring-sky-500'
                          : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      {/* Bead Color Preview (Realistic Circular Bead Swatch) */}
                      <div className="relative w-8 h-8 rounded-full shadow-inner flex items-center justify-center">
                        <div
                          className="w-full h-full rounded-full border border-black/20"
                          style={{
                            backgroundColor: color.hex,
                            backgroundImage:
                              'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.1) 30%, transparent 60%, rgba(0,0,0,0.3) 100%)',
                          }}
                        />
                        {/* Bead Hole */}
                        <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-900/50" />

                        {color.isCustom && (
                          <div className="absolute -top-1 -left-1 hidden group-hover:flex gap-0.5">
                            <button onClick={(e) => { e.stopPropagation(); setEditingColor(color); }} title="Редагувати колір" className="p-1 rounded-full bg-sky-600 text-white shadow hover:bg-sky-500">
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDeleteCustomColor(color.code); }} title="Видалити колір" className="p-1 rounded-full bg-rose-600 text-white shadow hover:bg-rose-500">
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}

                        {/* Focus eye icon if focused */}
                        {isFocused && (
                          <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow">
                            <Eye className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>

                      {/* Code */}
                      <span
                        className={`text-[10px] font-mono leading-none tracking-tight font-semibold ${
                          isSelected ? 'text-sky-300' : 'text-slate-300'
                        }`}
                      >
                        {color.code}
                      </span>

                      {/* Quick focus hover trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetFocusColor(isFocused ? null : color.code);
                        }}
                        title={isFocused ? 'Вимкнути фокус' : 'Фокусувати цей колір на схемі'}
                        className={`absolute top-0.5 right-0.5 p-0.5 rounded bg-slate-900/80 text-slate-400 hover:text-amber-400 transition opacity-0 group-hover:opacity-100 ${
                          isFocused ? '!opacity-100 !text-amber-400' : ''
                        }`}
                      >
                        {isFocused ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <AddCustomColorModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddColor={onAddCustomColor}
      />
      <ImportPaletteModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportColors={onImportColors}
      />
      <EditCustomColorModal
        color={editingColor}
        onClose={() => setEditingColor(null)}
        onSave={onUpdateCustomColor}
      />
    </aside>
  );
};
