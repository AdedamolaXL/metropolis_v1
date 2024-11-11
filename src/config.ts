import { createConfig, http } from 'wagmi';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { Taiko } from '@wagmi/chains'; // Import Taiko chain information

// ... (other imports)

// Define custom Taiko chain configurations
const taikoTestnet: Chain = {
  ...Taiko,
  id: 167004, // Taiko testnet Chain ID
  name: 'Taiko Testnet (L2)',
  network: 'taiko-testnet-l2',
  rpcUrls: {
    public: { http: ['https://rpc.test.taiko.xyz'] },
    default: { http: ['https://rpc.test.taiko.xyz'] },
  },
  blockExplorers: {
    etherscan: {
      name: 'Blockscout',
      url: 'https://explorer.test.taiko.xyz',
    },
    default: {
      name: 'Blockscout',
      url: 'https://explorer.test.taiko.xyz',
    },
  },
  testnet: true,
};

const taikoMainnet: Chain = {
  ...Taiko,
  id: 167005, // Taiko mainnet Chain ID
  name: 'Taiko (L2)',
  network: 'taiko-l2',
  rpcUrls: {
    public: { http: ['https://rpc.taiko.xyz'] },
    default: { http: ['https://rpc.taiko.xyz'] },
  },
  blockExplorers: {
    etherscan: { name: 'Etherscan', url: 'https://explorer.taiko.xyz' },
    default: { name: 'Etherscan', url: 'https://explorer.taiko.xyz' },
  },
};

// Wagmi configuration for localhost
export const localhostConfig = createConfig({
  autoConnect: true,
  connectors: [],
  provider: jsonRpcProvider({
    rpc: (chain) => ({
      http: 'http://localhost:8545',
    }),
  }),
});

// Wagmi configuration for Taiko testnet and mainnet
export const taikoConfig = createConfig({
  autoConnect: true,
  connectors: [metaMask()],
  chains: [taikoTestnet, taikoMainnet],
  transports: {
    [taikoTestnet.id]: http(),
    [taikoMainnet.id]: http(),
  },
});