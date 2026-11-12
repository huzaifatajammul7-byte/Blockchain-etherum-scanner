import { explain } from "../server/src/errors.js";

// Wraps a function so Vercel returns JSON for both success and errors.
export const handler = (fn) => async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(await fn(req.query));
  } catch (e) {
    const [status, message] = explain(e);
    if (status >= 500) console.error("[error]", e.code || "", e.shortMessage || e.message);
    res.status(status).json({ error: message });
  }
};
