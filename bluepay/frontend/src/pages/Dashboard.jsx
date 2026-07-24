import { useEffect, useState } from "react";
import { Wallet, Bluetooth, BluetoothOff, Smartphone } from "lucide-react";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const rupee = (n) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Dashboard() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [device, setDevice] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [w, d] = await Promise.all([api.get("/wallet"), api.get("/devices/me")]);
    setWallet(w.data);
    setDevice(d.data[0] || null);
  };

  useEffect(() => { load(); }, []);

  const toggleBluetooth = async () => {
    if (!device) return;
    setBusy(true);
    try {
      const res = await api.patch("/devices/me/status", { is_active: !device.is_active });
      setDevice(res.data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <h2 style={{ marginBottom: 4 }}>Welcome, {user.name}</h2>
      <p className="muted" style={{ marginBottom: 24 }}>Your wallet and device status</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Wallet size={18} color="#E8A33D" />
            <span className="muted">Wallet balance</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 700 }}>{wallet ? rupee(wallet.balance) : "..."}</div>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Smartphone size={18} color="#35D0BA" />
            <span className="muted">Your device</span>
          </div>
          {device ? (
            <>
              <div style={{ fontWeight: 600 }}>{device.device_name}</div>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#5B6472", marginBottom: 12 }}>{device.mac_address}</div>
              <button className="btn-secondary" onClick={toggleBluetooth} disabled={busy} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {device.is_active ? <Bluetooth size={14} color="#35D0BA" /> : <BluetoothOff size={14} />}
                {device.is_active ? "Bluetooth on — discoverable" : "Bluetooth off"}
              </button>
            </>
          ) : (
            <div className="muted">Loading device...</div>
          )}
        </div>
      </div>

      <p className="muted" style={{ marginTop: 20 }}>
        Turn your Bluetooth on above, then go to <b>Pair & pay</b> to find a nearby device and send money.
        The other person needs their Bluetooth on too, from their own account.
      </p>
    </div>
  );
}
