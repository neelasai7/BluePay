import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Could not log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 380, paddingTop: 80 }}>
      <h2 style={{ marginBottom: 4 }}>Log in to BluePay</h2>
      <p className="muted" style={{ marginBottom: 24 }}>Bluetooth peer-to-peer payments</p>
      <form onSubmit={submit} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div className="error-text">{error}</div>}
        <button className="btn-primary" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
      </form>
      <p className="muted" style={{ marginTop: 16 }}>
        No account yet? <Link to="/register" style={{ color: "#35D0BA" }}>Register</Link>
      </p>
    </div>
  );
}
