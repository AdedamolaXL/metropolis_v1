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

node version v20.9.0 for the contracts (maybe same version works also for the frontend and backend)


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

