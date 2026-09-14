import React, { useEffect, useState } from 'react';
import { ProjectSchema } from '../../types/beads';
import { ExportImageOptions, exportProjectToImage } from '../../utils/exportImage';
import { Download, Image as ImageIcon, X } from 'lucide-react';

interface ExportImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectSchema;
}

export const ExportImageModal: React.FC<ExportImageModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [options, setOptions] = useState<ExportImageOptions>({
    cellSize: 20,
    beadRatio: '1.6x2.2',
    renderStyle: 'bead',
    showGrid: true,
    showRulers: true,
    showNumbers: false,
    includeLegend: true,
    backgroundColor: '#ffffff',
    format: 'png',
  });

  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setIsGenerating(true);
    const timer = setTimeout(() => {
      try {
        const url = exportProjectToImage(project, options);
        setPreviewDataUrl(url);
      } catch (e) {
        console.error('Помилка генерації зображення:', e);
      } finally {
        setIsGenerating(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, project, options]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!previewDataUrl) return;
    const a = document.createElement('a');
    a.href = previewDataUrl;
    const ext = options.format === 'jpeg' ? 'jpg' : 'png';
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9а-яіїєґ_]+/gi, '_')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onClose();
  };

  const estimatedWidth = project.cols * options.cellSize;
  const estimatedHeight = project.rows * options.cellSize;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-slate-800/80">
          <div className="flex items-center gap-2 text-slate-100 font-semibold">
            <ImageIcon className="w-5 h-5 text-sky-400" />
            <span>Експорт схеми в зображення (PNG / JPEG)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 text-sm flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Options Column */}
            <div className="space-y-4">
              {/* Render Style */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5 text-xs">
                  Стиль рендерингу бісеру:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOptions((o) => ({ ...o, renderStyle: 'bead' }))}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition ${
                      options.renderStyle === 'bead'
                        ? 'bg-sky-600 border-sky-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    ● Реалістичний бісер
                  </button>
                  <button
                    type="button"
                    onClick={() => setOptions((o) => ({ ...o, renderStyle: 'square' }))}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition ${
                      options.renderStyle === 'square'
                        ? 'bg-sky-600 border-sky-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    ■ Квадратні клітинки
                  </button>
                </div>
              </div>

              {/* Cell Size */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5 text-xs">
                  Розмір клітинки: <strong>{options.cellSize} px</strong> (полотно ~{estimatedWidth}×{estimatedHeight}px)
                </label>
                <div className="flex items-center gap-2">
                  {[8, 16, 20, 28, 36].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setOptions((o) => ({ ...o, cellSize: size }))}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition ${
                        options.cellSize === size
                          ? 'bg-sky-600 border-sky-500 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              </div>

              {/* Bead Aspect Ratio */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5 text-xs">
                  Пропорція форми бісеринки:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setOptions((o) => ({ ...o, beadRatio: '1.6x2.2' }))}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition ${
                      options.beadRatio === '1.6x2.2'
                        ? 'bg-sky-600 border-sky-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    1.6×2.2 (Боком)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOptions((o) => ({ ...o, beadRatio: '2.2x1.6' }))}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition ${
                      options.beadRatio === '2.2x1.6'
                        ? 'bg-sky-600 border-sky-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    2.2×1.6
                  </button>
                  <button
                    type="button"
                    onClick={() => setOptions((o) => ({ ...o, beadRatio: '1x1' }))}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition ${
                      options.beadRatio === '1x1'
                        ? 'bg-sky-600 border-sky-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    1:1
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-700">
                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.showRulers}
                    onChange={(e) => setOptions((o) => ({ ...o, showRulers: e.target.checked }))}
                    className="rounded bg-slate-800 border-slate-600 text-sky-500 focus:ring-0"
                  />
                  <span>Відображати нумерацію рядків і стовпчиків по периметру</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.showGrid}
                    onChange={(e) => setOptions((o) => ({ ...o, showGrid: e.target.checked }))}
                    className="rounded bg-slate-800 border-slate-600 text-sky-500 focus:ring-0"
                  />
                  <span>Відображати лінії сітки (розмітка 5/10 клітинок)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.showNumbers}
                    onChange={(e) => setOptions((o) => ({ ...o, showNumbers: e.target.checked }))}
                    className="rounded bg-slate-800 border-slate-600 text-sky-500 focus:ring-0"
                  />
                  <span>Друкувати номери кольорів у клітинках (для паперових схем)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeLegend}
                    onChange={(e) => setOptions((o) => ({ ...o, includeLegend: e.target.checked }))}
                    className="rounded bg-slate-800 border-slate-600 text-sky-500 focus:ring-0"
                  />
                  <span>Додати легенду кольорів зі зразками та кількістю знизу</span>
                </label>
              </div>

              {/* Background & Format */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1 text-xs">
                    Фон підкладки:
                  </label>
                  <select
                    value={options.backgroundColor}
                    onChange={(e) => setOptions((o) => ({ ...o, backgroundColor: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="#ffffff">Білий (White)</option>
                    <option value="#f8fafc">Світло-сірий (Paper)</option>
                    <option value="#0f172a">Темний (Slate)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1 text-xs">
                    Формат файлу:
                  </label>
                  <select
                    value={options.format}
                    onChange={(e) => setOptions((o) => ({ ...o, format: e.target.value as 'png' | 'jpeg' }))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="png">PNG (найвища чіткість)</option>
                    <option value="jpeg">JPEG (компактний розмір)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Live Preview Column */}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Попередній перегляд:
              </span>
              <div className="flex-1 min-h-[220px] bg-slate-950 rounded-xl border border-slate-700 flex items-center justify-center p-3 overflow-hidden">
                {isGenerating ? (
                  <div className="text-xs text-slate-400 animate-pulse">Генерація зображення...</div>
                ) : previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Схема експорту"
                    className="max-h-[260px] max-w-full object-contain rounded shadow"
                  />
                ) : (
                  <div className="text-xs text-slate-500">Немає превʼю</div>
                )}
              </div>
            </div>
          </div>

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
              onClick={handleDownload}
              disabled={!previewDataUrl || isGenerating}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg font-medium transition shadow-lg shadow-sky-900/30 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Завантажити {options.format.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
