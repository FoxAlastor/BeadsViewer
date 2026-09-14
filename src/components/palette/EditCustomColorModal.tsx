import React, { useEffect, useState } from 'react';
import { BeadColor } from '../../types/beads';
import { Pencil, X } from 'lucide-react';

interface EditCustomColorModalProps {
  color: BeadColor | null;
  onClose: () => void;
  onSave: (color: BeadColor) => void;
}

export const EditCustomColorModal: React.FC<EditCustomColorModalProps> = ({ color, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#e11d48');
  const [category, setCategory] = useState('Користувацькі');
  const [error, setError] = useState('');

  useEffect(() => {
    if (color) {
      setName(color.name);
      setHex(color.hex);
      setCategory(color.category);
      setError('');
    }
  }, [color]);

  if (!color) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedHex = hex.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(normalizedHex)) {
      setError('HEX має бути у форматі #RRGGBB');
      return;
    }
    onSave({
      ...color,
      name: name.trim() || `Колір ${color.code}`,
      hex: normalizedHex.toUpperCase(),
      category: category.trim() || 'Користувацькі',
      isCustom: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2 text-slate-100 font-semibold">
            <Pencil className="w-5 h-5 text-sky-400" />
            <span>Редагувати колір {color.code}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm">
          {error && <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-red-300 text-xs">{error}</div>}
          <label className="block text-slate-300 font-medium">Назва
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500" />
          </label>
          <label className="block text-slate-300 font-medium">Категорія
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500" />
          </label>
          <label className="block text-slate-300 font-medium">HEX колір
            <div className="flex items-center gap-3 mt-1">
              <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#e11d48'} onChange={(e) => setHex(e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
              <input value={hex} onChange={(e) => setHex(e.target.value)} className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-sky-500" />
              <div className="w-10 h-10 rounded-lg border border-slate-600 shadow-inner" style={{ backgroundColor: hex }} />
            </div>
          </label>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition">Скасувати</button>
            <button type="submit" className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition">Зберегти зміни</button>
          </div>
        </form>
      </div>
    </div>
  );
};
