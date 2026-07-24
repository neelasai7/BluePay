import { useState } from "react";
import { Radar, Lock, CheckCircle2, Send, BluetoothConnected, ShieldCheck } from "lucide-react";
import api from "../api.js";

const rupee = (n) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toHex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
const hexToBytes = (hex) => new Uint8Array(hex.match(/.{1,2}/g).map((b) => parseInt(b, 16)));

export default function PairAndPay() {
  const [nearby, setNearby] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [session, setSession] = useState(null); // { session_id, session_key_hex, peer_device }
  const [amount, setAmount] = useState("250");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const scan = async () => {
    setScanning(true);
    setError("");
    try {
      const res = await api.get("/devices/discover");
      setNearby(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not scan for devices.");
    } finally {
      setScanning(false);
    }
  };

  const pair = async (macAddress) => {
    setError("");
    try {
      const res = await api.post("/devices/pair", { mac_address: macAddress });
      setSession(res.data);
      setResult(null);
    } catch (err) {
      setError(err.response?.data?.error || "Pairing failed.");
    }
  };

  const sendPayment = async () => {
    setError("");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount."); return; }

    setSending(true);
    try {
      const keyBytes = hexToBytes(session.session_key_hex);
      const cryptoKey = await window.crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      const payload = JSON.stringify({
        amount: amt,
        txn_id: "TXN" + Math.random().toString(36).slice(2, 10).toUpperCase(),
        from_mac: session.peer_device.mac_address, // server re-derives sender from the session, kept for payload completeness
        to_mac: session.peer_device.mac_address,
        timestamp: new Date().toISOString(),
      });

      const ciphertext = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        new TextEncoder().encode(payload)
      );

      const res = await api.post("/transactions/send", {
        session_id: session.session_id,
        iv_hex: toHex(iv),
        ciphertext_hex: toHex(ciphertext),
      });

      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Payment failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container">
      <h2 style={{ marginBottom: 4 }}>Pair & pay</h2>
      <p className="muted" style={{ marginBottom: 24 }}>Find a nearby device, pair, and send an encrypted payment over Bluetooth.</p>

      {!session && (
        <div className="card">
          <button className="btn-primary" onClick={scan} disabled={scanning} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Radar size={16} /> {scanning ? "Scanning..." : "Scan for nearby devices"}
          </button>

          {nearby.length > 0 && (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {nearby.map((d) => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #262D39", borderRadius: 10, padding: "10px 14px" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{d.device_name}</div>
                    <div className="muted" style={{ fontFamily: "monospace", fontSize: 11 }}>{d.mac_address} · {d.owner_name}</div>
                  </div>
                  <button className="btn-secondary" onClick={() => pair(d.mac_address)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Lock size={14} /> Pair
                  </button>
                </div>
              ))}
            </div>
          )}
          {nearby.length === 0 && !scanning && (
            <p className="muted" style={{ marginTop: 12 }}>No devices found yet. Ask the other person to turn Bluetooth on from their Dashboard, then scan again.</p>
          )}
        </div>
      )}

      {session && !result && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <BluetoothConnected size={20} color="#35D0BA" />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Paired with {session.peer_device.device_name}</div>
              <div className="muted" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                <ShieldCheck size={12} color="#E8A33D" /> AES-256-GCM secure channel established
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
            <button className="btn-amber" onClick={sendPayment} disabled={sending} style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
              <Send size={16} /> {sending ? "Sending..." : "Send payment"}
            </button>
          </div>
          <button className="btn-secondary" style={{ marginTop: 12 }} onClick={() => setSession(null)}>Cancel</button>
        </div>
      )}

      {result && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <CheckCircle2 size={20} color="#35D0BA" />
            <div style={{ fontWeight: 600 }}>Payment sent</div>
          </div>
          <table>
            <tbody>
              <tr><td className="muted">Transaction ID</td><td>{result.transaction.txn_uid}</td></tr>
              <tr><td className="muted">Amount</td><td>{rupee(result.transaction.amount)}</td></tr>
              <tr><td className="muted">To</td><td>{result.transaction.receiver_device}</td></tr>
              <tr><td className="muted">Cipher (truncated)</td><td style={{ fontFamily: "monospace", fontSize: 11 }}>{result.transaction.cipher_preview}...</td></tr>
              <tr><td className="muted">Your new balance</td><td>{rupee(result.new_balance)}</td></tr>
            </tbody>
          </table>
          <button className="btn-secondary" style={{ marginTop: 16 }} onClick={() => { setSession(null); setResult(null); setNearby([]); }}>Send another payment</button>
        </div>
      )}

      {error && <div className="error-text" style={{ marginTop: 12 }}>{error}</div>}
    </div>
  );
}
