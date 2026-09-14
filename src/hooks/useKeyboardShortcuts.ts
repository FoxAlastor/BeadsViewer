import { useEffect } from 'react';
import { ToolType } from '../types/beads';

interface KeyboardShortcutsProps {
  onSelectTool: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onEscape: () => void;
}

export function useKeyboardShortcuts({
  onSelectTool,
  onUndo,
  onRedo,
  onSave,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onEscape,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      // Undo / Redo
      if (ctrlOrCmd && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo();
        } else {
          onUndo();
        }
        return;
      }

      if (ctrlOrCmd && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        onRedo();
        return;
      }

      // Save
      if (ctrlOrCmd && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
        return;
      }

      // Zoom
      if (ctrlOrCmd && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        onZoomIn();
        return;
      }
      if (ctrlOrCmd && e.key === '-') {
        e.preventDefault();
        onZoomOut();
        return;
      }
      if (ctrlOrCmd && e.key === '0') {
        e.preventDefault();
        onResetZoom();
        return;
      }

      // Single-key tool switches
      switch (e.key.toLowerCase()) {
        case 'b':
          onSelectTool('pencil');
          break;
        case 'e':
          onSelectTool('eraser');
          break;
        case 'g':
          onSelectTool('bucket');
          break;
        case 'i':
          onSelectTool('picker');
          break;
        case 'l':
          onSelectTool('line');
          break;
        case 'm':
          onSelectTool('select');
          break;
        case 'd':
          onSelectTool('done');
          break;
        case 'h':
          onSelectTool('hand');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onSelectTool,
    onUndo,
    onRedo,
    onSave,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onEscape,
  ]);
}
