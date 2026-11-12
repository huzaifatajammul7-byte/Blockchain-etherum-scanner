import { handler } from "./_handler.js";
import { network, asset, address } from "../server/src/validate.js";
import * as chain from "../server/src/chain.js";

export default handler((q) => chain.getBalance({ network: network(q.network), asset: asset(q.asset), address: address(q.address, "wallet") }));
