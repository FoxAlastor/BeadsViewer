import { AutosaveSlot, ProjectSchema } from '../types/beads';

const DB_NAME = 'BeadsViewerDB';
const DB_VERSION = 1;
const STORE_NAME = 'autosaves';
const MAX_BACKUP_SLOTS = 5;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'slotKey' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToAutosaveRing(project: ProjectSchema): Promise<AutosaveSlot> {
  const db = await openDB();

  // Get current slot pointer from localStorage
  const currentSlotIndex = parseInt(localStorage.getItem('beadsviewer_slot_ptr') || '0', 10);
  const nextSlotIndex = (currentSlotIndex + 1) % MAX_BACKUP_SLOTS;
  const slotKey = `autosave_${nextSlotIndex + 1}`;

  // Count total non-empty beads
  let totalBeads = 0;
  for (let r = 0; r < project.rows; r++) {
    for (let c = 0; c < project.cols; c++) {
      if (project.cells[r][c] !== null) totalBeads++;
    }
  }

  const slotData: AutosaveSlot = {
    slotKey,
    timestamp: Date.now(),
    name: project.name,
    rows: project.rows,
    cols: project.cols,
    totalBeads,
    project: JSON.parse(JSON.stringify(project)),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(slotData);

    tx.oncomplete = () => {
      localStorage.setItem('beadsviewer_slot_ptr', nextSlotIndex.toString());
      localStorage.setItem('beadsviewer_last_autosave_time', Date.now().toString());
      resolve(slotData);
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAutosaveSlots(): Promise<AutosaveSlot[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const items = (request.result as AutosaveSlot[]) || [];
      // Sort by timestamp descending (newest first)
      items.sort((a, b) => b.timestamp - a.timestamp);
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getLatestAutosave(): Promise<ProjectSchema | null> {
  const slots = await getAutosaveSlots();
  if (slots.length > 0) {
    return slots[0].project;
  }
  return null;
}
