import React, { useState } from 'react';
import { BeadColor } from '../../types/beads';
import { FileUp, X, Check } from 'lucide-react';

interface ImportPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportColors: (newColors: BeadColor[]) => void;
}

export const ImportPaletteModal: React.FC<ImportPaletteModalProps> = ({
  isOpen,
  onClose,
  onImportColors,
}) => {
  const [importedColors, setImportedColors] = useState<BeadColor[]>([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setInfo('');

    try {
      const text = await file.text();
      const parsedColors: BeadColor[] = [];

      if (file.name.endsWith('.json')) {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          for (const item of json) {
            if (item.colors && Array.isArray(item.colors)) {
              // Category object
              for (const col of item.colors) {
                if (col.code && col.hex) {
                  parsedColors.push({
                    code: String(col.code),
                    hex: col.hex,
                    name: col.name || `Preciosa ${col.code}`,
                    category: item.category || 'Імпортована',
                    artNo: item.artNo || '331 19 001',
                    isCustom: true,
                  });
                }
              }
            } else if (item.code && item.hex) {
              // Flat color item
              parsedColors.push({
                code: String(item.code),
                hex: item.hex,
                name: item.name || `Колір ${item.code}`,
                category: item.category || 'Імпортована',
                artNo: item.artNo || 'Custom',
                isCustom: true,
              });
            }
          }
        } else if (typeof json === 'object' && json !== null) {
          if (json.colors && Array.isArray(json.colors)) {
            for (const col of json.colors) {
              if (col.code && col.hex) {
                parsedColors.push({
                  code: String(col.code),
                  hex: col.hex,
                  name: col.name || `Preciosa ${col.code}`,
                  category: json.category || 'Імпортована',
                  artNo: json.artNo || '331 19 001',
                  isCustom: true,
                });
              }
            }
          }
        }
      } else if (file.name.endsWith('.csv')) {
        // Parse CSV
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
          if (!line.trim() || line.startsWith('#') || line.toLowerCase().includes('код')) continue;
          const parts = line.split(/[;,]/).map((p) => p.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 2) {
            // Check if hex is in part 1 or part 3
            let code = parts[0];
            let hex = '#888888';
            let name = `Колір ${code}`;
            let cat = 'Імпортована';
            let art = 'Custom';

            for (const p of parts) {
              if (/^#[0-9a-fA-F]{6}$/.test(p) || /^#[0-9a-fA-F]{3}$/.test(p)) {
                hex = p;
              }
            }

            if (parts.length >= 4) {
              art = parts[0];
              code = parts[1];
              name = parts[2];
            }

            parsedColors.push({
              code,
              name,
              hex,
              category: cat,
              artNo: art,
              isCustom: true,
            });
          }
        }
      }

      if (parsedColors.length === 0) {
        throw new Error('У файлі не знайдено валідних кодів і кольорів бісеру');
      }

      setImportedColors(parsedColors);
      setInfo(`Успішно знайдено ${parsedColors.length} кольорів`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Помилка при читанні файлу палітри');
    }
  };

  const handleApply = () => {
    onImportColors(importedColors);
    setImportedColors([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-slate-800/80">
          <div className="flex items-center gap-2 text-slate-100 font-semibold">
            <FileUp className="w-5 h-5 text-sky-400" />
            <span>Імпорт палітри з файлу (JSON / CSV)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          <p className="text-slate-300 text-xs leading-relaxed">
            Виберіть файл палітри у форматі <code className="bg-slate-900 px-1 py-0.5 rounded text-sky-300">.json</code> або{' '}
            <code className="bg-slate-900 px-1 py-0.5 rounded text-sky-300">.csv</code>.
            Застосунок додасть нові кольори до активного каталогу.
          </p>

          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-600 hover:border-sky-500 rounded-xl cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition">
            <FileUp className="w-8 h-8 text-sky-400 mb-2" />
            <span className="text-slate-200 font-medium">Натисніть для вибору файлу</span>
            <span className="text-xs text-slate-400 mt-1">.json, .csv</span>
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-red-300 text-xs">
              {error}
            </div>
          )}

          {info && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{info}</span>
            </div>
          )}

          {importedColors.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Попередній перегляд ({importedColors.length} кольорів)
              </span>
              <div className="max-h-48 overflow-y-auto bg-slate-900/70 rounded-lg p-2 border border-slate-700 space-y-1">
                {importedColors.slice(0, 30).map((col, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs py-1 px-2 hover:bg-slate-800 rounded">
                    <div
                      className="w-4 h-4 rounded border border-slate-600 flex-shrink-0"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span className="font-mono text-sky-300 font-bold">{col.code}</span>
                    <span className="text-slate-300 truncate">{col.name}</span>
                    <span className="text-slate-400 text-[10px] ml-auto">{col.category}</span>
                  </div>
                ))}
                {importedColors.length > 30 && (
                  <div className="text-center text-xs text-slate-400 py-1">
                    ...та ще {importedColors.length - 30} кольорів
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition"
            >
              Скасувати
            </button>
            <button
              type="button"
              disabled={importedColors.length === 0}
              onClick={handleApply}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition shadow-lg shadow-sky-900/30"
            >
              Додати до палітри
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
