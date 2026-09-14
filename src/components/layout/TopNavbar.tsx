import React, { useState } from 'react';
import { ProjectSchema } from '../../types/beads';
import {
  Clock,
  Download,
  FilePlus,
  FolderOpen,
  History,
  Image as ImageIcon,
  Maximize2,
  Redo2,
  Save,
  Undo2,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

interface TopNavbarProps {
  project: ProjectSchema;
  onUpdateName: (name: string) => void;
  onNewProject: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onOpenResizeModal: () => void;
  onOpenExportImageModal: () => void;
  onOpenAutosaveModal: () => void;
  onExportXml: () => void;
  onImportXml: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedTime: string | null;
  onManualSaveBackup: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  project,
  onUpdateName,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onOpenResizeModal,
  onOpenExportImageModal,
  onOpenAutosaveModal,
  onExportXml,
  onImportXml,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isDirty,
  isSaving,
  lastSavedTime,
  onManualSaveBackup,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between select-none z-30 flex-shrink-0">
      {/* Left: Brand & File Menu */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center shadow-md shadow-sky-600/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-100 tracking-tight text-sm hidden sm:inline">
            Beads<span className="text-sky-400">Viewer</span>
          </span>
        </div>

        {/* Project Name editable */}
        <div className="relative group">
          <input
            type="text"
            value={project.name}
            onChange={(e) => onUpdateName(e.target.value)}
            title="Натисніть для редагування назви схеми"
            className="bg-transparent hover:bg-slate-800/80 focus:bg-slate-950 font-medium text-slate-200 text-xs px-2.5 py-1 rounded-md border border-transparent hover:border-slate-700 focus:border-sky-500 transition focus:outline-none max-w-[160px] sm:max-w-[220px] truncate"
          />
        </div>

        {/* File Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            <span>Файл</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute left-0 mt-1.5 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs text-slate-200">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onNewProject();
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-slate-700 text-left transition"
                >
                  <FilePlus className="w-4 h-4 text-sky-400" />
                  <span>Нова схема...</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenProject();
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-slate-700 text-left transition"
                >
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  <span>Відкрити (.beadsproj / .json)</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onSaveProject();
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-slate-700 text-left transition"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>Зберегти проєкт (Ctrl+S)</span>
                </button>

                <div className="my-1 border-t border-slate-700/80" />

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenExportImageModal();
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-slate-700 text-left transition"
                >
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  <span>Експорт у зображення (PNG/JPG)...</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onExportXml();
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-slate-700 text-left transition"
                >
                  <Download className="w-4 h-4 text-slate-400" />
                  <span>Експорт в XML</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onImportXml();
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-slate-700 text-left transition"
                >
                  <FolderOpen className="w-4 h-4 text-slate-400" />
                  <span>Імпорт з XML...</span>
                </button>

                <div className="my-1 border-t border-slate-700/80" />

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAutosaveModal();
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-slate-700 text-left transition"
                >
                  <History className="w-4 h-4 text-sky-400" />
                  <span>Історія автозбережень (IndexedDB)</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Resize Canvas Trigger */}
        <button
          onClick={onOpenResizeModal}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
        >
          <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Змінити розмір ({project.cols}×{project.rows})</span>
        </button>
      </div>

      {/* Center: Autosave Status Indicator */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        {isSaving ? (
          <span className="text-sky-400 animate-pulse">Збереження копії...</span>
        ) : isDirty ? (
          <span className="text-amber-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            Є незбережені зміни
          </span>
        ) : lastSavedTime ? (
          <span className="text-emerald-400">Автозбережено о {lastSavedTime}</span>
        ) : (
          <span>Автозбереження активне</span>
        )}

        <button
          onClick={onManualSaveBackup}
          title="Створити точку відновлення в IndexedDB зараз"
          className="ml-1 text-slate-500 hover:text-sky-300 transition"
        >
          ●
        </button>
      </div>

      {/* Right: Undo/Redo & Quick Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Скасувати дію (Ctrl+Z)"
            className="p-1.5 rounded-md hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-slate-200 transition"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Повторити дію (Ctrl+Y)"
            className="p-1.5 rounded-md hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-slate-200 transition"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onSaveProject}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-md shadow-emerald-950/40"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Зберегти</span>
        </button>

        <button
          onClick={onOpenExportImageModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition shadow-md shadow-sky-950/40"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Експорт</span>
        </button>
      </div>
    </header>
  );
};
