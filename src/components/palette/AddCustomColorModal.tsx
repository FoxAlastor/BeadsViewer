import React, { useState } from 'react';
import { BeadColor } from '../../types/beads';
import { Plus, X } from 'lucide-react';

interface AddCustomColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddColor: (color: BeadColor) => void;
}

export const AddCustomColorModal: React.FC<AddCustomColorModalProps> = ({
  isOpen,
  onClose,
  onAddColor,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#e11d48');
  const [category, setCategory] = useState('Користувацькі');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Введіть код кольору');
      return;
    }

    onAddColor({
      code: code.trim(),
      name: name.trim() || `Колір ${code.trim()}`,
      hex,
      category: category.trim() || 'Користувацькі',
      artNo: 'Custom',
      isCustom: true,
    });

    setCode('');
    setName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-slate-800/80">
          <div className="flex items-center gap-2 text-slate-100 font-semibold">
            <Plus className="w-5 h-5 text-sky-400" />
            <span>Додати власний колір бісеру</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-red-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Код кольору / артикул <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="наприклад, C-991 або 58205"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Назва або опис кольору
            </label>
            <input
              type="text"
              placeholder="наприклад, Перлинний рожевий"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Категорія
            </label>
            <input
              type="text"
              placeholder="Користувацькі"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              HEX колір
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
              />
              <input
                type="text"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
              <div
                className="w-10 h-10 rounded-lg border border-slate-600 shadow-inner"
                style={{ backgroundColor: hex }}
              />
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
              type="submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition shadow-lg shadow-sky-900/30"
            >
              Зберегти колір
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
