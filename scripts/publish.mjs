/**
 * The release workflow's publish step: every public workspace package whose
 * current version is not yet on npm is packed by pnpm and published by npm.
 *
 * Why not `changeset publish` or `pnpm publish -r`: npm Trusted Publishing
 * (OIDC) is implemented in the npm CLI only, and a workspace publish routed
 * through pnpm never exchanges the GitHub `id-token` for an npm credential —
 * it falls back to token auth and fails with ENEEDAUTH. And why not bare
 * `npm publish` in the package directory: npm does not understand pnpm's
 * `catalog:` and `workspace:*` specifiers, and would ship them verbatim. So
 * each package is split into the half each tool is good at: `pnpm pack`
 * rewrites the specifiers into the tarball, and `npm publish <tarball>`
 * authenticates via OIDC (provenance is left to npm, never forced: an explicit
 * request fails from a private repository).
 *
 * `changesets/action` creates the git tags and GitHub releases, but only for
 * what this script reports: one `{"type":"git-tag",…}` line per published
 * package, appended to the NDJSON file named by `CHANGESETS_OUTPUT`.
 *
 * Idempotent: a version already on the registry is skipped, so a re-run after
 * a partial failure publishes only what is missing.
 */

import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const packagesDir = join(root, 'packages');

/** @typedef {{ name: string; version: string; private?: boolean; dependencies?: Record<string, string>; peerDependencies?: Record<string, string> }} Manifest */

/** @type {{ dir: string; manifest: Manifest }[]} */
const packages = readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const dir = join(packagesDir, entry.name);
    /** @type {Manifest} */
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    return { dir, manifest };
  })
  .filter(({ manifest }) => !manifest.private);

// Dependencies first, so a consumer never resolves a sibling version that is
// not on the registry yet (`@thomasfosterau/components-maps` depends on
// `@thomasfosterau/components`).
const names = new Set(packages.map(({ manifest }) => manifest.name));
/** @param {Manifest} manifest */
const siblingCount = (manifest) =>
  Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies }).filter((dep) =>
    names.has(dep),
  ).length;
packages.sort((a, b) => siblingCount(a.manifest) - siblingCount(b.manifest));

/** @param {string} name @param {string} version */
const isPublished = (name, version) => {
  try {
    execFileSync('npm', ['view', `${name}@${version}`, 'version'], { stdio: 'pipe' });
    return true;
  } catch (error) {
    const stderr = String(/** @type {{ stderr?: unknown }} */ (error).stderr ?? '');
    if (stderr.includes('E404')) return false;
    throw error;
  }
};

const packDir = mkdtempSync(join(tmpdir(), 'components-publish-'));
const output = process.env['CHANGESETS_OUTPUT'];
let published = 0;

for (const { dir, manifest } of packages) {
  const { name, version } = manifest;
  if (isPublished(name, version)) {
    console.log(`skip     ${name}@${version} (already on npm)`);
    continue;
  }

  const before = new Set(readdirSync(packDir));
  execFileSync('pnpm', ['pack', '--pack-destination', packDir], { cwd: dir, stdio: 'inherit' });
  const tarball = readdirSync(packDir).find((file) => !before.has(file));
  if (tarball === undefined) throw new Error(`pnpm pack produced no tarball for ${name}`);

  execFileSync('npm', ['publish', join(packDir, tarball), '--access', 'public'], {
    stdio: 'inherit',
  });
  console.log(`publish  ${name}@${version}`);
  published += 1;

  if (output !== undefined && output !== '') {
    const event = { type: 'git-tag', tag: `${name}@${version}`, packageName: name };
    appendFileSync(output, `${JSON.stringify(event)}\n`);
  }
}

console.log(`${published} package(s) published`);
