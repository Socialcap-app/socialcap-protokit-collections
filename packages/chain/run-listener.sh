#/bin/bash
pnpm build

node \
  --loader ts-node/esm \
  --experimental-vm-modules \
  --experimental-wasm-modules \
  --experimental-wasm-threads \
  ./src/main-nats-listener.ts