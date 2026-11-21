// Moonlight Museum — make.fun hand-in program.
// Copies the static game and its screenshots into the output directory,
// then writes the dossier the scorer rebuilds and compares byte for byte.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = import.meta.dirname;
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Caps mirror the bounty gate: 160 KiB of dossier text, at most 4
// screenshots of 256 KiB each, 993 game entries within 48 MiB.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
};

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, DOSSIER_CAPS));
