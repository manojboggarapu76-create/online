import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/client";

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("oc_user_token"));
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem("oc_user_cached");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [paid, setPaid] = useState(() => {
    return localStorage.getItem("oc_user_paid") === "1";
  });
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecked(true);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        setPaid(Boolean(res.data.paid));
        try {
          localStorage.setItem("oc_user_cached", JSON.stringify(res.data.user));
          localStorage.setItem("oc_user_paid", res.data.paid ? "1" : "0");
        } catch {}
      })
      .catch(() => {
        localStorage.removeItem("oc_user_token");
        localStorage.removeItem("oc_user_cached");
        localStorage.removeItem("oc_user_paid");
        setToken(null);
        setUser(null);
        setPaid(false);
      })
      .finally(() => setChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applySession = useCallback((data, { announceSecurity = false } = {}) => {
    localStorage.setItem("oc_user_token", data.token);
    if (data.user) {
      try {
        localStorage.setItem("oc_user_cached", JSON.stringify(data.user));
      } catch {}
    }
    localStorage.setItem("oc_user_paid", data.paid ? "1" : "0");
    if (announceSecurity) {
      try {
        // Read once by GlobalSecurityGuard after the authenticated UI mounts.
        // Session storage avoids repeating the notice on later page refreshes.
        sessionStorage.setItem("oc_show_login_security_notice", "1");
      } catch {}
    }
    setToken(data.token);
    setUser(data.user);
    setPaid(Boolean(data.paid));
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post("/auth/login", { email, password });
      applySession(data, { announceSecurity: true });
      return data;
    },
    [applySession]
  );

  const register = useCallback(
    async (name, email, password, passwordConfirmation) => {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      applySession(data, { announceSecurity: true });
      return data;
    },
    [applySession]
  );

  const completeOAuth = useCallback(
    (data) => {
      applySession(data);
      setChecked(true);
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // token already gone server-side; fine either way
    }
    localStorage.removeItem("oc_user_token");
    localStorage.removeItem("oc_user_cached");
    localStorage.removeItem("oc_user_paid");
    setToken(null);
    setUser(null);
    setPaid(false);
  }, []);

  const refreshPaymentStatus = useCallback(async () => {
    if (!token) return false;
    try {
      const { data } = await api.get("/payment/status");
      setPaid(Boolean(data.paid));
      return Boolean(data.paid);
    } catch {
      return paid;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <UserAuthContext.Provider
      value={{
        token,
        user,
        paid,
        isAuthed: Boolean(token),
        checked,
        login,
        register,
        completeOAuth,
        logout,
        refreshPaymentStatus,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error("useUserAuth must be used inside UserAuthProvider");
  return ctx;
}
