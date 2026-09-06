import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/client";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import { openRazorpayCheckout } from "../payments/razorpay.js";

function formatAmount(amount, currency) {
  if (!amount) return "";
  const value = amount / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "INR" }).format(value);
  } catch {
    return `${currency || "INR"} ${value.toFixed(2)}`;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function VideoLock({ onUnlocked }) {
  const { isAuthed, paid, refreshPaymentStatus } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [amountLabel, setAmountLabel] = useState(null);

  function goToLogin() {
    navigate("/login", { state: { from: location.pathname } });
  }

  // Razorpay already confirmed the charge to the visitor at this point --
  // our job now is just to find out once our backend agrees, however long
  // that takes. /payment/verify (called first, below) is normally instant.
  // If it can't complete for any reason -- a dropped connection, our
  // server restarting at exactly the wrong moment -- this keeps checking
  // /payment/status instead of reporting a failure, because the Razorpay
  // webhook confirms the same payment independently in the background and
  // will flip it to paid shortly regardless of what the browser managed to
  // do. The payment itself is never in doubt; only how soon *this tab*
  // finds out is.
  async function pollUntilPaid(maxAttempts = 8) {
    setConfirming(true);
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await wait(Math.min(2000 * (attempt + 1), 8000));
      const isPaid = await refreshPaymentStatus();
      if (isPaid) {
        setConfirming(false);
        onUnlocked?.();
        return true;
      }
    }
    setConfirming(false);
    return false;
  }

  async function handlePay() {
    setError(null);
    setPaying(true);
    try {
      const { data: order } = await api.post("/payment/create-order");
      setAmountLabel(formatAmount(order.amount, order.currency));

      await openRazorpayCheckout(order, {
        onSuccess: async (response) => {
          try {
            await api.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await refreshPaymentStatus();
            onUnlocked?.();
          } catch {
            // The instant confirmation call didn't complete -- fall back to
            // polling. The payment itself already succeeded at Razorpay;
            // this just waits for our side (via the webhook) to catch up.
            const confirmed = await pollUntilPaid();
            if (!confirmed) {
              setError(
                "Payment received but we're still confirming it on our end. This can take a minute — reopen this page shortly and it should unlock automatically."
              );
            }
          } finally {
            setPaying(false);
          }
        },
        onDismiss: () => setPaying(false),
        onError: (err) => {
          setError(err.message);
          setPaying(false);
        },
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't start the payment. Please try again.");
      setPaying(false);
    }
  }

  if (paid) return null; // shouldn't render if already unlocked, but stay safe

  return (
    <div className="oc-locked-video">
      <i className="bi bi-lock-fill" />
      <h4>{isAuthed ? "Unlock Online Classes" : "Log in to watch this video"}</h4>
      <p>
        {isAuthed
          ? "This video is part of Online Classes. Make a one-time payment to unlock every Online Classes video, right away."
          : "Create a free account or log in first — then a one-time payment unlocks every Online Classes video."}
      </p>

      {error && (
        <div className="alert alert-danger py-2 mb-3" style={{ fontSize: "0.85rem", maxWidth: 420, margin: "0 auto 1rem" }}>
          {error}
        </div>
      )}

      {confirming && !error && (
        <div className="alert alert-warning py-2 mb-3" style={{ fontSize: "0.85rem", maxWidth: 420, margin: "0 auto 1rem" }}>
          <i className="bi bi-hourglass-split me-1" />
          Confirming your payment&hellip;
        </div>
      )}

      <div className="oc-locked-actions">
        {isAuthed ? (
          <button type="button" className="btn btn-oc-marigold" onClick={handlePay} disabled={paying || confirming}>
            <i className="bi bi-credit-card me-1" />
            {paying || confirming ? "Please wait\u2026" : "Pay to unlock"}
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-oc-marigold" onClick={goToLogin}>
              <i className="bi bi-box-arrow-in-right me-1" />
              Log in
            </button>
            <button type="button" className="btn btn-oc-outline" style={{ borderColor: "rgba(247,243,233,.5)", color: "#fff" }} onClick={() => navigate("/signup", { state: { from: location.pathname } })}>
              Sign up
            </button>
          </>
        )}
      </div>
      {amountLabel && <div className="oc-price-tag">One-time payment &middot; {amountLabel}</div>}
    </div>
  );
}
