import { FileUp } from 'lucide-react';
import { lazy, Suspense, useRef, useState } from 'react';
import { FileBar } from './FileBar';
import { Header } from './Header';
import { Intro } from './Intro';
import { TooltipProvider } from './primitives/tooltip';
import { SamplePicker } from './SamplePicker';
import { useFileDrop } from './useFileDrop';
import { useLoadedFiles } from './useLoadedFiles';

// The chart library is the largest dependency, so it loads only once there are results to show.
const ResultsChart = lazy(() => import('./ResultsChart').then((m) => ({ default: m.ResultsChart })));
// The per-file details (tables and lists) are only needed once a file has been checked.
const Details = lazy(() => import('./Details').then((m) => ({ default: m.Details })));
// The rules text is only needed once someone opens it.
const HowItWorksSheet = lazy(() => import('./HowItWorks').then((m) => ({ default: m.HowItWorksSheet })));

export function App() {
  const { files, addFiles, loadSamples, remove, loadedSamples, allSamplesLoaded } = useLoadedFiles();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragging = useFileDrop(addFiles);
  const [fileId, setFileId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [howOpen, setHowOpen] = useState(false);
  const [howLoaded, setHowLoaded] = useState(false);
  const [samplesOpen, setSamplesOpen] = useState(false);

  const checked = files.filter((f) => f.status === 'done' && f.result);
  const file = checked.find((f) => f.id === fileId) ?? checked[0] ?? null;
  const result = file?.result ?? null;
  const project = result?.projects.find((p) => p.id === projectId) ?? result?.projects[0] ?? null;

  const openPicker = () => inputRef.current?.click();
  const openSamples = () => setSamplesOpen(true);
  const openHowItWorks = () => {
    setHowLoaded(true);
    setHowOpen(true);
  };

  return (
    <TooltipProvider>
      <div id="top" className="min-h-svh">
        <Header onOpenHowItWorks={openHowItWorks} />
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
          {files.length === 0 ? (
            <Intro onLoadSamples={openSamples} onUpload={openPicker} onOpenHowItWorks={openHowItWorks} />
          ) : (
            <>
              <FileBar
                files={files}
                allSamplesLoaded={allSamplesLoaded}
                onRemove={remove}
                onUpload={openPicker}
                onLoadSamples={openSamples}
              />
              {checked.length > 0 && (
                <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted/50" aria-label="Loading chart" />}>
                  <ResultsChart files={checked} />
                </Suspense>
              )}
              {file && result && (
                <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted/50" aria-label="Loading details" />}>
                  <Details
                    files={checked}
                    file={file}
                    result={result}
                    project={project}
                    onFile={(id) => {
                      setFileId(id);
                      setProjectId(null);
                    }}
                    onProject={setProjectId}
                    onOpenHowItWorks={openHowItWorks}
                  />
                </Suspense>
              )}
            </>
          )}
        </main>
        {howLoaded && (
          <Suspense fallback={null}>
            <HowItWorksSheet open={howOpen} onOpenChange={setHowOpen} />
          </Suspense>
        )}
        <SamplePicker open={samplesOpen} onOpenChange={setSamplesOpen} loaded={loadedSamples} onLoad={loadSamples} />
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(Array.from(e.target.files));
            e.target.value = '';
          }}
        />
        {dragging && (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-foreground/30 px-10 py-8">
              <FileUp className="size-8" />
              <p className="font-medium">Drop .xer files to check them</p>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
