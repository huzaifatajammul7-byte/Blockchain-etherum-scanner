import { JsonRpcProvider, FallbackProvider, Contract, Interface, formatEther, formatUnits, parseEther, parseUnits } from "ethers";
import { NETWORKS, CONFIRMATIONS_FINAL } from "./config.js";
import { bad } from "./errors.js";

const ERC20 = ["function balanceOf(address) view returns (uint256)", "event Transfer(address indexed from, address indexed to, uint256 value)"];
const iface = new Interface(ERC20);

const providers = {};
export function provider(network) {
  const cfg = NETWORKS[network];
  if (!cfg) throw bad("Unknown network. Use mainnet or sepolia.");
  // Several RPC nodes: if one is slow or blocked, the next one answers automatically.
  return (providers[network] ??= new FallbackProvider(
    cfg.rpcs.map((url, i) => ({ provider: new JsonRpcProvider(url, cfg.id, { staticNetwork: true }), priority: i + 1, stallTimeout: 2000, weight: 1 })),
    cfg.id, { quorum: 1 }));
}

// Tiny in-memory cache so repeated lookups do not hammer the RPC node.
const cache = new Map();
async function memo(key, ttlMs, fn) {
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.value;
  const value = await fn();
  cache.set(key, { value, exp: Date.now() + ttlMs });
  return value;
}

export function getBalance({ network, address, asset }) {
  return memo(`bal:${network}:${asset}:${address}`, 10_000, async () => {
    const p = provider(network);
    if (asset === "USDC") {
      const raw = await new Contract(NETWORKS[network].usdc, ERC20, p).balanceOf(address);
      return { balance: formatUnits(raw, 6), asset };
    }
    return { balance: formatEther(await p.getBalance(address)), asset: "ETH" };
  });
}

// Checks receipt status, receiver and exact amount (ETH value or USDC Transfer event).
export async function verifyPayment({ network, tx, to, amount, asset }) {
  const p = provider(network);
  const [t, r, head] = await Promise.all([p.getTransaction(tx), p.getTransactionReceipt(tx), p.getBlockNumber()]);
  if (!t) return { verified: false, reason: "Transaction not found on this network" };
  if (!r) return { verified: false, reason: "Transaction is still pending" };
  if (r.status !== 1) return { verified: false, reason: "Transaction failed on-chain" };

  let paid, expected;
  if (asset === "USDC") {
    expected = parseUnits(amount, 6);
    paid = r.logs
      .filter((l) => l.address.toLowerCase() === NETWORKS[network].usdc.toLowerCase())
      .map((l) => { try { return iface.parseLog(l); } catch { return null; } })
      .filter((x) => x?.name === "Transfer" && x.args.to.toLowerCase() === to.toLowerCase())
      .reduce((sum, x) => sum + x.args.value, 0n);
  } else {
    expected = parseEther(amount);
    paid = t.to?.toLowerCase() === to.toLowerCase() ? t.value : 0n;
  }
  const verified = paid === expected;
  const confirmations = head - r.blockNumber + 1;
  return { verified, from: t.from, block: r.blockNumber, confirmations, final: confirmations >= CONFIRMATIONS_FINAL,
    reason: verified ? "Payment matches receiver and amount" : "Receiver or amount does not match" };
}
