# Security policy

## Reporting a vulnerability

Report security vulnerabilities privately through GitHub's [**Report a vulnerability**](https://github.com/thomasfosterau/components/security/advisories/new) form (_Security → Advisories_), **not** in a public issue. Include a description, reproduction steps, and the affected package and version. Expect a first response within a few days.

The three packages are UI and chart libraries: they run in your application's browser bundle or server render and hold no credentials. The likeliest vulnerabilities are markup injection through a prop rendered as HTML, and an unsafe URL reaching an `href` or `src`; both are in scope.

## Supply chain

The packages are published by an automated pipeline built to resist supply-chain attacks such as worms that steal npm credentials and publish trojanized versions. [PUBLISHING.md](./PUBLISHING.md) has the flow and its setup.

- **No long-lived npm token.** Releases use npm [trusted publishing](https://docs.npmjs.com/trusted-publishers): the release workflow proves its identity to npm with a short-lived OIDC token bound to this repository, `release.yml` and the `release` environment. There is no `NPM_TOKEN` secret to steal.
- **Provenance.** npm attaches [provenance](https://docs.npmjs.com/generating-provenance-statements) to what the workflow publishes from this public repository, linking each tarball to the commit and workflow run that built it.
- **No install scripts where it matters.** The release job installs with `pnpm install --frozen-lockfile --ignore-scripts`, so a compromised dependency cannot run an install hook in the job that can publish. Everywhere else, install scripts are opt-in per package (`allowBuilds` in `pnpm-workspace.yaml`); CI runs the workspace's own `prepare` (the `@effect/tsgo` patch the type gate needs) with read-only permissions.
- **Pinned actions.** Every GitHub Action, including those in the local `.github/actions/setup`, is pinned to a full commit SHA, so a moved tag cannot inject workflow code.
- **Least privilege.** Workflows default to `permissions: {}` and each job opts into the scopes it uses. CI checks out with `persist-credentials: false`.
- **Publishing behind an environment.** Publishing runs only in the protected `release` environment, deployable from `trunk` alone, and the workflow refuses to run in a fork.
- **Locked dependencies with a cooling-off period.** Installs use `--frozen-lockfile` against the committed `pnpm-lock.yaml`. `minimumReleaseAge` holds newly published third-party versions for 8 hours before pnpm will install them, and Dependabot proposes updates after a one-day cooldown (its smallest unit, so never a version pnpm would still refuse). First-party `@thomasfosterau/*` releases are exempt.
- **Audited.** CI ends with `pnpm audit --audit-level high`, so a known high or critical advisory in the dependency tree fails the build.
