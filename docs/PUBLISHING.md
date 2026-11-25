# Publishing

Releases use [Changesets](https://github.com/changesets/changesets) and `vp pm publish` (pnpm) with npm [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC); there is no `NPM_TOKEN`.

## Flow

1. Commit a changeset with each releasable change (`pnpm changeset`).
2. On every push to `trunk`, [`release.yml`](../.github/workflows/release.yml) opens or updates a "chore: version packages" PR while unreleased changesets exist.
3. Merging that PR runs the `publish` job in the protected `release` environment, whose only publish step is `vp run release` (a task in the root [`vite.config.ts`](../vite.config.ts)). It builds every package, then `vp pm publish -r --access public --no-git-checks -- --ignore-scripts` packs (rewriting `catalog:` and `workspace:` specifiers) and publishes every public package whose version isn't on npm yet, in dependency order, and `changeset git-tag` tags each new version; the action pushes the tags and creates the GitHub releases. A failed publish stops before tagging, and a re-run publishes only what is missing. There is no publish script.

`release` depends only on the builds: it runs with `id-token: write`, so nothing in it installs or fetches packages.

## One-time setup

1. A `release` environment, deployable from `trunk` only, with the owner as required reviewer.
2. _Settings → Actions → General_: allow GitHub Actions to create pull requests.
3. A trusted publisher on npmjs.com for each package (repository `thomasfosterau/components`, workflow `release.yml`, environment `release`). npm accepts one only for an existing package, so publish a new package's first version by hand with a short-lived token, then add the publisher.

## By hand

To publish without the workflow (a first version, or a recovery), with npm credentials for the packages: `vp run release:dry-run` to see what would be published, then `vp run release`, then `git push origin --tags`.
