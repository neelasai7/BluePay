import { Link, useNavigate } from "react-router-dom";
import { Bluetooth, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ borderBottom: "1px solid #262D39", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "#35D0BA", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bluetooth size={16} color="#0B1F1B" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 16 }}>BluePay</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 14 }}>
        <Link to="/" style={{ textDecoration: "none", color: "#C6CBD4" }}>Dashboard</Link>
        <Link to="/pay" style={{ textDecoration: "none", color: "#C6CBD4" }}>Pair & pay</Link>
        <Link to="/history" style={{ textDecoration: "none", color: "#C6CBD4" }}>History</Link>
        <span className="muted">{user.name}</span>
        <button className="btn-secondary" onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <LogOut size={14} /> Log out
        </button>
      </div>
    </div>
  );
}
