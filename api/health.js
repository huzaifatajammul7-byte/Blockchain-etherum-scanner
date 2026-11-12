import { handler } from "./_handler.js";
export default handler(async () => ({ ok: true, time: new Date().toISOString() }));
