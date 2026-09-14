import React, { useEffect, useState } from 'react';
import { AutosaveSlot, ProjectSchema } from '../../types/beads';
import { getAutosaveSlots } from '../../utils/storage';
import { Clock, History, RotateCcw, X } from 'lucide-react';

interface AutosaveHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreProject: (project: ProjectSchema) => void;
}

export const AutosaveHistoryModal: React.FC<AutosaveHistoryModalProps> = ({
  isOpen,
  onClose,
  onRestoreProject,
}) => {
  const [slots, setSlots] = useState<AutosaveSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    getAutosaveSlots()
      .then((data) => setSlots(data))
      .catch((e) => console.error('Помилка читання автозбережень:', e))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRestore = (slot: AutosaveSlot) => {
    if (
      window.confirm(
        `Відновити копію "${slot.name}" від ${new Date(slot.timestamp).toLocaleTimeString('uk-UA')}?\nНезбережені зміни поточного сеансу буде замінено цією версією.`
      )
    ) {
      onRestoreProject(slot.project);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-slate-800/80">
          <div className="flex items-center gap-2 text-slate-100 font-semibold">
            <History className="w-5 h-5 text-sky-400" />
            <span>Історія автозбережень (IndexedDB)</span>
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
            Система автоматично веде кільцевий буфер із 5 останніх збережених копій у вашому браузері.
            Якщо ви випадково щось змінили або закрили вкладку — ви можете відновити будь-яку з версій:
          </p>

          {loading ? (
            <div className="text-center py-8 text-slate-400 text-xs animate-pulse">
              Завантаження збережених версій...
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Ще немає збережених копій. Вони створюються автоматично під час роботи.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {slots.map((slot, idx) => {
                const date = new Date(slot.timestamp);
                const isLatest = idx === 0;

                return (
                  <div
                    key={slot.slotKey}
                    className="p-3 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg flex items-center justify-between transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-xs">
                          {slot.name}
                        </span>
                        {isLatest && (
                          <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] px-1.5 py-0.5 rounded font-medium">
                            Остання
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-slate-500">
                          [{slot.slotKey}]
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {date.toLocaleDateString('uk-UA')} {date.toLocaleTimeString('uk-UA')}
                        </span>
                        <span>•</span>
                        <span>{slot.cols} × {slot.rows} клітинок</span>
                        <span>•</span>
                        <span className="text-sky-400 font-mono">{slot.totalBeads} бісерин</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestore(slot)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Відновити</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-end pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition"
            >
              Закрити
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
