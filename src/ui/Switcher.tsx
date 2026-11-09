import type { FileResult, ProjectResult } from '@/core';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './primitives/select';
import type { LoadedFile } from './useLoadedFiles';

interface DetailsBarProps {
  files: LoadedFile[];
  file: LoadedFile;
  result: FileResult;
  project: ProjectResult | null;
  onFile: (id: string) => void;
  onProject: (id: string) => void;
}

/**
 * Picks the file, then the project, that everything below shows. It sticks to the top while the
 * details scroll, so it's always clear which file they belong to.
 */
export function DetailsBar({ files, file, result, project, onFile, onProject }: DetailsBarProps) {
  const projects = result.projects;
  const problems = [
    [result.brokenRowCount, 'broken row', 'broken rows', 'bg-amber-500'],
    [result.warnings.length, 'warning', 'warnings', 'bg-amber-500'],
    [result.loops.length, 'loop', 'loops', 'bg-rose-500'],
  ] as const;

  return (
    <div className="sticky top-0 z-20 -mx-4 border-y bg-background/85 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6">
      <div className="flex items-center gap-x-3 gap-y-2 sm:flex-wrap">
        <span className="shrink-0 text-sm font-semibold">Details for</span>
        <Select value={file.id} onValueChange={onFile}>
          <SelectTrigger aria-label="File" className="min-w-0 flex-1 bg-card font-medium sm:max-w-md sm:flex-none *:data-[slot=select-value]:block *:data-[slot=select-value]:truncate">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {files.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {projects.length > 1 && project && (
          <Select value={project.id} onValueChange={onProject}>
            <SelectTrigger aria-label="Project" className="min-w-0 flex-1 bg-card sm:max-w-xs sm:flex-none *:data-[slot=select-value]:block *:data-[slot=select-value]:truncate">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name || `Project ${p.id}`} (ID {p.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {/* On phones the summary tiles carry these counts, so the bar stays one line. */}
        <ul className="ml-auto hidden flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:flex">
          {problems.map(([n, one, many, dot]) => (
            <li key={one} className="flex items-center gap-1.5">
              <span className={n > 0 ? `size-1.5 rounded-full ${dot}` : 'size-1.5 rounded-full bg-muted-foreground/40'} aria-hidden="true" />
              {n.toLocaleString('en-US')} {n === 1 ? one : many}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
