import type { ReactNode } from 'react';
import {
  DEFAULT_HOURS_PER_DAY,
  HIGH_FLOAT_DAYS,
  HIGH_FLOAT_MAX_PCT,
  MISSING_LINKS_MAX_PCT,
  RULES,
  type RuleId,
} from '@/core';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './primitives/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './primitives/table';
import { SAMPLES, type SampleInfo } from './samples';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="space-y-2 text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">{children}</div>
    </section>
  );
}

/** Every rule the checker applies, in a side sheet that stays out of the way until asked for. */
export function HowItWorksSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl">
        <SheetHeader className="border-b">
          <SheetTitle className="text-lg">How this works</SheetTitle>
          <SheetDescription>Every rule the checker applies, and where the sample files come from.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-8 overflow-y-auto p-4 leading-relaxed sm:p-6">
        <Section title="Reading the file">
          <p>
            An XER file is tab-separated text. Line 1 starts with <code>ERMHDR</code> and gives the P6 version and export
            date. Each table starts with <code>%T</code>, its field names follow on a <code>%F</code> line, each row is a{' '}
            <code>%R</code> line, and <code>%E</code> ends the file. A file whose first line doesn't start with{' '}
            <code>ERMHDR</code> is refused, whatever its extension.
          </p>
          <p>
            A line ends at LF or CRLF; a lone CR is part of a value. A value that starts with a <code>"</code> is quoted
            and can run over several lines (newer P6 versions write calendar data this way), with <code>""</code>{' '}
            standing for a quote. A row like that is reported at its first line.
          </p>
          <p>
            P6 doesn't say which text encoding it used, so the checker tries UTF-8 first and falls back to Windows-1252.
            Every table is read and its rows counted. The checks use 4 of them: <code>PROJECT</code>,{' '}
            <code>CALENDAR</code>, <code>TASK</code> (activities) and <code>TASKPRED</code> (links). Each project in a
            file is reported separately.
          </p>
          <p>
            <strong>Your files never leave your browser.</strong> They're read and checked on this page, in a background
            worker, and nothing is sent anywhere.
          </p>
        </Section>

        <Section title="Which activities are checked">
          <p>
            All activities in the project except, in this order: <strong>finished</strong> ones, <strong>level of
            effort</strong> and <strong>WBS summary</strong> activities. The overview counts how many were left out for
            each reason.
          </p>
        </Section>

        <Section title="The 3 checks and their pass marks">
          <p>The pass marks follow the DCMA 14-point schedule assessment.</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Check</TableHead>
                <TableHead>Flags a checked activity when</TableHead>
                <TableHead>% worked out on</TableHead>
                <TableHead>Pass mark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_td]:align-top [&_td]:whitespace-normal">
              <TableRow>
                <TableCell className="font-medium text-foreground">Missing links</TableCell>
                <TableCell className="min-w-64">
                  It has no predecessor (unless it's a start milestone) or no successor (unless it's a finish milestone).
                  Any link that isn't skipped counts, including links to other projects, whatever the other activity's
                  status. Each activity is counted once: no predecessor only, no successor only, or neither.
                </TableCell>
                <TableCell>Checked activities</TableCell>
                <TableCell>≤ {MISSING_LINKS_MAX_PCT}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">Negative float</TableCell>
                <TableCell>Its total float is below 0 working days.</TableCell>
                <TableCell>Checked activities with float</TableCell>
                <TableCell>None allowed</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">High float</TableCell>
                <TableCell>Its total float is above {HIGH_FLOAT_DAYS} working days.</TableCell>
                <TableCell>Checked activities with float</TableCell>
                <TableCell>≤ {HIGH_FLOAT_MAX_PCT}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p>
            A % at the pass mark passes (exactly 5.0% is a pass). If there's nothing to work a % out on, it shows "—" and
            the result is "n/a".
          </p>
        </Section>

        <Section title="About float">
          <p>
            The checker doesn't recalculate the schedule. It reads the total float P6 stored for each activity, in hours,
            so <strong>float is only meaningful if the schedule was calculated in P6 before it was exported</strong>.
          </p>
          <p>
            Hours become working days using the hours per day of the activity's calendar. If the calendar is missing, or
            has no hours per day, {DEFAULT_HOURS_PER_DAY} hours a day is assumed and listed as a warning. An unfinished
            activity with no float is listed as a warning and left out of both float checks, but still counts for
            missing links. Comparisons use unrounded values; days and %s are shown to 1 decimal place.
          </p>
        </Section>

        <Section title="Broken rows">
          <p>
            Every problem is listed with its line number, and the checker carries on. Nothing is repaired by guessing.
            Value checks (V) apply only to the 4 tables the checks use; other tables get the layout checks (L).
          </p>
          <RulesTable />
          <p>
            A skipped row is listed once, for the first rule it breaks, checked in the order V1, V3 (IDs), V2, then F and
            S. A kept row can be listed more than once, for example for an unreadable float and a missing calendar, so
            "broken rows" counts lines, not problems. A link whose activities are both outside the file is skipped as
            F3. A second field list in one table, or a second <code>ERMHDR</code> line, is skipped as L5.
          </p>
        </Section>

        <Section title="External links, loops and warnings">
          <p>
            <strong>External link:</strong> a link whose other activity belongs to a project that isn't in the file. It
            isn't broken, it counts as a link, and it's listed under the project whose activity holds it.
          </p>
          <p>
            <strong>Loop:</strong> 2 or more activities that can each reach every other through links inside the file.
            Each group is listed once for the file. Loops don't change the 3 checks.
          </p>
          <p>
            <strong>Warnings</strong> aren't counted as broken rows: the file has no closing <code>%E</code> (it may be
            cut off); an unfinished activity has no float; an activity's hours per day fell back to{' '}
            {DEFAULT_HOURS_PER_DAY}.
          </p>
        </Section>

        <Section title="The sample files">
          <p>
            Two real P6 exports, found in public GitHub repositories and included unchanged. They differ in P6 version,
            size and how many projects they hold, and between them they fail all 3 checks and have broken rows.
          </p>
          <div className="space-y-6">
            {SAMPLES.map((sample) => (
              <SampleDetails key={sample.file} sample={sample} />
            ))}
          </div>
        </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function RulesTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Kind</TableHead>
          <TableHead>Rule</TableHead>
          <TableHead>What happens</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="[&_td]:align-top [&_td]:whitespace-normal">
        {(Object.keys(RULES) as RuleId[]).map((id) => (
          <TableRow key={id}>
            <TableCell className="font-mono text-xs text-foreground">{id}</TableCell>
            <TableCell>{RULES[id].category}</TableCell>
            <TableCell className="min-w-56">{RULES[id].rule}</TableCell>
            <TableCell className="min-w-48">{RULES[id].outcome}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="underline underline-offset-2 hover:text-foreground" href={href} rel="noreferrer" target="_blank">
      {children}
    </a>
  );
}

function SampleDetails({ sample }: { sample: SampleInfo }) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-foreground">
        <code>{sample.file}</code>
      </h4>
      <p>{sample.description}</p>
      <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[8rem_1fr]">
        <dt className="text-foreground">Repository</dt>
        <dd className="break-all">
          <ExternalLink href={sample.source.repoUrl}>{sample.source.repo}</ExternalLink>
        </dd>
        <dt className="text-foreground">File</dt>
        <dd className="break-all">
          <ExternalLink href={sample.source.fileUrl}>{sample.source.fileUrl}</ExternalLink>
        </dd>
        <dt className="text-foreground">Downloaded</dt>
        <dd>{sample.source.downloaded}</dd>
        <dt className="text-foreground">SHA-256</dt>
        <dd className="font-mono text-xs break-all">{sample.sha256}</dd>
        <dt className="text-foreground">Terms</dt>
        <dd>{sample.source.terms}</dd>
      </dl>
    </div>
  );
}
