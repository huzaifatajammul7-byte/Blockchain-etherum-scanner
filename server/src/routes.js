import { Router } from "express";
import { isAddress } from "ethers";
import { NETWORKS } from "./config.js";
import { bad } from "./errors.js";
import * as chain from "./chain.js";

const router = Router();
const wrap = (fn) => (req, res, next) => fn(req, res).then((data) => res.json(data)).catch(next);

// ---- validators ----
const network = (v = "mainnet") => { if (!NETWORKS[v]) throw bad("Unknown network. Use mainnet or sepolia."); return v; };
const asset = (v = "ETH") => { if (!["ETH", "USDC"].includes(v)) throw bad("Asset must be ETH or USDC."); return v; };
const address = (v, name) => { if (!isAddress(v || "")) throw bad(`Invalid ${name} address.`); return v; };
const amount = (v, asset) => {
  const max = asset === "USDC" ? 6 : 18;
  if (!new RegExp(`^\\d+(\\.\\d{1,${max}})?$`).test(v || "")) throw bad(`Invalid amount (max ${max} decimals).`);
  return v;
};
const txHash = (v) => { if (!/^0x[0-9a-fA-F]{64}$/.test(v || "")) throw bad("Invalid transaction hash."); return v; };

router.get("/health", (_, res) => res.json({ ok: true, time: new Date().toISOString() }));

router.get("/config", (_, res) =>
  res.json(Object.fromEntries(Object.entries(NETWORKS).map(([k, v]) => [k, { id: v.id, usdc: v.usdc }]))));

router.get("/balance", wrap(async (req) => {
  const q = req.query;
  return chain.getBalance({ network: network(q.network), asset: asset(q.asset), address: address(q.address, "wallet") });
}));

router.get("/verify", wrap(async (req) => {
  const q = req.query, a = asset(q.asset);
  return chain.verifyPayment({ network: network(q.network), asset: a, tx: txHash(q.tx), to: address(q.to, "receiver"), amount: amount(q.amount, a) });
}));

export default router;
