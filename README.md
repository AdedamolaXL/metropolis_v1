# Metropolis

node version v18.18 

# Run frontend

```bash
bun install
bun run dev
```

# run backend

`ts-node server.ts`

# metropolis_contracts

* mainnet - 0x1afbcd65198e8d7f75800be2a72e92d5a7d475a7
* testnet - 0xB8bEb46C16eE24b25d1c46824a9296918261b1c2
- node version v20.9.0 for the contracts (maybe same version works also for the frontend and backend)


## start chain

`yarn chain` (in a separate terminal)

## deploy contracts and add properties

deploy contracts:
`yarn deploy --network localhost`

add properties:
`yarn hardhat  run scripts/add_property.js --network localhost`


### reference
based on crypto_cartels monopoly game
https://github.com/ankit875/crypto-cartels

