import { BarChart3, Cpu, FileUp, FileWarning, FlaskConical, ShieldCheck, Upload, type LucideIcon } from 'lucide-react';
import { RULES } from '@/core';
import { CHECKS } from './checks';
import { InlineLink } from './InlineLink';
import { Button } from './primitives/button';
import { Card, CardContent } from './primitives/card';
import { GroupHeading, IconChip, type Tone } from './SectionParts';

interface IntroProps {
  onLoadSamples: () => void;
  onUpload: () => void;
  onOpenHowItWorks: () => void;
}

interface Feature {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  text: string;
  tag: string;
}

const FEATURES: Feature[] = [
  {
    icon: FileWarning,
    tone: 'amber',
    title: 'Broken rows',
    text: "Every row of every table is read. Rows that can't be used are listed with their line number, the rule they break and what was done with them.",
    tag: `${Object.keys(RULES).length} rules`,
  },
  ...CHECKS.map((c) => ({ icon: c.icon, tone: 'neutral' as const, title: c.title, text: c.summary, tag: `Pass mark: ${c.passMark}` })),
];

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: FileUp, title: 'Load files', text: 'Pick from the sample files, or drop in your own .xer exports. Several at once is fine.' },
  { icon: Cpu, title: 'Read in your browser', text: 'Each file is decoded and checked in a background worker on this page. Nothing is uploaded.' },
  { icon: BarChart3, title: 'Review the results', text: 'One chart across all files, then the flagged activities, broken rows and warnings for each.' },
];

export function Intro({ onLoadSamples, onUpload, onOpenHowItWorks }: IntroProps) {
  return (
    <div className="space-y-14 pb-6">
      <section className="relative isolate -mx-4 -mt-6 px-4 pt-14 pb-6 text-center sm:-mx-6 sm:px-6 sm:pt-20">
        <HeroBackdrop />
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/80 px-3 py-1 text-xs text-muted-foreground shadow-xs">
          <ShieldCheck className="size-3.5" /> Runs in your browser · files are never uploaded
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Check a Primavera P6 schedule file
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg">
          Load one or more .xer exports. The checker reads every row, lists the rows it can't use, and runs 3 basic
          schedule checks: missing links, negative float and high float.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={onLoadSamples}>
            <FlaskConical /> Load sample files
          </Button>
          <Button size="lg" variant="outline" className="bg-card" onClick={onUpload}>
            <FileUp /> Upload your own
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          The samples are 2 real P6 exports from public GitHub repositories, unchanged.
        </p>

        <button
          type="button"
          onClick={onUpload}
          className="group mx-auto mt-10 flex w-full max-w-xl flex-col items-center gap-2 rounded-xl border-2 border-dashed border-foreground/15 bg-card/60 px-6 py-7 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground/70 transition-colors group-hover:text-foreground">
            <Upload className="size-5" />
          </span>
          <span>
            <span className="font-medium text-foreground">Drop .xer files here</span> or click to choose
          </span>
          <span className="text-xs">Any P6 XER export, whatever its file extension.</span>
        </button>
      </section>

      <section className="space-y-4">
        <GroupHeading>What it checks</GroupHeading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardContent className="flex h-full flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <IconChip icon={f.icon} tone={f.tone} />
                  <h3 className="font-medium">{f.title}</h3>
                </div>
                <p className="flex-1 text-muted-foreground">{f.text}</p>
                <span className="self-start rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground/80">{f.tag}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <GroupHeading>How it works</GroupHeading>
        <ol className="grid gap-6 sm:grid-cols-3 sm:gap-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                {i + 1}
              </span>
              <div>
                <h3 className="flex items-center gap-1.5 font-medium">
                  <step.icon className="size-4 text-muted-foreground" aria-hidden="true" /> {step.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="border-t pt-5 text-center text-sm text-muted-foreground">
          Every number traces back to rows in the file and a rule written down in{' '}
          <InlineLink onClick={onOpenHowItWorks}>How this works</InlineLink>.
        </p>
      </section>
    </div>
  );
}

/** A faint dot grid with a soft glow, fading out towards the edges. It runs up behind the header so there is no seam. */
function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-16 bottom-0 -z-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_0%,rgba(42,120,214,0.14),transparent_70%)] dark:bg-[radial-gradient(ellipse_60%_55%_at_50%_0%,rgba(57,135,229,0.20),transparent_70%)]" />
      <div className="absolute inset-0 text-foreground/[0.13] [background-image:radial-gradient(circle,currentColor_1px,transparent_1.2px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent_75%)]" />
    </div>
  );
}
