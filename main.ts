// Night Vault handoff: ship the stealth game and its dossier to the grader output folder.
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const DOSSIER_TEXT_CAP = 163840;
const SHOT_COUNT_CAP = 4;
const SHOT_BYTE_CAP = 262144;
const GAME_ENTRY_CAP = 993;
const GAME_BYTE_CAP = 50331648;
const GAME_PATH_CAP = 1000;

function repoRoot(): string {
  return dirname(fileURLToPath(import.meta.url));
}

function outputFolder(): string {
  const override = process.env.MAKEFUN_OUTPUT_DIR;
  if (override && override.length > 0) return resolve(override);
  return "/output";
}

function mirrorFolder(sourceDir: string, targetDir: string): void {
  if (!existsSync(sourceDir)) throw new Error(`missing folder: ${sourceDir}`);
  mkdirSync(targetDir, { recursive: true });
  cpSync(sourceDir, targetDir, { recursive: true, dereference: false });
}

function handIn(): void {
  const root = repoRoot();
  const out = outputFolder();
  mkdirSync(out, { recursive: true });
  mirrorFolder(join(root, "game"), join(out, "game"));
  mirrorFolder(join(root, "screenshots"), join(out, "screenshots"));
  const dossierBytes = buildDossier(out, {
    text_max_bytes: DOSSIER_TEXT_CAP,
    screenshots: { max: SHOT_COUNT_CAP, max_bytes: SHOT_BYTE_CAP },
    game_max_files: GAME_ENTRY_CAP,
    game_max_bytes: GAME_BYTE_CAP,
    game_path_max_bytes: GAME_PATH_CAP,
  });
  writeFileSync(join(out, "dossier.json"), dossierBytes);
  console.log(`handed in: game + screenshots + dossier.json (${dossierBytes.length} bytes) -> ${out}`);
}

handIn();
