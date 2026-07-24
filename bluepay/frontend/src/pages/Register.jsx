import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        name, email, password, device_name: deviceName || `${name}'s phone`,
      });
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Could not register.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 380, paddingTop: 60 }}>
      <h2 style={{ marginBottom: 4 }}>Create your BluePay account</h2>
      <p className="muted" style={{ marginBottom: 24 }}>Every account starts with a ₹5,000 demo wallet and one registered device.</p>
      <form onSubmit={submit} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <input type="text" placeholder="Device name (e.g. Rohan's Galaxy S23)" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} />
        {error && <div className="error-text">{error}</div>}
        <button className="btn-primary" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button>
      </form>
      <p className="muted" style={{ marginTop: 16 }}>
        Already have an account? <Link to="/login" style={{ color: "#35D0BA" }}>Log in</Link>
      </p>
    </div>
  );
}
