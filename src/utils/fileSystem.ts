import { ProjectSchema } from '../types/beads';
import { projectFromJSON, projectFromXML, projectToJSON, projectToXML } from './projectSerialization';

export async function saveProjectToFile(project: ProjectSchema): Promise<boolean> {
  const json = projectToJSON(project);
  const fileName = `${project.name.toLowerCase().replace(/[^a-z0-9а-яіїєґ_]+/gi, '_')}.beadsproj`;

  // Try File System Access API if supported
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as unknown as {
        showSaveFilePicker: (options: unknown) => Promise<FileSystemFileHandle>;
      }).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'BeadsViewer Project (*.beadsproj, *.json)',
            accept: {
              'application/json': ['.beadsproj', '.json'],
            },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
      return true;
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        return false; // User cancelled
      }
      console.warn('File System Access API failed, falling back to download:', err);
    }
  }

  // Fallback: direct blob download
  downloadBlob(json, fileName, 'application/json');
  return true;
}

export function openProjectFromFile(): Promise<ProjectSchema> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.beadsproj,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const project = projectFromJSON(text);
        resolve(project);
      } catch (err) {
        reject(err);
      }
    };
    input.click();
  });
}

export function exportProjectToXMLFile(project: ProjectSchema): void {
  const xml = projectToXML(project);
  const fileName = `${project.name.toLowerCase().replace(/[^a-z0-9а-яіїєґ_]+/gi, '_')}.xml`;
  downloadBlob(xml, fileName, 'application/xml');
}

export function importProjectFromXMLFile(): Promise<ProjectSchema> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xml';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const project = projectFromXML(text);
        resolve(project);
      } catch (err) {
        reject(err);
      }
    };
    input.click();
  });
}

export function downloadBlob(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
