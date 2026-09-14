import { useState, useMemo, useCallback, useEffect } from 'react';
import { BeadColor, ProjectSchema, SelectionRect, ToolType, ViewOptions } from './types/beads';
import { createDefaultProject } from './utils/projectSerialization';
import { findColorByCode } from './data/preciosaDefaultPalette';
import { useHistory } from './hooks/useHistory';
import { useAutosave } from './hooks/useAutosave';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import {
  exportProjectToXMLFile,
  importProjectFromXMLFile,
  openProjectFromFile,
  saveProjectToFile,
} from './utils/fileSystem';
import { cropToSelection, Point } from './canvas/tools';
import { getLatestAutosave } from './utils/storage';

import { TopNavbar } from './components/layout/TopNavbar';
import { Toolbar } from './components/layout/Toolbar';
import { StatusBar } from './components/layout/StatusBar';
import { GridCanvas } from './canvas/GridCanvas';
import { PalettePanel } from './components/palette/PalettePanel';
import { ColorCountTable } from './components/counting/ColorCountTable';
import { ResizeCanvasModal } from './components/modals/ResizeCanvasModal';
import { ExportImageModal } from './components/modals/ExportImageModal';
import { AutosaveHistoryModal } from './components/modals/AutosaveHistoryModal';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { Hash, Sparkles } from 'lucide-react';

export function App() {
  const {
    project,
    setProject,
    canUndo,
    canRedo,
    undo,
    redo,
    resetHistory,
    setProjectDirect,
  } = useHistory(createDefaultProject(40, 40, 'Орнамент Ромб (Preciosa)'));

  const [isDirty, setIsDirty] = useState(false);
  const { lastSavedTime, isSaving, triggerAutosaveNow } = useAutosave(
    project,
    isDirty,
    setIsDirty
  );

  // Tools & State
  const [activeTool, setActiveTool] = useState<ToolType>('pencil');
  const [activeColorCode, setActiveColorCode] = useState<string>('93190'); // Preciosa Red
  const [shapeFilled, setShapeFilled] = useState<boolean>(false);
  const [selection, setSelection] = useState<SelectionRect | null>(null);
  const [cursorCell, setCursorCell] = useState<Point | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'palette' | 'counting'>('palette');

  // Restore the latest autosave on startup so custom palette colors survive refreshes.
  useEffect(() => {
    let cancelled = false;
    getLatestAutosave().then((saved) => {
      if (!cancelled && saved) setProjectDirect(saved);
    }).catch(() => {
      // IndexedDB may be unavailable; the fresh project remains usable.
    });
    return () => { cancelled = true; };
  }, [setProjectDirect]);

  // View Options
  const [view, setView] = useState<ViewOptions>({
    renderStyle: 'bead',
    beadRatio: '1.6x2.2',
    showGrid: true,
    showRulers: true,
    showDoneMask: true,
    onlyIncomplete: false,
    focusColorCode: null,
    zoom: 1.0,
    pan: { x: 50, y: 50 },
    showNumbers: false,
  });

  // Modals
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isResizeOpen, setIsResizeOpen] = useState(false);
  const [isExportImageOpen, setIsExportImageOpen] = useState(false);
  const [isAutosaveOpen, setIsAutosaveOpen] = useState(false);

  // Active color resolution
  const activeColor: BeadColor = useMemo(() => {
    return (
      findColorByCode(activeColorCode, project.customColors) || {
        code: activeColorCode,
        name: `Колір ${activeColorCode}`,
        hex: '#93190',
        category: 'Стандартна',
        artNo: '331 19 001',
      }
    );
  }, [activeColorCode, project.customColors]);

  // Wrapped project updater with history and dirty flag
  const handleUpdateProject = useCallback(
    (newProject: ProjectSchema) => {
      setProject(newProject);
      setIsDirty(true);
    },
    [setProject]
  );

  // Name updater
  const handleUpdateName = (name: string) => {
    handleUpdateProject({ ...project, name });
  };

  // Color selection from palette or eyedropper
  const handleSelectColor = (code: string) => {
    setActiveColorCode(code);
  };

  // Add custom color
  const handleAddCustomColor = (color: BeadColor) => {
    if (project.customColors.some((existing) => existing.code === color.code)) {
      alert(`Колір з кодом ${color.code} вже є у власній палітрі`);
      return;
    }
    handleUpdateProject({
      ...project,
      customColors: [...project.customColors, color],
    });
    setActiveColorCode(color.code);
  };

  const handleUpdateCustomColor = (color: BeadColor) => {
    handleUpdateProject({
      ...project,
      customColors: project.customColors.map((existing) => existing.code === color.code ? color : existing),
    });
  };

  const handleDeleteCustomColor = (code: string) => {
    const isUsed = project.cells.some((row) => row.includes(code));
    if (isUsed) {
      alert('Цей колір використовується у схемі. Спочатку замініть його на інший.');
      return;
    }
    handleUpdateProject({
      ...project,
      customColors: project.customColors.filter((color) => color.code !== code),
    });
    if (activeColorCode === code) setActiveColorCode('93190');
  };

  // Import colors to palette
  const handleImportColors = (newColors: BeadColor[]) => {
    const existingCodes = new Set([
      ...project.customColors.map((c) => c.code),
    ]);
    const unique = newColors.filter((c) => !existingCodes.has(c.code));
    if (unique.length > 0) {
      handleUpdateProject({
        ...project,
        customColors: [...project.customColors, ...unique],
      });
      setActiveColorCode(unique[0].code);
    }
  };

  // Focus color toggle
  const handleSetFocusColor = (code: string | null) => {
    setView((v) => ({ ...v, focusColorCode: code }));
  };

  // Selection actions
  const handleFillSelection = () => {
    if (!selection) return;
    const startC = Math.min(selection.startC, selection.endC);
    const endC = Math.max(selection.startC, selection.endC);
    const startR = Math.min(selection.startR, selection.endR);
    const endR = Math.max(selection.startR, selection.endR);

    const newCells = project.cells.map((row) => [...row]);
    for (let r = startR; r <= endR; r++) {
      for (let c = startC; c <= endC; c++) {
        if (r >= 0 && r < project.rows && c >= 0 && c < project.cols) {
          newCells[r][c] = activeColorCode;
        }
      }
    }
    handleUpdateProject({ ...project, cells: newCells });
  };

  const handleClearSelection = () => {
    if (!selection) return;
    const startC = Math.min(selection.startC, selection.endC);
    const endC = Math.max(selection.startC, selection.endC);
    const startR = Math.min(selection.startR, selection.endR);
    const endR = Math.max(selection.startR, selection.endR);

    const newCells = project.cells.map((row) => [...row]);
    for (let r = startR; r <= endR; r++) {
      for (let c = startC; c <= endC; c++) {
        if (r >= 0 && r < project.rows && c >= 0 && c < project.cols) {
          newCells[r][c] = null;
        }
      }
    }
    handleUpdateProject({ ...project, cells: newCells });
  };

  const handleCropToSelection = () => {
    if (!selection) return;
    try {
      const cropped = cropToSelection(project, selection);
      handleUpdateProject(cropped);
      setSelection(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Помилка обрізки');
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    setView((v) => ({ ...v, zoom: Math.min(8.0, v.zoom * 1.25) }));
  };
  const handleZoomOut = () => {
    setView((v) => ({ ...v, zoom: Math.max(0.2, v.zoom / 1.25) }));
  };
  const handleResetZoom = () => {
    setView((v) => ({ ...v, zoom: 1.0, pan: { x: 40, y: 40 } }));
  };

  // Keyboard Shortcuts Hook
  useKeyboardShortcuts({
    onSelectTool: setActiveTool,
    onUndo: undo,
    onRedo: redo,
    onSave: async () => {
      await saveProjectToFile(project);
      setIsDirty(false);
    },
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onResetZoom: handleResetZoom,
    onEscape: () => {
      setSelection(null);
      if (view.focusColorCode) {
        setView((v) => ({ ...v, focusColorCode: null }));
      }
    },
  });

  // Project Open / Save / Import Handlers
  const handleOpenProject = async () => {
    try {
      const loaded = await openProjectFromFile();
      resetHistory(loaded);
      setIsDirty(false);
      setSelection(null);
    } catch (err: unknown) {
      alert(`Помилка відкриття файлу: ${err instanceof Error ? err.message : 'Невідома помилка'}`);
    }
  };

  const handleSaveProject = async () => {
    try {
      const success = await saveProjectToFile(project);
      if (success) setIsDirty(false);
    } catch (err: unknown) {
      alert(`Помилка збереження: ${err instanceof Error ? err.message : 'Невідома помилка'}`);
    }
  };

  const handleExportXml = () => {
    exportProjectToXMLFile(project);
  };

  const handleImportXml = async () => {
    try {
      const loaded = await importProjectFromXMLFile();
      resetHistory(loaded);
      setIsDirty(false);
      setSelection(null);
    } catch (err: unknown) {
      alert(`Помилка імпорту XML: ${err instanceof Error ? err.message : 'Невідома помилка'}`);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* Top Navbar */}
      <TopNavbar
        project={project}
        onUpdateName={handleUpdateName}
        onNewProject={() => setIsNewProjectOpen(true)}
        onOpenProject={handleOpenProject}
        onSaveProject={handleSaveProject}
        onOpenResizeModal={() => setIsResizeOpen(true)}
        onOpenExportImageModal={() => setIsExportImageOpen(true)}
        onOpenAutosaveModal={() => setIsAutosaveOpen(true)}
        onExportXml={handleExportXml}
        onImportXml={handleImportXml}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        isDirty={isDirty}
        isSaving={isSaving}
        lastSavedTime={lastSavedTime}
        onManualSaveBackup={triggerAutosaveNow}
      />

      {/* Main Tool Bar */}
      <Toolbar
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        activeColor={activeColor}
        shapeFilled={shapeFilled}
        onToggleShapeFilled={() => setShapeFilled(!shapeFilled)}
        view={view}
        onChangeView={setView}
        selection={selection}
        onFillSelection={handleFillSelection}
        onClearSelection={handleClearSelection}
        onCropToSelection={handleCropToSelection}
        onClearActiveSelection={() => setSelection(null)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />

      {/* Center workspace: Canvas + Right Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Canvas Area */}
        <div className="flex-1 h-full relative">
          <GridCanvas
            project={project}
            onUpdateProject={handleUpdateProject}
            activeTool={activeTool}
            activeColorCode={activeColorCode}
            shapeFilled={shapeFilled}
            onPickColor={handleSelectColor}
            view={view}
            onChangeView={setView}
            selection={selection}
            onSetSelection={setSelection}
            onCursorMove={setCursorCell}
          />
        </div>

        {/* Right Sidebar with Tabs (Palette & Beads Counter) */}
        <div className="flex flex-col h-full border-l border-slate-800 bg-slate-900 z-20 shadow-xl">
          {/* Sidebar Tab Switcher */}
          <div className="flex border-b border-slate-800 bg-slate-950/70 p-1.5 gap-1">
            <button
              onClick={() => setRightPanelTab('palette')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                rightPanelTab === 'palette'
                  ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Палітра</span>
            </button>
            <button
              onClick={() => setRightPanelTab('counting')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                rightPanelTab === 'counting'
                  ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Підрахунок</span>
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="flex-1 overflow-hidden">
            {rightPanelTab === 'palette' ? (
              <PalettePanel
                activeColorCode={activeColorCode}
                onSelectColor={handleSelectColor}
                customColors={project.customColors}
                onAddCustomColor={handleAddCustomColor}
                onUpdateCustomColor={handleUpdateCustomColor}
                onDeleteCustomColor={handleDeleteCustomColor}
                onImportColors={handleImportColors}
                focusColorCode={view.focusColorCode}
                onSetFocusColor={handleSetFocusColor}
              />
            ) : (
              <ColorCountTable
                project={project}
                focusColorCode={view.focusColorCode}
                onSetFocusColor={handleSetFocusColor}
                onSelectColor={handleSelectColor}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        project={project}
        cursorCell={cursorCell}
        activeTool={activeTool}
        zoom={view.zoom}
      />

      {/* Modals */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onCreateProject={(newProj) => {
          resetHistory(newProj);
          setIsDirty(false);
          setSelection(null);
        }}
      />

      <ResizeCanvasModal
        isOpen={isResizeOpen}
        onClose={() => setIsResizeOpen(false)}
        project={project}
        onUpdateProject={handleUpdateProject}
        selection={selection}
      />

      <ExportImageModal
        isOpen={isExportImageOpen}
        onClose={() => setIsExportImageOpen(false)}
        project={project}
      />

      <AutosaveHistoryModal
        isOpen={isAutosaveOpen}
        onClose={() => setIsAutosaveOpen(false)}
        onRestoreProject={(restored) => {
          resetHistory(restored);
          setIsDirty(false);
          setSelection(null);
        }}
      />
    </div>
  );
}

export default App;
