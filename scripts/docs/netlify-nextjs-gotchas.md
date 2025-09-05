# Netlify × Next.js Build Gotchas

- Pin Node: use one of
  - `engines.node` in `package.json` (e.g., `"engines": {"node": "20.x"}`)
  - `.nvmrc` with a version like `20.12.2`
  - `netlify.toml` under `[build.environment] NODE_VERSION = "20.12.2"`

- Keep exactly **one** lockfile (`pnpm-lock.yaml`, `yarn.lock`, or `package-lock.json`) committed.

- The `<Html>` component from `next/document` must only be used in `pages/_document.{js,tsx}`.

- Install Netlify CLI for local parity:
  ```bash
  npm i -g netlify-cli
  netlify build
  ```
