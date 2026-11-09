/** The 2 bundled sample files: real P6 exports found in public GitHub repositories, unchanged. */

export interface SampleSource {
  /** The public GitHub repository the file was found in, as owner/name. */
  repo: string;
  repoUrl: string;
  /** The file as it was downloaded. */
  fileUrl: string;
  downloaded: string;
  terms: string;
}

export interface SampleInfo {
  file: string;
  /** Size in bytes. */
  size: number;
  sha256: string;
  description: string;
  source: SampleSource;
}

const NO_LICENSE_TERMS = 'The repository has no license file. Included here unchanged, as a public example.';

export const SAMPLES: SampleInfo[] = [
  {
    file: 'WSE-KE-WSC 2026-01-11R1.xer',
    size: 1713617,
    sha256: 'fc1fabcf2fcf557284a5fc1f1d0df842d593ed133e9fd16f6fe7f629af4712c8',
    description: 'Wolf Summit Energy Center schedule. P6 17.12, 4 projects, 1,289 activities.',
    source: {
      repo: 'digitalvinyl/crunch',
      repoUrl: 'https://github.com/digitalvinyl/crunch',
      fileUrl: 'https://raw.githubusercontent.com/digitalvinyl/crunch/HEAD/WSE-KE-WSC%202026-01-11R1.xer',
      downloaded: '2026-11-09',
      terms: NO_LICENSE_TERMS,
    },
  },
  {
    file: 'Aditya- Smelter-31.10.25.xer',
    size: 1289227,
    sha256: '93b9501285fdaa75f6c38bee4eb52b27f263991597cedae7f5f2e5a0107ccc2d',
    description: 'Aditya smelter expansion (180 pots), updated to 2025-10-31. P6 20.12, 1 project, 1,652 activities.',
    source: {
      repo: 'darasaikumar123456-droid/p6-viewer-schedule-suite',
      repoUrl: 'https://github.com/darasaikumar123456-droid/p6-viewer-schedule-suite',
      fileUrl:
        'https://raw.githubusercontent.com/darasaikumar123456-droid/p6-viewer-schedule-suite/HEAD/Aditya-%20Smelter-31.10.25.xer',
      downloaded: '2026-11-09',
      terms: NO_LICENSE_TERMS,
    },
  },
];

export function sampleByHash(sha256: string | null): SampleInfo | null {
  return sha256 ? (SAMPLES.find((s) => s.sha256 === sha256) ?? null) : null;
}

export function sampleUrl(sample: SampleInfo): string {
  return `${import.meta.env.BASE_URL}samples/${encodeURIComponent(sample.file)}`;
}
