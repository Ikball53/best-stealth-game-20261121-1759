// Hand-in program for Ink & Ivory: The Map Vault.
// Copies the static game and its screenshots into the output directory,
// then writes the dossier the scorer rebuilds and compares byte for byte.
import { buildDossier } from './vendor/makefun-game.ts';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function freshCopy(fromDir: string, toDir: string): void {
  // Fail loudly on a missing input instead of handing in an empty game.
  if (!existsSync(fromDir)) {
    throw new Error(`missing input directory: ${fromDir}`);
  }
  rmSync(toDir, { recursive: true, force: true });
  mkdirSync(toDir, { recursive: true });
  cpSync(fromDir, toDir, { recursive: true });
}

const gameIndex = join(repoRoot, 'game', 'index.html');
if (!existsSync(gameIndex)) {
  throw new Error(`missing game page: ${gameIndex}`);
}

mkdirSync(outputDir, { recursive: true });
freshCopy(join(repoRoot, 'game'), join(outputDir, 'game'));
freshCopy(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));

const dossierBytes = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);
console.log(`dossier written: ${dossierBytes.length} bytes to ${outputDir}`);
