import React, { useMemo, useState } from 'react';
import { ProjectSchema } from '../../types/beads';
import { calculateColorCounts, exportBeadsCountToCsv } from '../../utils/exportCsv';
import { ArrowUpDown, Download, Eye, EyeOff, Hash, CheckCircle2 } from 'lucide-react';

interface ColorCountTableProps {
  project: ProjectSchema;
  focusColorCode: string | null;
  onSetFocusColor: (code: string | null) => void;
  onSelectColor: (code: string) => void;
}

type SortField = 'count' | 'code' | 'done' | 'name';

export const ColorCountTable: React.FC<ColorCountTableProps> = ({
  project,
  focusColorCode,
  onSetFocusColor,
  onSelectColor,
}) => {
  const [sortField, setSortField] = useState<SortField>('count');
  const [sortAsc, setSortAsc] = useState(false);

  // Calculate counts dynamically
  const rawItems = useMemo(
    () => calculateColorCounts(project, project.customColors),
    [project]
  );

  const totalBeads = useMemo(
    () => rawItems.reduce((acc, it) => acc + it.count, 0),
    [rawItems]
  );

  const totalDone = useMemo(
    () => rawItems.reduce((acc, it) => acc + it.doneCount, 0),
    [rawItems]
  );

  const overallProgress = totalBeads > 0 ? (totalDone / totalBeads) * 100 : 0;

  // Sorted items
  const sortedItems = useMemo(() => {
    return [...rawItems].sort((a, b) => {
      let diff = 0;
      if (sortField === 'count') {
        diff = a.count - b.count;
      } else if (sortField === 'code') {
        diff = a.color.code.localeCompare(b.color.code);
      } else if (sortField === 'done') {
        diff = a.doneCount - b.doneCount;
      } else if (sortField === 'name') {
        diff = a.color.name.localeCompare(b.color.name);
      }
      return sortAsc ? diff : -diff;
    });
  }, [rawItems, sortField, sortAsc]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'code' || field === 'name');
    }
  };

  const handleExportCsv = () => {
    exportBeadsCountToCsv(rawItems, project.name);
  };

  return (
    <div className="bg-slate-900 border-l border-slate-800 flex flex-col h-full select-none text-xs w-80">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-sky-400" />
          <h2 className="font-semibold text-slate-100 text-sm">Підрахунок бісеру</h2>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={rawItems.length === 0}
          title="Завантажити список закупівлі у CSV"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white transition flex items-center gap-1 text-xs"
        >
          <Download className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px] font-medium">CSV</span>
        </button>
      </div>

      {/* Crafting Progress Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Прогрес плетіння:
          </span>
          <span className="font-mono font-bold text-emerald-400">
            {overallProgress.toFixed(1)}%
          </span>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-sky-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Всього: <strong className="text-slate-200">{totalBeads}</strong> бісерин</span>
          <span>Вплетено: <strong className="text-emerald-400">{totalDone}</strong></span>
          <span>Залишок: <strong className="text-amber-400">{totalBeads - totalDone}</strong></span>
        </div>
      </div>

      {/* Sorting Bar */}
      <div className="grid grid-cols-12 px-3 py-2 bg-slate-950/70 border-b border-slate-800 text-[11px] text-slate-400 font-medium">
        <div
          onClick={() => toggleSort('code')}
          className="col-span-5 cursor-pointer hover:text-slate-200 flex items-center gap-1"
        >
          <span>Колір / Код</span>
          {sortField === 'code' && <ArrowUpDown className="w-3 h-3 text-sky-400" />}
        </div>
        <div
          onClick={() => toggleSort('count')}
          className="col-span-3 text-right cursor-pointer hover:text-slate-200 flex items-center justify-end gap-1"
        >
          <span>К-сть</span>
          {sortField === 'count' && <ArrowUpDown className="w-3 h-3 text-sky-400" />}
        </div>
        <div
          onClick={() => toggleSort('done')}
          className="col-span-2 text-right cursor-pointer hover:text-slate-200 flex items-center justify-end gap-1"
        >
          <span>Зробл.</span>
          {sortField === 'done' && <ArrowUpDown className="w-3 h-3 text-sky-400" />}
        </div>
        <div className="col-span-2 text-center">
          <span>Фокус</span>
        </div>
      </div>

      {/* List of Colors */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
        {sortedItems.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            Схема порожня.
            <br />
            Намалюйте щось олівцем!
          </div>
        ) : (
          sortedItems.map((item) => {
            const isFocused = focusColorCode === item.color.code;

            return (
              <div
                key={item.color.code}
                onClick={() => onSelectColor(item.color.code)}
                className={`grid grid-cols-12 px-3 py-2 items-center text-xs transition cursor-pointer hover:bg-slate-800/60 ${
                  isFocused ? 'bg-amber-500/10 border-l-2 border-amber-400' : ''
                }`}
              >
                {/* Swatch + Code + Name */}
                <div className="col-span-5 flex items-center gap-2 overflow-hidden">
                  <div
                    className="w-4 h-4 rounded-full border border-black/30 flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: item.color.hex }}
                  />
                  <div className="truncate">
                    <div className="font-mono font-bold text-slate-200 text-[11px] leading-tight">
                      {item.color.code}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate leading-tight">
                      {item.color.name}
                    </div>
                  </div>
                </div>

                {/* Total Count */}
                <div className="col-span-3 text-right font-mono font-semibold text-slate-200">
                  {item.count}{' '}
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({item.percentage.toFixed(0)}%)
                  </span>
                </div>

                {/* Done Count */}
                <div className="col-span-2 text-right font-mono text-emerald-400 font-medium">
                  {item.doneCount}
                </div>

                {/* Focus Toggle */}
                <div className="col-span-2 flex justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetFocusColor(isFocused ? null : item.color.code);
                    }}
                    title={
                      isFocused
                        ? 'Вимкнути фокус'
                        : 'Ізолювати цей колір (інші кольори стануть напівпрозорими)'
                    }
                    className={`p-1 rounded transition ${
                      isFocused
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'
                    }`}
                  >
                    {isFocused ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
