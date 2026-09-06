import { useState, useEffect } from "react";
import { fetchMyReview, submitUserReview } from "../api/client";
import { useUserAuth } from "../context/UserAuthContext.jsx";

const RATING_LABELS = {
  1: "1 Star — Needs Improvement",
  2: "2 Stars — Fair / Average",
  3: "3 Stars — Good Learning Content",
  4: "4 Stars — Very Good & Helpful",
  5: "5 Stars — Exceptional / Highly Recommended!",
};

export default function DashboardReviewSection() {
  const { user } = useUserAuth();
  const [existingReview, setExistingReview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchMyReview()
      .then((res) => {
        if (!mounted) return;
        if (res.data?.review) {
          setExistingReview(res.data.review);
          setRating(res.data.review.rating || 5);
          setReviewText(res.data.review.review || "");
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      })
      .catch(() => {
        if (mounted) setIsEditing(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reviewText.trim()) {
      setNotice({ type: "danger", msg: "Please write your review feedback before submitting." });
      return;
    }

    setSubmitting(true);
    setNotice(null);

    try {
      const res = await submitUserReview({
        rating,
        review: reviewText.trim(),
      });
      setExistingReview(res.data.review);
      setIsEditing(false);
      setNotice({
        type: "success",
        msg: res.data.message || "Your review and rating have been recorded successfully!",
      });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit review. Please try again.";
      setNotice({ type: "danger", msg });
    } finally {
      setSubmitting(false);
    }
  }

  const activeStarCount = hoverRating || rating;

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5 bg-white">
      {/* Header Banner */}
      <div
        className="p-4 text-white d-flex justify-content-between align-items-center flex-wrap gap-3"
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 60%, #1e1b4b 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-3 shadow-sm"
            style={{
              width: 46,
              height: 46,
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#ffffff",
              fontSize: "1.4rem",
            }}
          >
            <i className="bi bi-star-fill" />
          </span>
          <div>
            <h2 className="h5 fw-bold mb-0 text-white">Student Review &amp; Classroom Rating</h2>
            <small className="text-white-50">
              Share your verified student experience, ratings, and course feedback
            </small>
          </div>
        </div>

        {user && (
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-dark px-3 py-2 rounded-pill fw-semibold shadow-sm">
              <i className="bi bi-person-circle text-primary me-1" />
              {user.name}
            </span>
          </div>
        )}
      </div>

      <div className="card-body p-4 p-md-5">
        {notice && (
          <div className={`alert alert-${notice.type} py-3 px-4 rounded-3 mb-4 d-flex align-items-center justify-content-between shadow-sm`}>
            <div className="d-flex align-items-center gap-2">
              <i className={`bi ${notice.type === "success" ? "bi-check-circle-fill text-success fs-5" : "bi-exclamation-triangle-fill text-danger fs-5"}`} />
              <span className="fw-semibold">{notice.msg}</span>
            </div>
            <button type="button" className="btn-close" onClick={() => setNotice(null)} />
          </div>
        )}

        {loading ? (
          <div className="text-center py-4 text-muted">
            <div className="spinner-border spinner-border-sm text-warning me-2" role="status" />
            <span>Loading your review status&hellip;</span>
          </div>
        ) : existingReview && !isEditing ? (
          /* View Mode: Already Submitted */
          <div className="p-4 rounded-4 bg-light border shadow-sm">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
              <div>
                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fw-bold mb-2">
                  <i className="bi bi-patch-check-fill me-1" /> Your Verified Review
                </span>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <div className="d-flex text-warning fs-5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`bi ${star <= existingReview.rating ? "bi-star-fill text-warning" : "bi-star text-muted"}`}
                      />
                    ))}
                  </div>
                  <span className="fw-bold text-dark fs-6">
                    {existingReview.rating} / 5 Stars
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
                onClick={() => setIsEditing(true)}
              >
                <i className="bi bi-pencil-square" />
                Edit / Update Review
              </button>
            </div>

            <div
              className="p-3 bg-white rounded-3 border text-dark mb-3"
              style={{ fontSize: "0.98rem", lineHeight: 1.6, whiteSpace: "pre-line" }}
            >
              &ldquo;{existingReview.review}&rdquo;
            </div>

            <div className="d-flex align-items-center justify-content-between text-muted small flex-wrap gap-2">
              <span>
                <i className="bi bi-clock-history me-1" />
                Submitted on {new Date(existingReview.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="text-success fw-semibold">
                <i className="bi bi-shield-check me-1" />
                Audited &amp; Synchronized with Admin Panel
              </span>
            </div>
          </div>
        ) : (
          /* Form Mode: Submit or Edit */
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label fw-bold text-dark mb-2 d-block">
                Select Your Rating *
              </label>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <div className="d-inline-flex align-items-center gap-1 bg-light p-2 rounded-4 border">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="btn btn-link p-1 text-decoration-none"
                      style={{
                        fontSize: "1.75rem",
                        color: star <= activeStarCount ? "#f59e0b" : "#cbd5e1",
                        transition: "transform 0.15s ease, color 0.15s ease",
                      }}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      title={`${star} Star`}
                    >
                      <i className={`bi ${star <= activeStarCount ? "bi-star-fill" : "bi-star"}`} />
                    </button>
                  ))}
                </div>
                <span className="fw-semibold text-dark ms-2" style={{ fontSize: "0.95rem" }}>
                  {RATING_LABELS[activeStarCount] || `${activeStarCount} Stars`}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-bold text-dark mb-0">
                  Your Review &amp; Feedback *
                </label>
                <small className="text-muted">{reviewText.length} / 2000 chars</small>
              </div>
              <textarea
                required
                className="form-control rounded-3 p-3"
                rows={4}
                maxLength={2000}
                placeholder="Share your detailed feedback about the classroom lectures, curriculum materials, mock interview videos, or instructor support..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                style={{ fontSize: "0.95rem", lineHeight: 1.5 }}
              />
            </div>

            <div className="d-flex align-items-center gap-3 flex-wrap">
              <button
                type="submit"
                className="btn btn-warning text-dark fw-bold px-4 py-2 rounded-pill shadow-sm d-inline-flex align-items-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" />
                    <span>Saving Review&hellip;</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-send-fill" />
                    <span>{existingReview ? "Save Updated Review" : "Submit Review & Rating"}</span>
                  </>
                )}
              </button>

              {existingReview && (
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-4 py-2 fw-semibold text-muted"
                  onClick={() => {
                    setIsEditing(false);
                    setRating(existingReview.rating || 5);
                    setReviewText(existingReview.review || "");
                    setNotice(null);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
