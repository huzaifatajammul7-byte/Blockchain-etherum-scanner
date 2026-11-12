import { isAddress } from "ethers";
import { NETWORKS } from "./config.js";
import { bad } from "./errors.js";

export const network = (v = "mainnet") => { if (!NETWORKS[v]) throw bad("Unknown network. Use mainnet or sepolia."); return v; };
export const asset = (v = "ETH") => { if (!["ETH", "USDC"].includes(v)) throw bad("Asset must be ETH or USDC."); return v; };
export const address = (v, name) => { if (!isAddress(v || "")) throw bad(`Invalid ${name} address.`); return v; };
export const amount = (v, asset) => {
  const max = asset === "USDC" ? 6 : 18;
  if (!new RegExp(`^\\d+(\\.\\d{1,${max}})?$`).test(v || "")) throw bad(`Invalid amount (max ${max} decimals).`);
  return v;
};
export const txHash = (v) => { if (!/^0x[0-9a-fA-F]{64}$/.test(v || "")) throw bad("Invalid transaction hash."); return v; };
