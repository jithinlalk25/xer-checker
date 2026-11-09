import type { FileResult, ProjectResult } from '@/core';
import { BrokenRows } from './BrokenRows';
import { CheckCards } from './CheckCards';
import { FlaggedLists } from './FlaggedLists';
import { ExternalLinks, Loops, Warnings } from './OtherLists';
import { FileSummary } from './Overview';
import { Alert, AlertDescription, AlertTitle } from './primitives/alert';
import { GroupHeading } from './SectionParts';
import { DetailsBar } from './Switcher';
import type { LoadedFile } from './useLoadedFiles';

interface DetailsProps {
  files: LoadedFile[];
  file: LoadedFile;
  result: FileResult;
  project: ProjectResult | null;
  onFile: (id: string) => void;
  onProject: (id: string) => void;
  onOpenHowItWorks: () => void;
}

/** Everything about the selected file: summary, checks, flagged activities and problems. */
export function Details({ files, file, result, project, onFile, onProject, onOpenHowItWorks }: DetailsProps) {
  return (
    <section className="space-y-6" aria-label="Details for the selected file">
      <DetailsBar
        files={files}
        file={file}
        result={result}
        project={project}
        onFile={onFile}
        onProject={onProject}
      />
      <FileSummary result={result} project={project} />

      {project ? (
        <div className="space-y-4">
          <GroupHeading>Checks</GroupHeading>
          <CheckCards project={project} />
          <FlaggedLists key={`${file.id}:${project.id}`} project={project} />
        </div>
      ) : (
        <Alert>
          <AlertTitle>No projects to check</AlertTitle>
          <AlertDescription>
            This file has no project with at least one activity, so there is nothing to run the checks on.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <GroupHeading>Problems and notes</GroupHeading>
        <BrokenRows key={file.id} result={result} onOpenHowItWorks={onOpenHowItWorks} />
        {/* items-start: a short card (no loops, say) keeps its own height instead of matching a long one. */}
        <div className="grid items-start gap-4 lg:grid-cols-3">
          <Warnings result={result} />
          <Loops result={result} />
          <ExternalLinks project={project} />
        </div>
      </div>
    </section>
  );
}
