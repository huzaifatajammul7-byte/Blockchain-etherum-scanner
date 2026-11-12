import { handler } from "./_handler.js";
import { network, asset, address, amount, txHash } from "../server/src/validate.js";
import * as chain from "../server/src/chain.js";

export default handler((q) => {
  const a = asset(q.asset);
  return chain.verifyPayment({ network: network(q.network), asset: a, tx: txHash(q.tx), to: address(q.to, "receiver"), amount: amount(q.amount, a) });
});
