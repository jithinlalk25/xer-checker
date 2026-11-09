import { useCallback, useRef, useState } from 'react';
import type { FileResult } from '@/core';
import { CheckError, checkInWorker } from '@/worker/client';
import { SAMPLES, sampleByHash, sampleUrl, type SampleInfo } from './samples';

export type FileStatus = 'reading' | 'checking' | 'done' | 'refused' | 'failed';

export interface LoadedFile {
  id: string;
  name: string;
  size: number | null;
  status: FileStatus;
  /** Set when the file is one of the bundled samples (loaded as a sample, or recognised by its hash). */
  sample: SampleInfo | null;
  result: FileResult | null;
  error: string | null;
}

let counter = 0;
const nextId = () => `file-${++counter}`;

export function useLoadedFiles() {
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const cancels = useRef(new Map<string, () => void>());
  const removed = useRef(new Set<string>());

  const update = useCallback((id: string, patch: Partial<LoadedFile>) => {
    setFiles((current) => current.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  /** Adds a placeholder at once, then checks the bytes in a worker as soon as they arrive. */
  const start = useCallback(
    (name: string, sample: SampleInfo | null, getBytes: () => Promise<ArrayBuffer>) => {
      const id = nextId();
      setFiles((current) => [...current, { id, name, size: null, status: 'reading', sample, result: null, error: null }]);

      getBytes()
        .then((bytes) => {
          if (removed.current.has(id)) return;
          update(id, { size: bytes.byteLength });
          const job = checkInWorker(id, name, bytes, (stage) => update(id, { status: stage }));
          cancels.current.set(id, job.cancel);
          return job.promise.then(({ result, sha256 }) => {
            update(id, { status: 'done', result, sample: sample ?? sampleByHash(sha256) });
          });
        })
        .catch((err: unknown) => {
          if (err instanceof CheckError) update(id, { status: err.refused ? 'refused' : 'failed', error: err.message });
          else update(id, { status: 'failed', error: err instanceof Error ? err.message : String(err) });
        })
        .finally(() => cancels.current.delete(id));
      return id;
    },
    [update],
  );

  const addFiles = useCallback(
    (list: Iterable<File>) => {
      for (const file of list) start(file.name, null, () => file.arrayBuffer());
    },
    [start],
  );

  const loadSamples = useCallback(
    (samples: SampleInfo[]) => {
      for (const sample of samples) {
        start(sample.file, sample, async () => {
          const response = await fetch(sampleUrl(sample));
          if (!response.ok) throw new Error(`The sample file couldn't be loaded (HTTP ${response.status}).`);
          return response.arrayBuffer();
        });
      }
    },
    [start],
  );

  const remove = useCallback((id: string) => {
    removed.current.add(id);
    cancels.current.get(id)?.();
    cancels.current.delete(id);
    setFiles((current) => current.filter((f) => f.id !== id));
  }, []);

  /** Samples already loaded, whether picked as samples or uploaded and recognised by their hash. */
  const loadedSamples = new Set(files.flatMap((f) => (f.sample ? [f.sample.file] : [])));
  const allSamplesLoaded = SAMPLES.every((s) => loadedSamples.has(s.file));

  return { files, addFiles, loadSamples, remove, loadedSamples, allSamplesLoaded };
}
