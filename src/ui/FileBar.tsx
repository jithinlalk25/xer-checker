import { AlertCircle, FileUp, FlaskConical, FolderOpen, Loader2, X } from 'lucide-react';
import { FileName } from './FileName';
import { formatBytes, formatCount } from './format';
import { Button } from './primitives/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from './primitives/card';
import { SectionTitle } from './SectionParts';
import type { LoadedFile } from './useLoadedFiles';

interface FileBarProps {
  files: LoadedFile[];
  allSamplesLoaded: boolean;
  onRemove: (id: string) => void;
  onUpload: () => void;
  onLoadSamples: () => void;
}

export function FileBar({ files, allSamplesLoaded, onRemove, onUpload, onLoadSamples }: FileBarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <SectionTitle icon={FolderOpen} count={files.length}>
            Files
          </SectionTitle>
        </CardTitle>
        <CardDescription>Read and checked in your browser. Drop more .xer files anywhere on the page.</CardDescription>
        <CardAction className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onUpload}>
            <FileUp /> Upload
          </Button>
          {!allSamplesLoaded && (
            <Button variant="outline" size="sm" onClick={onLoadSamples}>
              <FlaskConical /> Sample files
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="divide-y rounded-lg border">
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <FileName name={file.name} className="max-w-full" />
                <FileStatusLine file={file} />
              </div>
              <Button variant="ghost" size="icon-sm" aria-label={`Remove ${file.name}`} onClick={() => onRemove(file.id)}>
                <X />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function FileStatusLine({ file }: { file: LoadedFile }) {
  const size = file.size === null ? null : formatBytes(file.size);
  switch (file.status) {
    case 'reading':
    case 'checking':
      return (
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
          <Loader2 className="size-3.5 animate-spin" />
          {file.status === 'reading' ? 'Reading file…' : 'Checking…'}
          {size && <span>· {size}</span>}
        </p>
      );
    case 'refused':
    case 'failed':
      return (
        <p className="mt-0.5 flex items-start gap-1.5 text-xs text-destructive" role="alert">
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          {file.error}
        </p>
      );
    case 'done': {
      const r = file.result;
      if (!r) return null;
      const parts = [
        size,
        `${formatCount(r.activityCount)} activities`,
        `${formatCount(r.brokenRowCount)} broken ${r.brokenRowCount === 1 ? 'row' : 'rows'}`,
        r.warnings.length > 0 ? `${r.warnings.length} ${r.warnings.length === 1 ? 'warning' : 'warnings'}` : null,
      ].filter(Boolean);
      return <p className="mt-0.5 text-xs text-muted-foreground">{parts.join(' · ')}</p>;
    }
  }
}
