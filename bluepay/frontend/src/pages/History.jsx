import { useEffect, useState } from "react";
import api from "../api.js";

const rupee = (n) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function History() {
  const [txns, setTxns] = useState([]);

  useEffect(() => {
    api.get("/transactions").then((res) => setTxns(res.data));
  }, []);

  return (
    <div className="container">
      <h2 style={{ marginBottom: 4 }}>Transaction history</h2>
      <p className="muted" style={{ marginBottom: 24 }}>All payments sent and received on this account.</p>

      <div className="card">
        {txns.length === 0 ? (
          <p className="muted">No transactions yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Time</th>
                <th>Direction</th>
                <th>Amount</th>
                <th>Counterparty device</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.txn_uid}>
                  <td>{t.txn_uid}</td>
                  <td>{new Date(t.created_at).toLocaleString("en-IN")}</td>
                  <td style={{ color: t.direction === "sent" ? "#E2635F" : "#35D0BA" }}>{t.direction}</td>
                  <td>{rupee(t.amount)}</td>
                  <td>{t.direction === "sent" ? t.receiver_device : t.sender_device}</td>
                  <td style={{ color: "#35D0BA" }}>{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
