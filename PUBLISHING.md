# Publishing & releases

Releases are automated with [Changesets](https://github.com/changesets/changesets) and published to npm through [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC). There is no `NPM_TOKEN`. The security rationale is in [SECURITY.md](./SECURITY.md).

## The release flow

1. **Add a changeset with your change.** Run `pnpm changeset`, pick the packages and the bump (`patch` / `minor` / `major`), write a user-facing summary, and commit the generated file with the change. Which changes need one is in [AGENTS.md § Branches and pull requests](./AGENTS.md#branches-and-pull-requests); a doc-comment change that reaches the emitted `.d.ts` takes a `patch`.
2. **Merge to `trunk`.** [`release.yml`](./.github/workflows/release.yml) runs [`changesets/action`](https://github.com/changesets/action) on every push to `trunk`. While unreleased changesets exist it opens (or updates) a **"chore: version packages"** pull request that applies the version bumps and rolls the changesets into each package's `CHANGELOG.md`.
3. **Merge the version pull request.** With no changesets left, the same workflow builds every package (`vp run -r build`) and publishes each one whose version is not yet on npm, then tags the release and creates a GitHub release per package. Never version or publish by hand.

The publish step is [`scripts/publish.mjs`](./scripts/publish.mjs): `pnpm pack` (which rewrites `catalog:` and `workspace:*` to real ranges) and then `npm publish <tarball>`, dependencies first. Its header says why it is kept now that pnpm 11 can publish through OIDC itself. The npm CLI exchanges the job's `id-token: write` permission for a short-lived publish credential; that needs npm 11.5.1 or later, which the npm bundled with Node `latest` meets, so the job never upgrades npm. Nothing requests provenance explicitly: npm attaches it on its own wherever it is allowed (a public repository and a public package).

The release job installs with `--ignore-scripts`, so no dependency's install script runs in the job that holds `id-token: write`.

## One-time owner setup

1. **The `release` environment.** _Settings → Environments → New environment_ `release`, with _Deployment branches and tags_ restricted to `trunk`. Adding yourself as a required reviewer makes every publish wait for approval. The workflow's job runs in this environment and the trusted publishers below name it.
2. **Let Actions open the version PR.** _Settings → Actions → General → Workflow permissions →_ **Allow GitHub Actions to create and approve pull requests**. Without it the built-in `GITHUB_TOKEN` cannot open the pull request, although the job grants `pull-requests: write`.
3. **A trusted publisher per package** on npmjs.com, for each of `@thomasfosterau/components`, `@thomasfosterau/components-mapbox` and `@thomasfosterau/charts`: _Settings → Trusted Publisher → GitHub Actions_, user `thomasfosterau`, repository `components`, workflow `release.yml`, environment `release`. npm accepts a trusted publisher only on a package that already exists, so bootstrap a never-published package once by hand: merge the version PR first so `trunk` carries the real version, then run `vp run -r build` and `pnpm publish --access public` in that package's directory with a short-lived granular token, and add the trusted publisher afterwards. Remove any `NPM_TOKEN` repository secret once OIDC is in place.
4. **Protect `trunk`.** Require pull requests and the `CI` check before merge, so a release can only start from a reviewed merge.
