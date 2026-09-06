import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import AdminLogin from "./AdminLogin.jsx";
import AdminPanel from "./AdminPanel.jsx";
import PageBackgroundLogo from "../components/PageBackgroundLogo.jsx";

export default function AdminGate() {
  const { isAuthed, checked } = useAdminAuth();

  if (!checked) {
    return (
      <div className="oc-admin-login position-relative">
        <PageBackgroundLogo variant="global" opacity={0.035} />
        <span className="text-mono position-relative" style={{ color: "var(--paper-white)", zIndex: 1 }}>
          Checking session&hellip;
        </span>
      </div>
    );
  }

  return (
    <div className="position-relative min-vh-100">
      <PageBackgroundLogo variant="global" opacity={0.035} />
      <div className="position-relative" style={{ zIndex: 1 }}>
        {isAuthed ? <AdminPanel /> : <AdminLogin />}
      </div>
    </div>
  );
}
