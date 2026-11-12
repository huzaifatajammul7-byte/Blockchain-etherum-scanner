import { Router } from "express";
import { NETWORKS } from "./config.js";
import { network, asset, address, amount, txHash } from "./validate.js";
import * as chain from "./chain.js";

const router = Router();
const wrap = (fn) => (req, res, next) => fn(req, res).then((data) => res.json(data)).catch(next);

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
