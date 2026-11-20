# Publishing

Releases use [Changesets](https://github.com/changesets/changesets) and `pnpm publish` with npm [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC); there is no `NPM_TOKEN`.

## Flow

1. Commit a changeset with each releasable change (`pnpm changeset`).
2. On every push to `trunk`, [`release.yml`](../.github/workflows/release.yml) opens or updates a "chore: version packages" PR while unreleased changesets exist.
3. Merging that PR runs the `publish` job in the protected `release` environment: the workflow builds every package, then [`scripts/publish.mjs`](../scripts/publish.mjs) `pnpm pack`s (rewriting `catalog:` and `workspace:*`) and `pnpm publish`es every package whose version isn't on npm yet, then tags and releases it.

## One-time setup

1. A `release` environment, deployable from `trunk` only, with the owner as required reviewer.
2. _Settings → Actions → General_: allow GitHub Actions to create pull requests.
3. A trusted publisher on npmjs.com for each package (repository `thomasfosterau/components`, workflow `release.yml`, environment `release`). npm accepts one only for an existing package, so publish a new package's first version by hand with a short-lived token, then add the publisher.
