# Security

Report vulnerabilities privately through [GitHub's advisory form](https://github.com/thomasfosterau/components/security/advisories/new), not in a public issue. Include the affected package and version and steps to reproduce.

These are UI, chart and data-import libraries that run in your app and hold no credentials. Markup injection through a prop and unsafe URLs reaching `href` or `src` are in scope.

## Supply chain

- Publishing uses `pnpm publish` with npm trusted publishing from a protected environment, so there is no long-lived token, and pnpm attaches provenance.
- The publishing job installs with `--ignore-scripts`; elsewhere dependency build scripts run only if listed in `allowBuilds`.
- Actions are pinned by `.github/workflows/actions.lock`; workflows default to `permissions: {}`.
- pnpm waits 24 hours (`minimumReleaseAge`) before installing a new third-party release, and CI fails on a high-severity `pnpm audit` finding.
