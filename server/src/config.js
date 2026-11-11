export const PORT = process.env.PORT || 3000;
export const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
export const CONFIRMATIONS_FINAL = 12; // a payment is "final" after this many confirmations

// RPC list per network: your own (env, comma-separated) first, then public fallbacks.
const list = (env, defaults) => [...(env ? env.split(",").map((x) => x.trim()).filter(Boolean) : []), ...defaults];

export const NETWORKS = {
  mainnet: { id: 1, usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    rpcs: list(process.env.MAINNET_RPC, ["https://ethereum-rpc.publicnode.com", "https://eth.llamarpc.com", "https://cloudflare-eth.com"]) },
  sepolia: { id: 11155111, usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    rpcs: list(process.env.SEPOLIA_RPC, ["https://ethereum-sepolia-rpc.publicnode.com", "https://sepolia.drpc.org", "https://rpc.sepolia.org"]) },
};
