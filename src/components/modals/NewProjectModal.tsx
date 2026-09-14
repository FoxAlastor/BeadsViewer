import React, { useState } from 'react';
import { ProjectSchema } from '../../types/beads';
import { createDefaultProject, createEmptyGrid } from '../../utils/projectSerialization';
import { FilePlus, X } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: ProjectSchema) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [name, setName] = useState('Нова схема');
  const [rows, setRows] = useState(40);
  const [cols, setCols] = useState(40);
  const [cellSize, setCellSize] = useState(20);
  const [withDemoPattern, setWithDemoPattern] = useState(true);

  if (!isOpen) return null;

  const presets = [
    { label: '30 × 30', r: 30, c: 30 },
    { label: '40 × 40', r: 40, c: 40 },
    { label: '60 × 40 (Гердан/Браслет)', r: 60, c: 40 },
    { label: '80 × 50', r: 80, c: 50 },
    { label: '100 × 100 (Картина)', r: 100, c: 100 },
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (withDemoPattern) {
      const proj = createDefaultProject(rows, cols, name.trim() || 'Нова схема');
      proj.cellSize = cellSize;
      onCreateProject(proj);
    } else {
      const proj: ProjectSchema = {
        schemaVersion: 1,
        name: name.trim() || 'Нова схема',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rows,
        cols,
        cellSize,
        paletteRef: 'preciosa-rocailles-v1',
        cells: createEmptyGrid(rows, cols, null),
        doneMask: createEmptyGrid(rows, cols, false),
        customColors: [],
        notes: '',
      };
      onCreateProject(proj);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-slate-800/80">
          <div className="flex items-center gap-2 text-slate-100 font-semibold">
            <FilePlus className="w-5 h-5 text-sky-400" />
            <span>Створити нову схему</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-5 space-y-4 text-sm">
          <div>
            <label className="block text-slate-300 font-medium mb-1 text-xs">
              Назва проєкту:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
              autoFocus
            />
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5 text-xs">
              Швидкі шаблони розміру:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setRows(p.r);
                    setCols(p.c);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-xs transition ${
                    rows === p.r && cols === p.c
                      ? 'bg-sky-600 border-sky-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1 text-xs">
                Колонки (Ширина, cols):
              </label>
              <input
                type="number"
                min={5}
                max={300}
                value={cols}
                onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1 text-xs">
                Рядки (Висота, rows):
              </label>
              <input
                type="number"
                min={5}
                max={300}
                value={rows}
                onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1 text-xs">
              Розмір бісерини за замовчуванням (пікселів):
            </label>
            <input
              type="number"
              min={10}
              max={60}
              value={cellSize}
              onChange={(e) => setCellSize(Math.max(5, parseInt(e.target.value) || 20))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={withDemoPattern}
              onChange={(e) => setWithDemoPattern(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
            />
            <span>Заповнити стартовим традиційним орнаментом (демо)</span>
          </label>

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
              Створити схему
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
