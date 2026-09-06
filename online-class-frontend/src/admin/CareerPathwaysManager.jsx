import { useEffect, useState, useCallback } from "react";
import {
  fetchAdminPathways,
  createAdminPathway,
  updateAdminPathway,
  updateAdminPathwayPrice,
  toggleAdminPathwayLock,
  deleteAdminPathway,
} from "../api/client";

export default function CareerPathwaysManager() {
  const [pathways, setPathways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  // Full Edit/Create modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPathway, setEditingPathway] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalTab, setModalTab] = useState("details"); // 'details' | 'modules' | 'json'

  // Quick Price Modal state
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [pricingPathway, setPricingPathway] = useState(null);
  const [quickPrice, setQuickPrice] = useState(499);
  const [quickOriginalPrice, setQuickOriginalPrice] = useState(1499);
  const [quickOfferEnabled, setQuickOfferEnabled] = useState(true);
  const [savingPrice, setSavingPrice] = useState(false);

  // Visual modules list state
  const [modulesList, setModulesList] = useState([]);
  const [expandedModuleIdx, setExpandedModuleIdx] = useState(0);

  // Form fields
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    badge: "Specialization",
    color: "#3b82f6",
    icon: "bi-diagram-3-fill",
    description: "",
    skills: "",
    duration: "12 Weeks",
    level: "All Levels",
    price: 499,
    original_price: 1499,
    offer_enabled: true,
    is_active: true,
    is_locked: true,
    sort_order: 0,
    curriculum_modules_json: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminPathways()
      .then((res) => {
        setPathways(res.data.data || []);
      })
      .catch(() => {
        setNotice({ type: "danger", msg: "Failed to load career pathways." });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const showNotice = (msg, type = "success") => {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 4500);
  };

  const handleOpenAdd = () => {
    setEditingPathway(null);
    const initialModules = [
      {
        id: 101,
        name: "Core Architecture & Fundamentals",
        slug: "core-fundamentals",
        short_description: "Foundational concepts, mechanics, and design paradigms.",
        description: "Deep dive into core architecture, scalable design patterns, and programming foundations.",
        topics: ["Architecture Overview", "Design Patterns", "State & Data Flow", "Performance Optimization"],
        important_points: ["Understand scalable architecture foundations", "Master clean design patterns"],
        examples_notes: "# Core module architecture example\ndef initialize_service():\n    return {'status': 'ready'}",
        documents: [],
        videos: [],
      },
    ];

    setModulesList(initialModules);
    setExpandedModuleIdx(0);
    setModalTab("details");
    setFormData({
      title: "",
      slug: "",
      badge: "High Demand",
      color: "#3b82f6",
      icon: "bi-terminal-fill",
      description: "",
      skills: "Python 3.12, Flask, REST APIs, Docker, PostgreSQL",
      duration: "12 Weeks",
      level: "Beginner to Advanced",
      price: 499,
      original_price: 1499,
      offer_enabled: true,
      is_active: true,
      is_locked: true,
      sort_order: pathways.length + 1,
      curriculum_modules_json: JSON.stringify(initialModules, null, 2),
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPathway(p);
    let parsed = [];
    if (Array.isArray(p.curriculum_modules)) {
      parsed = p.curriculum_modules;
    } else if (typeof p.curriculum_modules === "string" && p.curriculum_modules.trim()) {
      try {
        parsed = JSON.parse(p.curriculum_modules);
      } catch {
        parsed = [];
      }
    }

    setModulesList(parsed);
    setExpandedModuleIdx(0);
    setModalTab("details");
    setFormData({
      title: p.title || "",
      slug: p.slug || "",
      badge: p.badge || "Specialization",
      color: p.color || "#3b82f6",
      icon: p.icon || "bi-diagram-3-fill",
      description: p.description || "",
      skills: Array.isArray(p.skills) ? p.skills.join(", ") : p.skills || "",
      duration: p.duration || "12 Weeks",
      level: p.level || "All Levels",
      price: p.price ?? 499,
      original_price: p.original_price ?? Math.round((p.price ?? 499) * 2.8),
      offer_enabled: p.offer_enabled !== false,
      is_active: p.is_active ?? true,
      is_locked: p.is_locked !== false,
      sort_order: p.sort_order ?? 0,
      curriculum_modules_json: JSON.stringify(parsed, null, 2),
    });
    setShowModal(true);
  };

  const handleTogglePathwayLock = async (p) => {
    const newLock = p.is_locked === false ? true : false;
    try {
      await toggleAdminPathwayLock(p.id, newLock);
      showNotice(
        `Career Pathway "${p.title}" is now ${newLock ? "🔒 Locked (Payment required when global payment ON)" : "🔓 Free Access (No payment required)"}.`
      );
      load();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error updating pathway lock status.", "danger");
    }
  };

  const handleOpenQuickPrice = (p) => {
    setPricingPathway(p);
    setQuickPrice(p.price ?? 499);
    setQuickOriginalPrice(p.original_price ?? Math.round((p.price ?? 499) * 2.8));
    setQuickOfferEnabled(p.offer_enabled !== false);
    setShowPriceModal(true);
  };

  const handleSaveQuickPrice = async (e) => {
    e.preventDefault();
    if (!pricingPathway) return;
    setSavingPrice(true);
    try {
      await updateAdminPathwayPrice(pricingPathway.id, {
        price: Number(quickPrice),
        original_price: quickOriginalPrice === "" ? null : Number(quickOriginalPrice),
        offer_enabled: quickOfferEnabled,
      });
      showNotice(`Price for "${pricingPathway.title}" updated to ₹${quickPrice} successfully.`);
      setShowPriceModal(false);
      load();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error updating price.", "danger");
    } finally {
      setSavingPrice(false);
    }
  };

  // Visual Module CRUD
  const handleAddModule = () => {
    const nextId = modulesList.length > 0 ? Math.max(...modulesList.map((m) => Number(m.id) || 0)) + 1 : 101;
    const newMod = {
      id: nextId,
      name: `Module ${modulesList.length + 1}: New Topic`,
      slug: `module-${modulesList.length + 1}`,
      short_description: "Key concepts and practical implementation.",
      description: "Comprehensive deep dive into this syllabus topic.",
      topics: ["Introduction & Concepts", "Hands-on Practice"],
      important_points: ["Key takeaway point 1", "Key takeaway point 2"],
      examples_notes: "# Sample notes or code snippet",
      documents: [],
      videos: [],
      is_locked: true,
    };
    const updated = [...modulesList, newMod];
    setModulesList(updated);
    setExpandedModuleIdx(updated.length - 1);
    setFormData((prev) => ({ ...prev, curriculum_modules_json: JSON.stringify(updated, null, 2) }));
  };

  const handleDeleteModule = (idx) => {
    const mod = modulesList[idx];
    if (!window.confirm(`Remove module "${mod?.name || `Module ${idx + 1}`}"?`)) return;
    const updated = modulesList.filter((_, i) => i !== idx);
    setModulesList(updated);
    setFormData((prev) => ({ ...prev, curriculum_modules_json: JSON.stringify(updated, null, 2) }));
    if (expandedModuleIdx >= updated.length) {
      setExpandedModuleIdx(Math.max(0, updated.length - 1));
    }
  };

  const handleMoveModule = (idx, direction) => {
    if ((direction === -1 && idx === 0) || (direction === 1 && idx === modulesList.length - 1)) return;
    const updated = [...modulesList];
    const target = idx + direction;
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    setModulesList(updated);
    setExpandedModuleIdx(target);
    setFormData((prev) => ({ ...prev, curriculum_modules_json: JSON.stringify(updated, null, 2) }));
  };

  const handleUpdateModuleField = (idx, field, value) => {
    const updated = [...modulesList];
    updated[idx] = { ...updated[idx], [field]: value };
    setModulesList(updated);
    setFormData((prev) => ({ ...prev, curriculum_modules_json: JSON.stringify(updated, null, 2) }));
  };

  const handleSwitchTab = (tab) => {
    if (tab === "json") {
      setFormData((prev) => ({ ...prev, curriculum_modules_json: JSON.stringify(modulesList, null, 2) }));
    } else if (modalTab === "json" && tab === "modules") {
      try {
        if (formData.curriculum_modules_json.trim()) {
          const parsed = JSON.parse(formData.curriculum_modules_json);
          if (Array.isArray(parsed)) {
            setModulesList(parsed);
          }
        }
      } catch {
        showNotice("JSON has syntax errors. Please fix it before switching to visual editor.", "danger");
        return;
      }
    }
    setModalTab(tab);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showNotice("Pathway title is required.", "danger");
      return;
    }

    setSaving(true);

    let finalModules = modulesList;
    if (modalTab === "json" && formData.curriculum_modules_json.trim()) {
      try {
        finalModules = JSON.parse(formData.curriculum_modules_json);
      } catch {
        showNotice("Invalid JSON format in Curriculum Modules. Please verify syntax.", "danger");
        setSaving(false);
        return;
      }
    }

    const payload = {
      title: formData.title.trim(),
      slug: formData.slug?.trim() || undefined,
      badge: formData.badge?.trim() || "Specialization",
      color: formData.color || "#3b82f6",
      icon: formData.icon?.trim() || "bi-diagram-3-fill",
      description: formData.description?.trim() || "",
      skills: formData.skills,
      duration: formData.duration?.trim() || "12 Weeks",
      level: formData.level?.trim() || "All Levels",
      price: parseInt(formData.price, 10) || 0,
      original_price: formData.original_price === "" ? null : parseInt(formData.original_price, 10) || 0,
      offer_enabled: Boolean(formData.offer_enabled),
      is_active: Boolean(formData.is_active),
      is_locked: Boolean(formData.is_locked),
      sort_order: parseInt(formData.sort_order, 10) || 0,
      curriculum_modules: finalModules,
    };

    try {
      if (editingPathway) {
        await updateAdminPathway(editingPathway.id, payload);
        showNotice(`Pathway "${formData.title}" updated successfully.`);
      } else {
        await createAdminPathway(payload);
        showNotice(`New Specialization Pathway "${formData.title}" created successfully.`);
      }
      setShowModal(false);
      load();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error saving career pathway.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete the specialization pathway "${title}"? This will remove it from student enrollment.`)) return;
    try {
      await deleteAdminPathway(id);
      showNotice(`Pathway "${title}" deleted.`);
      load();
    } catch {
      showNotice("Error deleting pathway.", "danger");
    }
  };

  return (
    <div className="oc-admin-pathway-mgmt">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h4 fw-bold mb-1 d-flex align-items-center gap-2">
            <span
              className="oc-folder-icon"
              style={{ background: "#8b5cf6", width: 36, height: 36, fontSize: "1.1rem" }}
            >
              <i className="bi bi-diagram-3-fill" />
            </span>
            <span>Career Pathways &amp; Course Pricing</span>
          </h2>
          <p className="text-muted mb-0 small">
            Configure engineering specializations, set custom course enrollment prices (₹), and manage syllabus modules.
            {loading && <span className="spinner-border spinner-border-sm text-primary ms-2" role="status" />}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-primary rounded-pill px-4 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2"
            onClick={handleOpenAdd}
          >
            <i className="bi bi-plus-circle-fill" /> Add New Specialization
          </button>
        </div>
      </div>

      {notice && (
        <div className={`alert alert-${notice.type} py-2 px-3 mb-4 rounded-3 shadow-sm d-flex align-items-center gap-2`}>
          <i className={`bi ${notice.type === "success" ? "bi-check-circle-fill fs-5 text-success" : "bi-exclamation-triangle-fill fs-5 text-danger"}`} />
          <span className="fw-medium">{notice.msg}</span>
        </div>
      )}

      {/* Pathways Table Card */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        {!loading && pathways.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-diagram-3 fs-1 mb-2 text-primary" />
            <h5 className="mt-2 mb-1 fw-bold text-dark">No career pathways created yet</h5>
            <p className="small mb-3">Click "Add New Specialization" to create your first track with custom pricing.</p>
            <button type="button" className="btn btn-sm btn-primary rounded-pill px-4 py-2" onClick={handleOpenAdd}>
              <i className="bi bi-plus-lg me-1" /> Add Specialization
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.88rem" }}>
              <thead className="table-light">
                <tr>
                  <th>Track Title</th>
                  <th>Enrollment Price (₹)</th>
                  <th>Lock / Pay Access</th>
                  <th>Duration &amp; Level</th>
                  <th>Curriculum Modules</th>
                  <th>Enrollments &amp; Revenue</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pathways.map((p) => (
                  <tr key={p.id}>
                    {/* Title */}
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="d-inline-flex align-items-center justify-content-center rounded-3 text-white shadow-sm"
                          style={{ width: 34, height: 34, background: p.color || "#3b82f6" }}
                        >
                          <i className={`bi ${p.icon || "bi-diagram-3-fill"}`} />
                        </span>
                        <div>
                          <div className="fw-bold text-dark">{p.title}</div>
                          <small className="text-muted">{p.badge || "Specialization"} &bull; <code className="text-muted" style={{ fontSize: "0.75rem" }}>{p.slug}</code></small>
                        </div>
                      </div>
                    </td>

                    {/* Price with Quick Edit Trigger */}
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm p-0 border-0 text-start"
                        onClick={() => handleOpenQuickPrice(p)}
                        title="Click to quickly change price"
                      >
                        <div className="d-flex flex-column gap-1">
                          <span className="badge bg-success-subtle text-success fs-6 fw-bold px-3 py-1 border border-success-subtle rounded-pill d-inline-flex align-items-center gap-1">
                            <span>₹{p.price}</span>
                            <i className="bi bi-pencil-square ms-1" style={{ fontSize: "0.75rem", opacity: 0.7 }} />
                          </span>
                          {p.offer_enabled && Number(p.original_price) > Number(p.price) && (
                          <div className="d-flex align-items-center gap-1 small ps-1">
                            <span className="text-muted text-decoration-line-through" style={{ fontSize: "0.75rem" }}>
                              ₹{p.original_price || (p.price === 499 ? 1499 : p.price === 599 ? 1999 : p.price === 399 ? 1199 : Math.round(p.price * 2.8))}
                            </span>
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill" style={{ fontSize: "0.68rem" }}>
                              {Math.round(((Number(p.original_price) - Number(p.price)) / Number(p.original_price)) * 100)}% OFF
                            </span>
                          </div>
                          )}
                        </div>
                      </button>
                    </td>

                    {/* Lock toggle button */}
                    <td>
                      <button
                        type="button"
                        onClick={() => handleTogglePathwayLock(p)}
                        className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1 ${
                          p.is_locked !== false
                            ? "btn-outline-warning text-dark border-warning"
                            : "btn-outline-success border-success"
                        }`}
                        title={p.is_locked !== false ? "Click to make this pathway Free" : "Click to Lock (Require payment)"}
                      >
                        <i className={`bi ${p.is_locked !== false ? "bi-lock-fill text-warning" : "bi-unlock-fill text-success"}`} />
                        <span style={{ fontSize: "0.8rem" }}>
                          {p.is_locked !== false ? "Locked (Paid)" : "Free (Unlocked)"}
                        </span>
                      </button>
                    </td>

                    {/* Duration & Level */}
                    <td>
                      <div className="fw-medium text-dark">{p.duration || "-"}</div>
                      <small className="text-muted">{p.level || "All Levels"}</small>
                    </td>

                    {/* Modules Included */}
                    <td>
                      <span className="badge bg-primary-subtle text-primary border rounded-pill px-3 py-1">
                        <i className="bi bi-book me-1" />
                        {Array.isArray(p.curriculum_modules) ? p.curriculum_modules.length : 0} Modules Included
                      </span>
                    </td>

                    {/* Enrollments */}
                    <td>
                      <div className="fw-semibold text-dark">{p.enrollments_count || 0} Students</div>
                      <small className="text-success fw-medium">₹{(p.total_revenue || 0).toLocaleString()} Collected</small>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`badge ${p.is_active ? "bg-success-subtle text-success border border-success-subtle" : "bg-secondary text-white"} rounded-pill px-2 py-1`}>
                        {p.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-success"
                          title="Quick Price Update"
                          onClick={() => handleOpenQuickPrice(p)}
                        >
                          <i className="bi bi-currency-rupee me-1" /> Price
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          title="Edit Full Pathway Details"
                          onClick={() => handleOpenEdit(p)}
                        >
                          <i className="bi bi-pencil-fill me-1" /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          title="Delete Pathway"
                          onClick={() => handleDelete(p.id, p.title)}
                        >
                          <i className="bi bi-trash-fill" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK PRICE UPDATE MODAL */}
      {showPriceModal && pricingPathway && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1060 }}
          onClick={() => setShowPriceModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header bg-success text-white rounded-top-4">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-currency-rupee" />
                  <span>Update Pricing: {pricingPathway.title}</span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowPriceModal(false)}
                />
              </div>

              <form onSubmit={handleSaveQuickPrice}>
                <div className="modal-body p-4">
                  <div className="text-center mb-4">
                    <span
                      className="d-inline-flex align-items-center justify-content-center rounded-circle text-white mb-2 shadow"
                      style={{ width: 50, height: 50, background: pricingPathway.color || "#3b82f6", fontSize: "1.5rem" }}
                    >
                      <i className={`bi ${pricingPathway.icon || "bi-diagram-3-fill"}`} />
                    </span>
                    <h5 className="fw-bold text-dark mb-1">{pricingPathway.title}</h5>
                    <p className="text-muted small mb-0">Set the enrollment fee for students to unlock this specialization track.</p>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark small">Course Access Price (INR ₹) *</label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-success-subtle text-success fw-bold">₹</span>
                      <input
                        type="number"
                        className="form-control fw-bold text-success"
                        min="0"
                        step="1"
                        value={quickPrice}
                        onChange={(e) => setQuickPrice(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="d-flex justify-content-between mt-2 flex-wrap gap-1">
                      <span className="text-muted small">Quick presets:</span>
                      <div className="d-flex gap-1 flex-wrap">
                        {[299, 399, 499, 599, 799, 999].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            className={`btn btn-xs rounded-pill small py-0 px-2 ${Number(quickPrice) === amt ? "btn-success text-white" : "btn-outline-secondary"}`}
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => setQuickPrice(amt)}
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-4 border bg-light p-3">
                    <div className="form-check form-switch mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="pathwayQuickOfferEnabled"
                        checked={quickOfferEnabled}
                        onChange={(e) => setQuickOfferEnabled(e.target.checked)}
                      />
                      <label className="form-check-label fw-bold" htmlFor="pathwayQuickOfferEnabled">
                        Show limited-period offer to students
                      </label>
                    </div>
                    <small className="text-muted d-block mb-2">
                      When off, students see only the normal enrollment amount. The payment always uses the configured price above.
                    </small>
                    {quickOfferEnabled && (
                      <div>
                        <label className="form-label fw-semibold small">Original price before offer (₹)</label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          value={quickOriginalPrice}
                          onChange={(e) => setQuickOriginalPrice(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer bg-light rounded-bottom-4">
                  <button
                    type="button"
                    className="btn btn-secondary rounded-pill px-4"
                    onClick={() => setShowPriceModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success rounded-pill px-4 fw-semibold"
                    disabled={savingPrice}
                  >
                    {savingPrice ? "Saving..." : "Update Price Now"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FULL ADD / EDIT MODAL */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050 }}
          onClick={() => setShowModal(false)}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content rounded-4 border-0 shadow-lg" style={{ maxHeight: "92vh" }}>
              <div className="modal-header bg-light rounded-top-4 py-3 px-4">
                <div>
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
                    <span
                      className="d-inline-flex align-items-center justify-content-center rounded-3 text-white shadow-sm"
                      style={{ width: 32, height: 32, background: formData.color || "#3b82f6", fontSize: "1rem" }}
                    >
                      <i className={`bi ${formData.icon || "bi-diagram-3-fill"}`} />
                    </span>
                    <span>{editingPathway ? `Edit Specialization: ${editingPathway.title}` : "Create New Specialization Pathway"}</span>
                  </h5>
                  <small className="text-muted">Manage full pathway curriculum, enrollment pricing, and syllabus structure.</small>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>

              {/* Navigation Sub-Tabs within Modal */}
              <div className="bg-light-subtle border-bottom px-4 pt-2">
                <ul className="nav nav-tabs border-0">
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link fw-semibold border-0 py-2 px-3 ${modalTab === "details" ? "active bg-white text-primary border-bottom border-primary border-2" : "text-secondary"}`}
                      onClick={() => handleSwitchTab("details")}
                    >
                      <i className="bi bi-card-checklist me-1" /> 1. Track Details &amp; Pricing
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link fw-semibold border-0 py-2 px-3 ${modalTab === "modules" ? "active bg-white text-primary border-bottom border-primary border-2" : "text-secondary"}`}
                      onClick={() => handleSwitchTab("modules")}
                    >
                      <i className="bi bi-stack me-1" /> 2. Curriculum Modules ({modulesList.length})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link fw-semibold border-0 py-2 px-3 ${modalTab === "json" ? "active bg-white text-primary border-bottom border-primary border-2" : "text-secondary"}`}
                      onClick={() => handleSwitchTab("json")}
                    >
                      <i className="bi bi-code-square me-1" /> 3. Advanced JSON
                    </button>
                  </li>
                </ul>
              </div>

              <form onSubmit={handleSubmit} className="d-flex flex-column" style={{ minHeight: 0, overflow: "hidden" }}>
                <div className="modal-body p-4" style={{ overflowY: "auto" }}>
                  {/* TAB 1: BASIC DETAILS & PRICING */}
                  {modalTab === "details" && (
                    <div className="row g-3">
                      <div className="col-12 col-md-8">
                        <label className="form-label fw-semibold text-dark small">Pathway Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Backend & Systems Architecture"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label fw-bold text-success small">Enrollment Price (₹ INR) *</label>
                        <div className="input-group">
                          <span className="input-group-text bg-success-subtle text-success fw-bold">₹</span>
                          <input
                            type="number"
                            className="form-control fw-bold text-success"
                            placeholder="499"
                            min="0"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                          />
                        </div>
                        <div className="d-flex gap-1 mt-1 flex-wrap">
                          {[299, 399, 499, 599, 799, 999].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              className={`btn btn-xs py-0 px-2 rounded-pill small ${Number(formData.price) === amt ? "btn-success text-white" : "btn-outline-secondary"}`}
                              style={{ fontSize: "0.72rem" }}
                              onClick={() => setFormData({ ...formData, price: amt })}
                            >
                              ₹{amt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold text-dark small">Offer display</label>
                        <div className="form-check form-switch mt-1 mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="pathwayOfferEnabled"
                            checked={formData.offer_enabled}
                            onChange={(e) => setFormData({ ...formData, offer_enabled: e.target.checked })}
                          />
                          <label className="form-check-label" htmlFor="pathwayOfferEnabled">Enable promotional offer</label>
                        </div>
                        {formData.offer_enabled && (
                          <div className="input-group input-group-sm">
                            <span className="input-group-text">Original ₹</span>
                            <input
                              type="number"
                              className="form-control"
                              min="0"
                              value={formData.original_price}
                              onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                            />
                          </div>
                        )}
                        <small className="text-muted d-block mt-1" style={{ fontSize: "0.72rem" }}>
                          Off = students see only the normal enrollment price.
                        </small>
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold text-dark small">Unique URL Slug</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. backend or backend-architecture"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        />
                        <small className="text-muted" style={{ fontSize: "0.72rem" }}>Leave blank to auto-generate from title</small>
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold text-dark small">Badge Tag</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. High Demand, Popular, Core"
                          value={formData.badge}
                          onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold text-dark small">Duration</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. 12 Weeks"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold text-dark small">Experience Level</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Beginner to Advanced"
                          value={formData.level}
                          onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold text-dark small">Theme Accent Color</label>
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="color"
                            className="form-control form-control-color"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          />
                          <input
                            type="text"
                            className="form-control"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold text-dark small">Bootstrap Icon Class</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light text-primary">
                            <i className={`bi ${formData.icon || "bi-diagram-3-fill"}`} />
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="bi-terminal-fill"
                            value={formData.icon}
                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold text-dark small">Overview Summary Description</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          placeholder="Summary of what this specialization covers..."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold text-dark small">Core Technologies &amp; Skills (Comma-separated)</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Python 3.12, Flask, SQLAlchemy, JWT Auth, Docker, PostgreSQL"
                          value={formData.skills}
                          onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                        />
                      </div>

                      <div className="col-6 col-md-3">
                        <label className="form-label fw-semibold text-dark small">Display Order</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.sort_order}
                          onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })}
                        />
                      </div>

                      <div className="col-6 col-md-3">
                        <label className="form-label fw-semibold text-dark small">Visibility</label>
                        <div className="form-check form-switch mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="pathway_is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          />
                          <label className="form-check-label small fw-semibold" htmlFor="pathway_is_active">
                            {formData.is_active ? "Active & Visible" : "Hidden"}
                          </label>
                        </div>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold text-dark small">Access Lock (Payment Gate)</label>
                        <div className="form-check form-switch mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="pathway_is_locked"
                            checked={formData.is_locked}
                            onChange={(e) => setFormData({ ...formData, is_locked: e.target.checked })}
                          />
                          <label className="form-check-label small fw-semibold" htmlFor="pathway_is_locked">
                            {formData.is_locked ? "🔒 Locked (Payment Required)" : "🔓 Free (No Payment Required)"}
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: VISUAL CURRICULUM MODULES */}
                  {modalTab === "modules" && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <h6 className="fw-bold text-dark mb-0">Curriculum Course Modules</h6>
                          <small className="text-muted">Each specialization consists of course modules containing syllabus topics, notes, and resources.</small>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary rounded-pill px-3 d-inline-flex align-items-center gap-1"
                          onClick={handleAddModule}
                        >
                          <i className="bi bi-plus-circle-fill" /> Add New Module
                        </button>
                      </div>

                      {modulesList.length === 0 ? (
                        <div className="text-center py-5 bg-light rounded-4 border border-dashed">
                          <i className="bi bi-journal-plus fs-1 text-primary mb-2" />
                          <h6 className="fw-bold text-dark">No modules added yet</h6>
                          <p className="text-muted small mb-3">Click below to add your first curriculum module for this specialization.</p>
                          <button type="button" className="btn btn-sm btn-primary rounded-pill px-4 py-2" onClick={handleAddModule}>
                            <i className="bi bi-plus-lg me-1" /> Add Module
                          </button>
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-3">
                          {modulesList.map((mod, idx) => {
                            const isExpanded = expandedModuleIdx === idx;
                            return (
                              <div
                                key={idx}
                                className={`card border rounded-4 shadow-sm transition-all ${isExpanded ? "border-primary" : "border-light-subtle bg-white"}`}
                              >
                                {/* Module Card Header */}
                                <div
                                  className={`card-header d-flex justify-content-between align-items-center py-3 px-4 rounded-top-4 cursor-pointer ${isExpanded ? "bg-primary-subtle text-primary border-bottom border-primary-subtle" : "bg-white"}`}
                                  style={{ cursor: "pointer" }}
                                  onClick={() => setExpandedModuleIdx(isExpanded ? -1 : idx)}
                                >
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-primary text-white rounded-pill px-2 py-1" style={{ fontSize: "0.78rem" }}>
                                      #{idx + 1}
                                    </span>
                                    <span className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
                                      {mod.name || `Untitled Module ${idx + 1}`}
                                    </span>
                                    {mod.slug && (
                                      <code className="text-muted small ms-1" style={{ fontSize: "0.72rem" }}>
                                        ({mod.slug})
                                      </code>
                                    )}
                                    <button
                                      type="button"
                                      className={`btn btn-xs rounded-pill px-2 py-0 fw-semibold d-inline-flex align-items-center gap-1 ${
                                        mod.is_locked !== false
                                          ? "btn-outline-warning text-dark border-warning"
                                          : "btn-outline-success border-success"
                                      }`}
                                      title={mod.is_locked !== false ? "Module Locked (Requires Pathway Enrollment)" : "Module Free (Freely Accessible Preview)"}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateModuleField(idx, "is_locked", mod.is_locked === false ? true : false);
                                      }}
                                    >
                                      <i className={`bi ${mod.is_locked !== false ? "bi-lock-fill text-warning" : "bi-unlock-fill text-success"}`} style={{ fontSize: "0.75rem" }} />
                                      <span style={{ fontSize: "0.72rem" }}>
                                        {mod.is_locked !== false ? "Locked (Paid)" : "Free (Unlocked)"}
                                      </span>
                                    </button>
                                  </div>

                                  <div className="d-flex align-items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-outline-secondary py-0 px-2 rounded"
                                      title="Move Up"
                                      disabled={idx === 0}
                                      onClick={() => handleMoveModule(idx, -1)}
                                    >
                                      <i className="bi bi-arrow-up" />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-outline-secondary py-0 px-2 rounded"
                                      title="Move Down"
                                      disabled={idx === modulesList.length - 1}
                                      onClick={() => handleMoveModule(idx, 1)}
                                    >
                                      <i className="bi bi-arrow-down" />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-outline-danger py-0 px-2 rounded"
                                      title="Delete Module"
                                      onClick={() => handleDeleteModule(idx)}
                                    >
                                      <i className="bi bi-trash-fill" />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-link text-decoration-none text-muted"
                                      onClick={() => setExpandedModuleIdx(isExpanded ? -1 : idx)}
                                    >
                                      <i className={`bi ${isExpanded ? "bi-chevron-up" : "bi-chevron-down"}`} />
                                    </button>
                                  </div>
                                </div>

                                {/* Module Card Body (Expanded) */}
                                {isExpanded && (
                                  <div className="card-body p-4 bg-white rounded-bottom-4">
                                    <div className="row g-3">
                                      <div className="col-12 col-md-7">
                                        <label className="form-label fw-semibold text-dark small">Module Name *</label>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="e.g. Python Core Programming"
                                          value={mod.name || ""}
                                          onChange={(e) => handleUpdateModuleField(idx, "name", e.target.value)}
                                        />
                                      </div>

                                      <div className="col-12 col-md-5">
                                        <label className="form-label fw-semibold text-dark small">Module Slug</label>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="e.g. python-core"
                                          value={mod.slug || ""}
                                          onChange={(e) => handleUpdateModuleField(idx, "slug", e.target.value)}
                                        />
                                      </div>

                                      <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold text-dark small">Short Summary</label>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="1-line summary..."
                                          value={mod.short_description || ""}
                                          onChange={(e) => handleUpdateModuleField(idx, "short_description", e.target.value)}
                                        />
                                      </div>

                                      <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold text-dark small">Module Access Lock</label>
                                        <div className="form-check form-switch mt-1">
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id={`mod_lock_${idx}`}
                                            checked={mod.is_locked !== false}
                                            onChange={(e) => handleUpdateModuleField(idx, "is_locked", e.target.checked)}
                                          />
                                          <label className="form-check-label small fw-semibold" htmlFor={`mod_lock_${idx}`}>
                                            {mod.is_locked !== false ? "🔒 Module Locked (Paid/Pathway Required)" : "🔓 Module Free (Free Access for All)"}
                                          </label>
                                        </div>
                                      </div>

                                      <div className="col-12">
                                        <label className="form-label fw-semibold text-dark small">Detailed Module Syllabus / Architecture</label>
                                        <textarea
                                          className="form-control form-control-sm"
                                          rows="3"
                                          placeholder="Deep dive into syllabus topics and theory..."
                                          value={mod.description || ""}
                                          onChange={(e) => handleUpdateModuleField(idx, "description", e.target.value)}
                                        />
                                      </div>

                                      <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold text-dark small">
                                          Topics Covered (One per line)
                                        </label>
                                        <textarea
                                          className="form-control form-control-sm"
                                          rows="3"
                                          placeholder="Data Structures & Collections&#10;OOP & Magic Methods&#10;Context Managers"
                                          value={Array.isArray(mod.topics) ? mod.topics.join("\n") : mod.topics || ""}
                                          onChange={(e) =>
                                            handleUpdateModuleField(
                                              idx,
                                              "topics",
                                              e.target.value.split("\n").filter((t) => t.trim().length > 0)
                                            )
                                          }
                                        />
                                      </div>

                                      <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold text-dark small">
                                          Important Highlights / Key Takeaways (One per line)
                                        </label>
                                        <textarea
                                          className="form-control form-control-sm"
                                          rows="3"
                                          placeholder="Master memory architecture&#10;Implement custom Context Managers"
                                          value={Array.isArray(mod.important_points) ? mod.important_points.join("\n") : mod.important_points || ""}
                                          onChange={(e) =>
                                            handleUpdateModuleField(
                                              idx,
                                              "important_points",
                                              e.target.value.split("\n").filter((p) => p.trim().length > 0)
                                            )
                                          }
                                        />
                                      </div>

                                      <div className="col-12">
                                        <label className="form-label fw-semibold text-dark small">
                                          Code Examples &amp; Syntax Notes
                                        </label>
                                        <textarea
                                          className="form-control form-control-sm font-monospace"
                                          rows="3"
                                          style={{ fontSize: "0.82rem" }}
                                          placeholder="# Code snippet..."
                                          value={mod.examples_notes || ""}
                                          onChange={(e) => handleUpdateModuleField(idx, "examples_notes", e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          <div className="text-center pt-2">
                            <button
                              type="button"
                              className="btn btn-outline-primary rounded-pill px-4 py-2 small fw-semibold"
                              onClick={handleAddModule}
                            >
                              <i className="bi bi-plus-circle me-1" /> Add Another Module
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: ADVANCED JSON */}
                  {modalTab === "json" && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label fw-semibold text-dark small mb-0">
                          Raw Curriculum Modules JSON Structure
                        </label>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-secondary rounded-pill px-3 py-1"
                          onClick={() => {
                            try {
                              const parsed = JSON.parse(formData.curriculum_modules_json);
                              setFormData((prev) => ({ ...prev, curriculum_modules_json: JSON.stringify(parsed, null, 2) }));
                              showNotice("JSON formatted cleanly.");
                            } catch {
                              showNotice("Cannot format: invalid JSON syntax.", "danger");
                            }
                          }}
                        >
                          <i className="bi bi-braces me-1" /> Format JSON
                        </button>
                      </div>
                      <textarea
                        className="form-control font-monospace"
                        rows="15"
                        style={{ fontSize: "0.82rem" }}
                        value={formData.curriculum_modules_json}
                        onChange={(e) => setFormData({ ...formData, curriculum_modules_json: e.target.value })}
                      />
                      <small className="text-muted d-block mt-1">
                        Any changes made here will be validated and synced to the specialization track.
                      </small>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="modal-footer bg-light rounded-bottom-4 py-3 px-4">
                  <div className="d-flex justify-content-between align-items-center w-100">
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className={`btn btn-sm ${modalTab === "details" ? "btn-secondary" : "btn-outline-secondary"} rounded-pill px-3`}
                        onClick={() => handleSwitchTab("details")}
                      >
                        1. Details
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${modalTab === "modules" ? "btn-secondary" : "btn-outline-secondary"} rounded-pill px-3`}
                        onClick={() => handleSwitchTab("modules")}
                      >
                        2. Modules ({modulesList.length})
                      </button>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary rounded-pill px-4"
                        onClick={() => setShowModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary rounded-pill px-4 fw-semibold"
                        disabled={saving}
                      >
                        {saving ? "Saving..." : editingPathway ? "Save Changes" : "Create Pathway"}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
