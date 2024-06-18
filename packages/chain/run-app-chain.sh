#/bin/bash
pnpm build

node \
  --loader ts-node/esm \
  --experimental-specifier-resolution=node \
  --experimental-vm-modules \
  --experimental-wasm-modules \
  --experimental-wasm-threads \
  ./src/main-app-chain.ts start ./dist/chain.config.js
