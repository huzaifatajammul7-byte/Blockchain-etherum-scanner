// Talks to the Express backend. Only USDC addresses live here (needed to sign transfers in the wallet).
export const NETWORKS = {
  mainnet: { id: 1, usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
  sepolia: { id: 11155111, usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" },
};

async function get(path, params) {
  const res = await fetch(`/api/${path}?` + new URLSearchParams(params));
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error("Backend se jawab nahi aaya. Pehle server chalayein: cd server && npm start"); }
  if (!res.ok || data.error) throw new Error(data.error || "Request failed");
  return data;
}

export const getBalance = ({ network, address, asset }) => get("balance", { network, address, asset });
export const verifyPayment = ({ network, tx, to, amount, asset }) => get("verify", { network, tx, to, amount, asset });
