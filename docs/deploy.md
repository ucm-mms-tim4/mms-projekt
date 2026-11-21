# Deploy and CI

One workflow, `.github/workflows/ci.yml`. Checks run on every push and on PRs into `main`. Only a push to `main` deploys to GitHub Pages.

## Pipeline

- `check` job: install, `lint`, `typecheck`, `format:check`, `test`, `build`. On `main` it also uploads `dist` as the Pages artifact.
- `deploy` job: runs only on push to `main`, after `check` passes.
- Live URL: https://ucm-mms-tim4.github.io/mms-projekt/

## GitHub settings this relies on

- Settings > Pages > Source: **GitHub Actions**.
- Settings > Environments > `github-pages` > Deployment branches: **`main` only**. GitHub allows only the default branch (`dev`) there at first, so change it before the first deploy or the deploy job fails.

## Base path

Pages serves the site under `/mms-projekt/`, set as `base` in `vite.config.ts`. Reference assets through imports or `import.meta.env.BASE_URL`, never with absolute `/...` paths. If the repo is renamed, update `base`.
