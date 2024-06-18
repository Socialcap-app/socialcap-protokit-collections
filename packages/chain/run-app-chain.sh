#/bin/bash
pnpm build

node \
  --experimental-specifier-resolution=node \
  --experimental-vm-modules \
  --experimental-wasm-modules \
  --experimental-wasm-threads \
  ./dist/main-app-chain.js start ./dist/chain.config.js
