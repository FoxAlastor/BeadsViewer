import { useEffect, useRef, useState } from 'react';
import { ProjectSchema } from '../types/beads';
import { saveToAutosaveRing } from '../utils/storage';

export function useAutosave(project: ProjectSchema, isDirty: boolean, setIsDirty: (val: boolean) => void) {
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const projectRef = useRef(project);
  projectRef.current = project;

  // Perform save
  const performSave = async () => {
    try {
      setIsSaving(true);
      await saveToAutosaveRing(projectRef.current);
      const timeStr = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(timeStr);
      setIsDirty(false);
    } catch (e) {
      console.error('Помилка автозбереження:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Periodic autosave every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty) {
        performSave();
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isDirty]);

  // Debounced autosave 4 seconds after last change
  useEffect(() => {
    if (!isDirty) return;

    const timer = setTimeout(() => {
      performSave();
    }, 4000);

    return () => clearTimeout(timer);
  }, [project, isDirty]);

  // Warn before closing tab if there are unsaved modifications
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return {
    lastSavedTime,
    isSaving,
    triggerAutosaveNow: performSave,
  };
}
