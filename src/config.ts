import { http, createConfig } from 'wagmi'
import { taiko, hardhat, taikoHekla } from 'wagmi/chains'
import {  metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [taiko, hardhat, taikoHekla],
  connectors: [ metaMask()],
  transports: {
    [taiko.id]: http(),
    [taikoHekla.id]: http(),
    [hardhat.id]: http(),
  },
})