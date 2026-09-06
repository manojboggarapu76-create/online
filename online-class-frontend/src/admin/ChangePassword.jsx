import { useState } from "react";
import api from "../api/client";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);

    if (newPassword !== confirm) {
      setStatus({ type: "error", message: "New password and confirmation don't match." });
      return;
    }

    setSaving(true);
    try {
      await api.post("/admin/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirm,
      });
      setStatus({ type: "success", message: "Password updated. Use it next time you log in." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      const errors = err?.response?.data?.errors;
      setStatus({
        type: "error",
        message: errors ? Object.values(errors).flat().join(" ") : "Couldn't update the password.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.5rem" }}>Settings</h2>
      <p style={{ color: "var(--ink-60)" }}>
        Change the admin panel password. The default password is <code>1</code> &mdash;
        change it here once you're set up.
      </p>

      <form className="oc-index-card" style={{ maxWidth: 420 }} onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Current password</label>
          <input
            type="password"
            className="form-control"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">New password</label>
          <input
            type="password"
            className="form-control"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Confirm new password</label>
          <input
            type="password"
            className="form-control"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {status && (
          <div className={`alert ${status.type === "success" ? "alert-success" : "alert-danger"} py-2`}>
            {status.message}
          </div>
        )}

        <button type="submit" className="btn btn-oc-primary" disabled={saving}>
          {saving ? "Updating\u2026" : "Update password"}
        </button>
      </form>
    </div>
  );
}
