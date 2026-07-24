import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("bluepay_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = (token, user) => {
    localStorage.setItem("bluepay_token", token);
    localStorage.setItem("bluepay_user", JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("bluepay_token");
    localStorage.removeItem("bluepay_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
