import { useState, useEffect } from "react";
import { BrowserProvider, Contract, isAddress, parseEther, parseUnits } from "ethers";
import { NETWORKS, getBalance, verifyPayment } from "./api";

const CHAIN = { mainnet: "0x1", sepolia: "0xaa36a7" };
const ERC20 = ["function transfer(address,uint256) returns (bool)"];
const scan = (net, hash) => (net === "mainnet" ? "https://etherscan.io/tx/" : "https://sepolia.etherscan.io/tx/") + hash;
const short = (a) => a.slice(0, 6) + "…" + a.slice(-4);

function Stamp({ s }) {
  const body = s.cls === "wait" ? <><span className="dots"><i /><i /><i /></span> {s.msg}</> : (s.msg || "—");
  return <div className={"stamp " + (s.cls || "")}>{body}{s.link && <> <a href={s.link} target="_blank" rel="noreferrer">View on Etherscan ↗</a></>}</div>;
}
function Btn({ busy, cls = "primary", ...p }) {
  return <button {...p} disabled={busy || p.disabled} className={cls + (busy ? " busy" : "")} />;
}
function Field({ label, ...p }) {
  return <><label>{label}</label><input autoComplete="off" {...p} /></>;
}
function useTask(initial = "") {
  const [st, setSt] = useState({ msg: initial });
  const [busy, setBusy] = useState(false);
  return { st, setSt, busy, setBusy };
}
async function run(t, waitMsg, fn) {
  t.setBusy(true); t.setSt({ msg: waitMsg, cls: "wait" });
  try { await fn(t.setSt); } catch (e) { t.setSt({ msg: e.shortMessage || e.message, cls: "bad" }); }
  t.setBusy(false);
}

export default function App() {
  const [intro, setIntro] = useState(true);
  const [net, setNet] = useState("sepolia");
  const [asset, setAsset] = useState("USDC");
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [f, setF] = useState({ to: "", amt: "" });
  const [v, setV] = useState({ to: "", amt: "", tx: "" });
  const [baddr, setBaddr] = useState("");
  const tSend = useTask("Each payment needs your approval in the wallet.");
  const tVer = useTask("Result appears here.");
  const tBal = useTask();
  const [api, setApi] = useState(null);

  useEffect(() => { fetch("/api/health").then((r) => r.json()).then(() => setApi(true)).catch(() => setApi(false)); }, []);
  useEffect(() => { const t = setTimeout(() => setIntro(false), 1200); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (!window.ethereum?.on) return;
    const h = () => { setSigner(null); setAccount(""); };
    window.ethereum.on("accountsChanged", h);
    return () => window.ethereum.removeListener?.("accountsChanged", h);
  }, []);

  const connect = () => run(tSend, "MetaMask popup mein approve karein…", async (set) => {
    if (!window.ethereum) throw new Error("Wallet nahi mila. Desktop par MetaMask install karein; mobile par MetaMask app ke browser se kholein.");
    const p = new BrowserProvider(window.ethereum);
    await p.send("eth_requestAccounts", []);
    const sg = await p.getSigner(); const a = await sg.getAddress();
    setSigner(sg); setAccount(a); setBaddr((x) => x || a);
    set({ msg: "Wallet connected. Ab receiver aur amount bharein.", cls: "ok" });
  });

  const send = () => run(tSend, "Waiting for wallet approval…", async (set) => {
    if (!signer) throw new Error("Connect your wallet first.");
    const to = f.to.trim(), amt = f.amt.trim();
    if (!isAddress(to)) throw new Error("Receiver address is not valid.");
    if (!(Number(amt) > 0)) throw new Error("Enter an amount above zero.");
    if (net === "mainnet" && !window.confirm(`Send ${amt} ${asset} on Ethereum Mainnet (real funds) to\n${to}?`)) { set({ msg: "Cancelled." }); return; }
    let sg = signer;
    if (window.ethereum.chainId !== CHAIN[net]) {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN[net] }] });
      sg = await new BrowserProvider(window.ethereum).getSigner(); setSigner(sg);
    }
    let tx;
    if (asset === "ETH") tx = await sg.sendTransaction({ to, value: parseEther(amt) });
    else tx = await new Contract(NETWORKS[net].usdc, ERC20, sg).transfer(to, parseUnits(amt, 6));
    set({ msg: "Submitted. Waiting for confirmation…", cls: "wait", link: scan(net, tx.hash) });
    await tx.wait();
    set({ msg: "Confirmed. Hash: " + tx.hash, cls: "ok", link: scan(net, tx.hash) });
    setV({ to, amt, tx: tx.hash });
  });

  const verify = () => run(tVer, "Checking the chain…", async (set) => {
    const d = await verifyPayment({ network: net, asset, to: v.to.trim(), amount: v.amt.trim(), tx: v.tx.trim() });
    set(d.verified
      ? { msg: `Verified. ${d.reason}. From ${d.from}, block ${d.block}, ${d.confirmations} confirmations${d.final ? " (final)" : " — wait for more confirmations before treating as final"}.`, cls: "ok", link: scan(net, v.tx.trim()) }
      : { msg: `Not verified. ${d.reason}.`, cls: "bad" });
  });

  const balance = () => run(tBal, "Looking up…", async (set) => {
    const d = await getBalance({ network: net, asset, address: baddr.trim() });
    set({ msg: `${d.balance} ${d.asset} on ${net === "mainnet" ? "Ethereum Mainnet" : "Sepolia"}`, cls: "ok" });
  });

  const upd = (setter) => (k) => (e) => setter((o) => ({ ...o, [k]: e.target.value }));
  const setFk = upd(setF), setVk = upd(setV);

  return (<>
    <div id="intro" className={intro ? "" : "gone"} role="status" aria-label="Loading">
      <div className="loader"><div className="crystal" /><b>EtherReceipt</b><div className="track"><i /></div></div>
    </div>
    <header>
      <span className="logo"><span className="gem" />EtherReceipt</span>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span className={"api " + (api === false ? "off" : api ? "on" : "")}>{api === false ? "API offline" : api ? "API online" : "API…"}</span>
        <Btn cls="ghost" busy={tSend.busy && !account} onClick={connect}>{account ? short(account) : "Connect wallet"}</Btn>
      </div>
    </header>
    <main>
      <h1>Good work deserves a clear receipt.</h1>
      <p className="lead">Send ETH or USDC from your own wallet, then check that a payment really landed. Your keys never leave your wallet.</p>
      <div className="bar">
        <div><label>Network</label><select value={net} onChange={(e) => setNet(e.target.value)}>
          <option value="mainnet">Ethereum Mainnet (real funds)</option><option value="sepolia">Sepolia (test)</option></select></div>
        <div><label>Asset</label><select value={asset} onChange={(e) => setAsset(e.target.value)}><option>USDC</option><option>ETH</option></select></div>
      </div>
      <div className="grid">
        <section className="slip"><h2>Send a payment</h2>
          <p>{account ? "Connected: " + short(account) : "No wallet connected"}</p>
          <Field label="Receiver address" placeholder="0x…" value={f.to} onChange={setFk("to")} />
          <Field label="Amount" placeholder="25.00" inputMode="decimal" value={f.amt} onChange={setFk("amt")} />
          <Btn busy={tSend.busy} onClick={send}>Review and send</Btn><Stamp s={tSend.st} />
        </section>
        <section className="slip"><h2>Did the payment arrive?</h2><p>Match a transaction to the receiver and amount you expected.</p>
          <Field label="Receiving address" placeholder="0x…" value={v.to} onChange={setVk("to")} />
          <Field label="Expected amount" inputMode="decimal" value={v.amt} onChange={setVk("amt")} />
          <Field label="Transaction hash" placeholder="0x…" value={v.tx} onChange={setVk("tx")} />
          <Btn busy={tVer.busy} onClick={verify}>Verify payment</Btn><Stamp s={tVer.st} />
        </section>
        <section className="slip full"><h2>Wallet balance</h2><p>Look up any public address.</p>
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <input placeholder="0x…" value={baddr} onChange={(e) => setBaddr(e.target.value)} />
            <Btn cls="ghost" busy={tBal.busy} onClick={balance}>Look up</Btn>
          </div><Stamp s={tBal.st} />
        </section>
      </div>
      <p className="note">A mined match can still change after a chain reorganization. This tool does not verify the sender's real-world identity. Never enter a seed phrase or private key on any website.</p>
    </main>
  </>);
}
