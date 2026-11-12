export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const bad = (message) => new HttpError(400, message);

// Turns blockchain/RPC failures into clear, actionable messages
export function explain(err) {
  if (err.status) return [err.status, err.message];
  if (["CALL_EXCEPTION", "BAD_DATA"].includes(err.code))
    return [400, "Blockchain se sahi jawab nahi mila. Address aur network (Sepolia/Mainnet) check karein."];
  if (["NETWORK_ERROR", "SERVER_ERROR", "TIMEOUT"].includes(err.code) || /fetch|ECONN|ETIMEDOUT|ENOTFOUND|EAI_AGAIN/i.test(err.message || ""))
    return [502, "RPC node se connection nahi ho paya. Internet/VPN check karein, ya .env mein apna MAINNET_RPC / SEPOLIA_RPC (Alchemy/Infura) lagayein."];
  return [500, "Server error. Terminal mein asli error dekhein."];
}
