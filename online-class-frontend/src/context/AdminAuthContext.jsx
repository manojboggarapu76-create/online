import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/client";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("oc_admin_token"));
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecked(true);
      return;
    }
    api
      .get("/admin/me")
      .then(() => setChecked(true))
      .catch(() => {
        localStorage.removeItem("oc_admin_token");
        setToken(null);
        setChecked(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (password) => {
    const { data } = await api.post("/admin/login", { password });
    localStorage.setItem("oc_admin_token", data.token);
    setToken(data.token);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/admin/logout");
    } catch {
      // token already gone server-side; fine either way
    }
    localStorage.removeItem("oc_admin_token");
    setToken(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ token, isAuthed: Boolean(token), checked, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}
