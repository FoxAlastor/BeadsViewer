import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getCellDimensions, ProjectSchema, SelectionRect, ToolType, ViewOptions } from '../types/beads';
import { CanvasRenderer } from './CanvasRenderer';
import { floodFill, getShapePoints, isShapeTool, Point } from './tools';

interface GridCanvasProps {
  project: ProjectSchema;
  onUpdateProject: (newProject: ProjectSchema) => void;
  activeTool: ToolType;
  activeColorCode: string;
  shapeFilled?: boolean;
  onPickColor: (code: string) => void;
  view: ViewOptions;
  onChangeView: (updater: (prev: ViewOptions) => ViewOptions) => void;
  selection: SelectionRect | null;
  onSetSelection: (sel: SelectionRect | null) => void;
  onCursorMove?: (point: Point | null) => void;
}

export const GridCanvas: React.FC<GridCanvasProps> = ({
  project,
  onUpdateProject,
  activeTool,
  activeColorCode,
  shapeFilled = false,
  onPickColor,
  view,
  onChangeView,
  selection,
  onSetSelection,
  onCursorMove,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer>(new CanvasRenderer());

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoverCell, setHoverCell] = useState<Point | null>(null);
  const [lineStart, setLineStart] = useState<Point | null>(null);
  const [linePreview, setLinePreview] = useState<Point[] | null>(null);
  const [selectStart, setSelectStart] = useState<Point | null>(null);

  // Temporary working cells during a drag-stroke to prevent duplicate pushes
  const strokeModifiedRef = useRef<boolean>(false);
  const strokeProjectRef = useRef<ProjectSchema>(project);
  strokeProjectRef.current = project;

  // Spacebar panning state
  const isSpacePressedRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        isSpacePressedRef.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Convert mouse screen coordinates to grid cell (r, c)
  const getGridCoords = useCallback((clientX: number, clientY: number): Point | null => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const cellX = (x - view.pan.x) / view.zoom;
    const cellY = (y - view.pan.y) / view.zoom;

    const { cellWidth, cellHeight } = getCellDimensions(project.cellSize, view.beadRatio);

    const c = Math.floor(cellX / cellWidth);
    const r = Math.floor(cellY / cellHeight);

    return { r, c };
  }, [view.pan, view.zoom, view.beadRatio, project.cellSize]);

  // Redraw canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    rendererRef.current.render({
      ctx,
      width: canvas.width,
      height: canvas.height,
      project,
      view,
      hoverCell,
      linePreview,
      selection,
    });
  }, [project, view, hoverCell, linePreview, selection]);

  useEffect(() => {
    let animId: number;
    const renderLoop = () => {
      redraw();
      animId = requestAnimationFrame(renderLoop);
    };
    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [redraw]);

  // Handle Canvas Resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.height;
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Center initial project on load
  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const { cellWidth, cellHeight } = getCellDimensions(project.cellSize, view.beadRatio);
    const sheetW = project.cols * cellWidth * view.zoom;
    const sheetH = project.rows * cellHeight * view.zoom;
    const initialX = Math.max(40, Math.floor((rect.width - sheetW) / 2));
    const initialY = Math.max(40, Math.floor((rect.height - sheetH) / 2));

    onChangeView((prev) => ({
      ...prev,
      pan: { x: initialX, y: initialY },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.rows, project.cols, view.beadRatio]);

  // Zoom with mouse wheel with focal point
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.min(8.0, Math.max(0.2, view.zoom * zoomFactor));

    // Zoom anchored to mouse cursor
    const newPanX = mouseX - (mouseX - view.pan.x) * (newZoom / view.zoom);
    const newPanY = mouseY - (mouseY - view.pan.y) * (newZoom / view.zoom);

    onChangeView((prev) => ({
      ...prev,
      zoom: newZoom,
      pan: { x: newPanX, y: newPanY },
    }));
  };

  // Cell modification helper
  const applyPencilOrEraser = (pt: Point, tool: ToolType, isShift: boolean) => {
    if (pt.r < 0 || pt.r >= project.rows || pt.c < 0 || pt.c >= project.cols) return;

    if (isShift || tool === 'done') {
      // Toggle done-mask
      const newDoneMask = project.doneMask.map((row, r) =>
        row.map((val, c) => (r === pt.r && c === pt.c ? !val : val))
      );
      onUpdateProject({ ...project, doneMask: newDoneMask });
      strokeModifiedRef.current = true;
      return;
    }

    const targetColor = tool === 'eraser' ? null : activeColorCode;
    if (project.cells[pt.r][pt.c] === targetColor) return;

    const newCells = project.cells.map((row, r) =>
      row.map((val, c) => (r === pt.r && c === pt.c ? targetColor : val))
    );
    onUpdateProject({ ...project, cells: newCells });
    strokeModifiedRef.current = true;
  };

  // Mouse Down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const isMiddle = e.button === 1;
    const isSpacePan = e.button === 0 && isSpacePressedRef.current;
    const isHandTool = activeTool === 'hand' && e.button === 0;

    if (isMiddle || isSpacePan || isHandTool) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - view.pan.x, y: e.clientY - view.pan.y });
      return;
    }

    if (e.button !== 0) return; // Only primary button for drawing

    const pt = getGridCoords(e.clientX, e.clientY);
    if (!pt) return;

    setIsMouseDown(true);
    strokeModifiedRef.current = false;

    // Eyedropper
    if (activeTool === 'picker') {
      if (pt.r >= 0 && pt.r < project.rows && pt.c >= 0 && pt.c < project.cols) {
        const pickedColor = project.cells[pt.r][pt.c];
        if (pickedColor) onPickColor(pickedColor);
      }
      return;
    }

    // Flood Fill
    if (activeTool === 'bucket') {
      if (pt.r >= 0 && pt.r < project.rows && pt.c >= 0 && pt.c < project.cols) {
        const changed = floodFill(project.cells, pt.r, pt.c, activeColorCode);
        if (changed.length > 0) {
          const newCells = project.cells.map((row) => [...row]);
          for (const p of changed) {
            newCells[p.r][p.c] = activeColorCode;
          }
          onUpdateProject({ ...project, cells: newCells });
        }
      }
      return;
    }

    // Shape tools start (line, rectangle, circle, diamond, triangle, star, heart, flower)
    if (isShapeTool(activeTool)) {
      setLineStart(pt);
      setLinePreview(getShapePoints(activeTool, pt.r, pt.c, pt.r, pt.c, shapeFilled));
      return;
    }

    // Selection tool start
    if (activeTool === 'select') {
      setSelectStart(pt);
      onSetSelection({ startR: pt.r, startC: pt.c, endR: pt.r, endC: pt.c });
      return;
    }

    // Pencil / Eraser / Done
    applyPencilOrEraser(pt, activeTool, e.shiftKey);
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      onChangeView((prev) => ({
        ...prev,
        pan: { x: e.clientX - panStart.x, y: e.clientY - panStart.y },
      }));
      return;
    }

    const pt = getGridCoords(e.clientX, e.clientY);
    setHoverCell(pt);
    if (onCursorMove) onCursorMove(pt);

    if (!isMouseDown || !pt) return;

    // Shape tools preview
    if (isShapeTool(activeTool) && lineStart) {
      const shapePts = getShapePoints(activeTool, lineStart.r, lineStart.c, pt.r, pt.c, shapeFilled);
      setLinePreview(shapePts);
      return;
    }

    // Selection drag
    if (activeTool === 'select' && selectStart) {
      onSetSelection({
        startR: selectStart.r,
        startC: selectStart.c,
        endR: pt.r,
        endC: pt.c,
      });
      return;
    }

    // Pencil / Eraser drag stroke
    if (activeTool === 'pencil' || activeTool === 'eraser' || activeTool === 'done') {
      applyPencilOrEraser(pt, activeTool, e.shiftKey);
    }
  };

  // Mouse Up
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isMouseDown) return;
    setIsMouseDown(false);

    // Commit shape tool
    if (isShapeTool(activeTool) && linePreview && linePreview.length > 0) {
      const newCells = project.cells.map((row) => [...row]);
      for (const p of linePreview) {
        if (p.r >= 0 && p.r < project.rows && p.c >= 0 && p.c < project.cols) {
          newCells[p.r][p.c] = activeColorCode;
        }
      }
      onUpdateProject({ ...project, cells: newCells });
      setLineStart(null);
      setLinePreview(null);
      return;
    }

    // Selection end
    if (activeTool === 'select') {
      setSelectStart(null);
      return;
    }
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
    setIsMouseDown(false);
    setHoverCell(null);
    setLinePreview(null);
    if (onCursorMove) onCursorMove(null);
  };

  // Determine cursor icon
  const getCursorClass = () => {
    if (isPanning || isSpacePressedRef.current || activeTool === 'hand') return 'cursor-grab active:cursor-grabbing';
    if (activeTool === 'picker') return 'cursor-crosshair';
    if (activeTool === 'bucket') return 'cursor-cell';
    if (activeTool === 'select') return 'cursor-crosshair';
    return 'cursor-crosshair';
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-slate-950 ${getCursorClass()}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="block"
      />
    </div>
  );
};
