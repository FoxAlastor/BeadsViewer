import { useCallback, useRef, useState } from 'react';
import { ProjectSchema } from '../types/beads';

const MAX_HISTORY_STEPS = 60;

export function useHistory(initialProject: ProjectSchema) {
  const [project, setProject] = useState<ProjectSchema>(initialProject);
  const undoStackRef = useRef<ProjectSchema[]>([]);
  const redoStackRef = useRef<ProjectSchema[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateFlags = useCallback(() => {
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, []);

  const setProjectWithHistory = useCallback((next: ProjectSchema | ((prev: ProjectSchema) => ProjectSchema)) => {
    setProject((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;

      // Push clone of previous state to undo stack
      const snapshot: ProjectSchema = JSON.parse(JSON.stringify(prev));
      undoStackRef.current.push(snapshot);
      if (undoStackRef.current.length > MAX_HISTORY_STEPS) {
        undoStackRef.current.shift();
      }

      // Clear redo stack on new action
      redoStackRef.current = [];
      updateFlags();

      return resolved;
    });
  }, [updateFlags]);

  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;

    setProject((current) => {
      const previous = undoStackRef.current.pop();
      if (!previous) return current;

      // Push current to redo stack
      redoStackRef.current.push(JSON.parse(JSON.stringify(current)));
      updateFlags();

      return previous;
    });
  }, [updateFlags]);

  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;

    setProject((current) => {
      const next = redoStackRef.current.pop();
      if (!next) return current;

      // Push current to undo stack
      undoStackRef.current.push(JSON.parse(JSON.stringify(current)));
      updateFlags();

      return next;
    });
  }, [updateFlags]);

  const resetHistory = useCallback((newProject: ProjectSchema) => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    setProject(newProject);
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  return {
    project,
    setProject: setProjectWithHistory,
    setProjectDirect: setProject,
    canUndo,
    canRedo,
    undo,
    redo,
    resetHistory,
  };
}
