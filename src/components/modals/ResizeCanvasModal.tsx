import React, { useState } from 'react';
import { ProjectSchema, SelectionRect } from '../../types/beads';
import { cropToSelection, resizeGridEdges } from '../../canvas/tools';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Crop, Maximize2, X } from 'lucide-react';

interface ResizeCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectSchema;
  onUpdateProject: (newProject: ProjectSchema) => void;
  selection: SelectionRect | null;
}

export const ResizeCanvasModal: React.FC<ResizeCanvasModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  selection,
}) => {
  const [deltaTop, setDeltaTop] = useState(0);
  const [deltaBottom, setDeltaBottom] = useState(0);
  const [deltaLeft, setDeltaLeft] = useState(0);
  const [deltaRight, setDeltaRight] = useState(0);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const targetRows = project.rows + deltaTop + deltaBottom;
  const targetCols = project.cols + deltaLeft + deltaRight;

  const handleApplyResize = () => {
    try {
      setError('');
      const resized = resizeGridEdges(project, deltaTop, deltaBottom, deltaLeft, deltaRight);
      onUpdateProject(resized);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Помилка зміни розміру');
    }
  };

  const handleCropToSelection = () => {
    if (!selection) return;
    try {
      const cropped = cropToSelection(project, selection);
      onUpdateProject(cropped);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Помилка обрізки');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-slate-800/80">
          <div className="flex items-center gap-2 text-slate-100 font-semibold">
            <Maximize2 className="w-5 h-5 text-sky-400" />
            <span>Зміна розміру полотна</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-sm">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-red-300 text-xs">
              {error}
            </div>
          )}

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700 flex justify-between items-center text-xs">
            <div>
              Поточний розмір:{' '}
              <strong className="text-slate-200">{project.cols} × {project.rows}</strong>
            </div>
            <div>
              Новий розмір:{' '}
              <strong className={targetRows < 1 || targetCols < 1 ? 'text-rose-400' : 'text-sky-400'}>
                {targetCols} × {targetRows}
              </strong>
            </div>
          </div>

          {/* Extend/Shrink per Edge Controls */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Додати / Прибрати клітинки по краях:
            </span>

            <div className="grid grid-cols-3 gap-2 items-center text-center">
              {/* Top Row */}
              <div />
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-700 space-y-1">
                <div className="flex items-center justify-center gap-1 text-slate-400 text-xs">
                  <ArrowUp className="w-3 h-3" />
                  <span>Зверху</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => setDeltaTop((d) => d - 1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 font-mono text-center font-bold text-sky-400">
                    {deltaTop > 0 ? `+${deltaTop}` : deltaTop}
                  </span>
                  <button
                    onClick={() => setDeltaTop((d) => d + 1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              <div />

              {/* Middle Row (Left, Center preview, Right) */}
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-700 space-y-1">
                <div className="flex items-center justify-center gap-1 text-slate-400 text-xs">
                  <ArrowLeft className="w-3 h-3" />
                  <span>Зліва</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => setDeltaLeft((d) => d - 1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 font-mono text-center font-bold text-sky-400">
                    {deltaLeft > 0 ? `+${deltaLeft}` : deltaLeft}
                  </span>
                  <button
                    onClick={() => setDeltaLeft((d) => d + 1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center text-slate-500 text-xs font-mono">
                Малюнок
              </div>

              <div className="bg-slate-900 p-2 rounded-lg border border-slate-700 space-y-1">
                <div className="flex items-center justify-center gap-1 text-slate-400 text-xs">
                  <ArrowRight className="w-3 h-3" />
                  <span>Справа</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => setDeltaRight((d) => d - 1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 font-mono text-center font-bold text-sky-400">
                    {deltaRight > 0 ? `+${deltaRight}` : deltaRight}
                  </span>
                  <button
                    onClick={() => setDeltaRight((d) => d + 1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Bottom Row */}
              <div />
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-700 space-y-1">
                <div className="flex items-center justify-center gap-1 text-slate-400 text-xs">
                  <ArrowDown className="w-3 h-3" />
                  <span>Знизу</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => setDeltaBottom((d) => d - 1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 font-mono text-center font-bold text-sky-400">
                    {deltaBottom > 0 ? `+${deltaBottom}` : deltaBottom}
                  </span>
                  <button
                    onClick={() => setDeltaBottom((d) => d + 1)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              <div />
            </div>
          </div>

          {/* Crop to selection button if selection active */}
          {selection && (
            <div className="pt-2 border-t border-slate-700">
              <button
                type="button"
                onClick={handleCropToSelection}
                className="w-full py-2 px-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition"
              >
                <Crop className="w-4 h-4" />
                <span>Обрізати полотно до виділеної області</span>
              </button>
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
              disabled={targetRows < 1 || targetCols < 1}
              onClick={handleApplyResize}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg font-medium transition shadow-lg shadow-sky-900/30"
            >
              Застосувати розмір
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
