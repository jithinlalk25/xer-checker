import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatBytes } from './format';
import { Button } from './primitives/button';
import { Checkbox } from './primitives/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './primitives/dialog';
import { SAMPLES, type SampleInfo } from './samples';

interface SamplePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sample files already loaded; shown, but not selectable. */
  loaded: ReadonlySet<string>;
  onLoad: (samples: SampleInfo[]) => void;
}

/** Lists the bundled samples so the user can see what they are and pick which to load. */
export function SamplePicker({ open, onOpenChange, loaded, onLoad }: SamplePickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {/* Mounted only while open, so the selection starts fresh each time. */}
        <PickerBody
          loaded={loaded}
          onLoad={(samples) => {
            onLoad(samples);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function PickerBody({ loaded, onLoad }: { loaded: ReadonlySet<string>; onLoad: (samples: SampleInfo[]) => void }) {
  const available = SAMPLES.filter((s) => !loaded.has(s.file));
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(available.map((s) => s.file)));

  const toggle = (file: string, on: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(file);
      else next.delete(file);
      return next;
    });
  };

  const allSelected = available.length > 0 && available.every((s) => selected.has(s.file));
  const picked = SAMPLES.filter((s) => selected.has(s.file) && !loaded.has(s.file));

  return (
    <>
      <DialogHeader>
        <DialogTitle>Load sample files</DialogTitle>
        <DialogDescription>
          Two real P6 exports found in public GitHub repositories, unchanged. Pick one or both.
        </DialogDescription>
      </DialogHeader>

      <ul className="space-y-2">
        {SAMPLES.map((sample) => {
          const isLoaded = loaded.has(sample.file);
          const id = `sample-${sample.file}`;
          return (
            <li key={sample.file}>
              <label
                htmlFor={id}
                className={cn(
                  'flex gap-3 rounded-lg border p-3 transition-colors',
                  isLoaded ? 'cursor-default opacity-60' : 'cursor-pointer hover:bg-muted/50',
                  selected.has(sample.file) && !isLoaded && 'border-foreground/30 bg-muted/40',
                )}
              >
                <Checkbox
                  id={id}
                  className="mt-0.5"
                  checked={isLoaded || selected.has(sample.file)}
                  disabled={isLoaded}
                  onCheckedChange={(v) => toggle(sample.file, v === true)}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{sample.file}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {isLoaded ? 'Loaded' : formatBytes(sample.size)}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{sample.description}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <DialogFooter className="items-center sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          disabled={available.length === 0}
          onClick={() => setSelected(allSelected ? new Set() : new Set(available.map((s) => s.file)))}
        >
          {allSelected ? 'Clear selection' : 'Select all'}
        </Button>
        <div className="flex gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button disabled={picked.length === 0} onClick={() => onLoad(picked)}>
            {picked.length === 0
              ? 'Load'
              : `Load ${picked.length} ${picked.length === 1 ? 'file' : 'files'}`}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
