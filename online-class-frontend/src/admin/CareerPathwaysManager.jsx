import { useEffect, useState, useCallback } from "react";
import api, {
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
  const [modalTab, setModalTab] = useState("details"); // 'details' | 'modules' | 'documents' | 'videos'

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

  // Document Management State
  const [docSearch, setDocSearch] = useState("");
  const [docFilterMod, setDocFilterMod] = useState("");
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [savingDoc, setSavingDoc] = useState(false);
  const [docFormData, setDocFormData] = useState({
    module_idx: 0,
    title: "",
    description: "",
    file_type: "PDF",
    file_url: "",
    formatted_size: "",
    is_locked: true,
  });
  const [docFile, setDocFile] = useState(null);

  // Video Management State
  const [vidSearch, setVidSearch] = useState("");
  const [vidFilterMod, setVidFilterMod] = useState("");
  const [vidModalOpen, setVidModalOpen] = useState(false);
  const [editingVid, setEditingVid] = useState(null);
  const [savingVid, setSavingVid] = useState(false);
  const [vidFormData, setVidFormData] = useState({
    module_idx: 0,
    title: "",
    description: "",
    duration: "",
    video_url: "",
    thumbnail_url: "",
    is_locked: true,
  });
  const [vidFile, setVidFile] = useState(null);
  const [vidThumbnail, setVidThumbnail] = useState(null);

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
        is_locked: true,
      },
    ];

    setModulesList(initialModules);
    setExpandedModuleIdx(0);
    setModalTab("details");
    setDocSearch("");
    setDocFilterMod("");
    setVidSearch("");
    setVidFilterMod("");
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
    setDocSearch("");
    setDocFilterMod("");
    setVidSearch("");
    setVidFilterMod("");
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
  };

  const handleDeleteModule = (idx) => {
    const mod = modulesList[idx];
    if (!window.confirm(`Remove module "${mod?.name || `Module ${idx + 1}`}"? This will also remove its documents and videos.`)) return;
    const updated = modulesList.filter((_, i) => i !== idx);
    setModulesList(updated);
    if (expandedModuleIdx >= updated.length) {
      setExpandedModuleIdx(Math.max(0, updated.length - 1));
    }
  };

  const handleMoveModule = (idx, direction) => {
    const target = idx + direction;
    if (target < 0 || target >= modulesList.length) return;
    const updated = [...modulesList];
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    setModulesList(updated);
    setExpandedModuleIdx(target);
  };

  const handleUpdateModuleField = (idx, field, value) => {
    const updated = [...modulesList];
    updated[idx] = { ...updated[idx], [field]: value };
    setModulesList(updated);
  };

  // Total Counts
  const totalDocsCount = modulesList.reduce(
    (acc, m) => acc + (Array.isArray(m.documents) ? m.documents.length : 0),
    0
  );
  const totalVidsCount = modulesList.reduce(
    (acc, m) => acc + (Array.isArray(m.videos) ? m.videos.length : 0),
    0
  );

  // Flattened documents with module references
  const allDocuments = modulesList.flatMap((m, modIdx) =>
    (Array.isArray(m.documents) ? m.documents : []).map((doc, docIdx) => ({
      ...doc,
      _modIdx: modIdx,
      _docIdx: docIdx,
      _moduleName: m.name || `Module ${modIdx + 1}`,
      _moduleSlug: m.slug || `module-${modIdx + 1}`,
    }))
  );

  const filteredDocs = allDocuments.filter((d) => {
    const matchMod = docFilterMod === "" || String(d._modIdx) === String(docFilterMod);
    const matchSearch =
      !docSearch.trim() ||
      d.title?.toLowerCase().includes(docSearch.toLowerCase()) ||
      d.description?.toLowerCase().includes(docSearch.toLowerCase());
    return matchMod && matchSearch;
  });

  // Flattened videos with module references
  const allVideos = modulesList.flatMap((m, modIdx) =>
    (Array.isArray(m.videos) ? m.videos : []).map((vid, vidIdx) => ({
      ...vid,
      _modIdx: modIdx,
      _vidIdx: vidIdx,
      _moduleName: m.name || `Module ${modIdx + 1}`,
      _moduleSlug: m.slug || `module-${modIdx + 1}`,
    }))
  );

  const filteredVids = allVideos.filter((v) => {
    const matchMod = vidFilterMod === "" || String(v._modIdx) === String(vidFilterMod);
    const matchSearch =
      !vidSearch.trim() ||
      v.title?.toLowerCase().includes(vidSearch.toLowerCase()) ||
      v.description?.toLowerCase().includes(vidSearch.toLowerCase());
    return matchMod && matchSearch;
  });

  // ==========================================
  // DOCUMENT MODAL HANDLERS
  // ==========================================
  const handleOpenCreateDoc = (preselectedModIdx = null) => {
    setEditingDoc(null);
    setDocFile(null);
    const modIdx = preselectedModIdx !== null ? preselectedModIdx : docFilterMod !== "" ? Number(docFilterMod) : 0;
    setDocFormData({
      module_idx: modIdx,
      title: "",
      description: "",
      file_type: "PDF",
      file_url: "",
      formatted_size: "",
      is_locked: true,
    });
    setDocModalOpen(true);
  };

  const handleOpenEditDoc = (doc) => {
    setEditingDoc(doc);
    setDocFile(null);
    setDocFormData({
      module_idx: doc._modIdx,
      title: doc.title || "",
      description: doc.description || "",
      file_type: doc.file_type || "PDF",
      file_url: doc.file_url || "",
      formatted_size: doc.formatted_size || "",
      is_locked: doc.is_locked !== false,
    });
    setDocModalOpen(true);
  };

  const handleSaveDoc = async (e) => {
    e.preventDefault();
    if (!docFormData.title.trim()) {
      showNotice("Document title is required.", "danger");
      return;
    }
    const targetModIdx = Number(docFormData.module_idx);
    if (isNaN(targetModIdx) || targetModIdx < 0 || targetModIdx >= modulesList.length) {
      showNotice("Please select a valid curriculum module.", "danger");
      return;
    }
    if (!editingDoc && !docFile && !docFormData.file_url.trim()) {
      showNotice("Please select a document file to upload or provide a file URL.", "danger");
      return;
    }

    setSavingDoc(true);
    try {
      let finalFileUrl = docFormData.file_url.trim();
      let finalSize = docFormData.formatted_size.trim();
      let finalType = docFormData.file_type || "PDF";
      let contentItemId = editingDoc?.content_item_id || null;

      if (docFile) {
        finalSize = `${(docFile.size / 1024 / 1024).toFixed(1)} MB`;
        const ext = docFile.name.split(".").pop()?.toUpperCase();
        if (ext) finalType = ext;

        const uploadData = new FormData();
        uploadData.append("section", "lecture_material");
        uploadData.append("title", docFormData.title.trim());
        uploadData.append("description", docFormData.description.trim());
        uploadData.append("file", docFile);

        const upRes = await api.post("/admin/items", uploadData);

        const uploaded = upRes.data?.data;

        if (!uploaded?.id) {
          throw new Error("The document upload was not persisted by the server.");
        }

        contentItemId = uploaded.id;
        finalFileUrl = uploaded.file_url || "";
      }

      const docEntry = {
        id: editingDoc ? editingDoc.id : Date.now(),
        title: docFormData.title.trim(),
        description: docFormData.description.trim(),
        file_type: finalType,
        file_url: finalFileUrl,
        formatted_size: finalSize || "1.5 MB",
        is_locked: docFormData.is_locked,
        content_item_id: contentItemId,
      };

      const updated = [...modulesList];

      if (editingDoc) {
        if (editingDoc._modIdx !== targetModIdx) {
          const oldDocs = [...(updated[editingDoc._modIdx].documents || [])];
          oldDocs.splice(editingDoc._docIdx, 1);
          updated[editingDoc._modIdx] = { ...updated[editingDoc._modIdx], documents: oldDocs };

          const newDocs = [...(updated[targetModIdx].documents || []), docEntry];
          updated[targetModIdx] = { ...updated[targetModIdx], documents: newDocs };
        } else {
          const curDocs = [...(updated[targetModIdx].documents || [])];
          curDocs[editingDoc._docIdx] = docEntry;
          updated[targetModIdx] = { ...updated[targetModIdx], documents: curDocs };
        }
        showNotice("Document updated successfully.");
      } else {
        const curDocs = [...(updated[targetModIdx].documents || []), docEntry];
        updated[targetModIdx] = { ...updated[targetModIdx], documents: curDocs };
        showNotice("Document uploaded to module successfully.");
      }

      setModulesList(updated);
      setDocModalOpen(false);
    } catch (err) {
      showNotice("Error saving document: " + (err.message || "Unknown error"), "danger");
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDoc = (doc) => {
    if (!window.confirm(`Remove document "${doc.title}" from ${doc._moduleName}?`)) return;
    const updated = [...modulesList];
    const docs = [...(updated[doc._modIdx].documents || [])];
    docs.splice(doc._docIdx, 1);
    updated[doc._modIdx] = { ...updated[doc._modIdx], documents: docs };
    setModulesList(updated);
    showNotice(`Document "${doc.title}" removed.`);
  };

  const handleToggleDocLock = (doc) => {
    const updated = [...modulesList];
    const docs = [...(updated[doc._modIdx].documents || [])];
    const curLock = doc.is_locked !== false;
    docs[doc._docIdx] = { ...doc, is_locked: !curLock };
    updated[doc._modIdx] = { ...updated[doc._modIdx], documents: docs };
    setModulesList(updated);
    showNotice(`Document "${doc.title}" is now ${!curLock ? "🔒 Locked (Paid Access)" : "🔓 Free Preview"}.`);
  };

  // ==========================================
  // VIDEO MODAL HANDLERS
  // ==========================================
  const handleOpenCreateVid = (preselectedModIdx = null) => {
    setEditingVid(null);
    setVidFile(null);
    setVidThumbnail(null);
    const modIdx = preselectedModIdx !== null ? preselectedModIdx : vidFilterMod !== "" ? Number(vidFilterMod) : 0;
    setVidFormData({
      module_idx: modIdx,
      title: "",
      description: "",
      duration: "",
      video_url: "",
      thumbnail_url: "",
      is_locked: true,
    });
    setVidModalOpen(true);
  };

  const handleOpenEditVid = (vid) => {
    setEditingVid(vid);
    setVidFile(null);
    setVidThumbnail(null);
    setVidFormData({
      module_idx: vid._modIdx,
      title: vid.title || "",
      description: vid.description || "",
      duration: vid.duration || "",
      video_url: vid.video_url || "",
      thumbnail_url: vid.thumbnail_url || "",
      is_locked: vid.is_locked !== false,
    });
    setVidModalOpen(true);
  };

  const handleSaveVid = async (e) => {
    e.preventDefault();
    if (!vidFormData.title.trim()) {
      showNotice("Video title is required.", "danger");
      return;
    }
    const targetModIdx = Number(vidFormData.module_idx);
    if (isNaN(targetModIdx) || targetModIdx < 0 || targetModIdx >= modulesList.length) {
      showNotice("Please select a valid curriculum module.", "danger");
      return;
    }
    if (!editingVid && !vidFile && !vidFormData.video_url.trim()) {
      showNotice("Please provide a video stream URL or select a video file to upload.", "danger");
      return;
    }

    setSavingVid(true);
    try {
      let finalVideoUrl = vidFormData.video_url.trim();
      let finalThumbUrl = vidFormData.thumbnail_url.trim();
      let contentItemId = editingVid?.content_item_id || null;
      let thumbnailContentItemId =
        editingVid?.thumbnail_content_item_id || null;

      if (vidFile) {
        const uploadData = new FormData();
        uploadData.append("section", "lecture_material");
        uploadData.append("title", vidFormData.title.trim());
        uploadData.append("description", vidFormData.description.trim());
        uploadData.append("file", vidFile);

        const upRes = await api.post("/admin/items", uploadData);

        const uploaded = upRes.data?.data;

        if (!uploaded?.id) {
          throw new Error("The video upload was not persisted by the server.");
        }

        contentItemId = uploaded.id;
        finalVideoUrl = uploaded.file_url || "";
      }

      if (vidThumbnail) {
        const thumbData = new FormData();
        thumbData.append("section", "lecture_material");
        thumbData.append(
          "title",
          `${vidFormData.title.trim()} Thumbnail`
        );
        thumbData.append("file", vidThumbnail);

        const thumbRes = await api.post("/admin/items", thumbData);

        const uploadedThumbnail = thumbRes.data?.data;

        if (!uploadedThumbnail?.id) {
          throw new Error("The video thumbnail upload was not persisted by the server.");
        }

        thumbnailContentItemId = uploadedThumbnail.id;
        finalThumbUrl = uploadedThumbnail.file_url || "";
      }

      const vidEntry = {
        id: editingVid ? editingVid.id : Date.now(),
        title: vidFormData.title.trim(),
        description: vidFormData.description.trim(),
        duration: vidFormData.duration.trim() || "30:00",
        video_url: finalVideoUrl,
        thumbnail_url: finalThumbUrl,
        is_locked: vidFormData.is_locked,
        content_item_id: contentItemId,
        thumbnail_content_item_id: thumbnailContentItemId,
      };

      const updated = [...modulesList];

      if (editingVid) {
        if (editingVid._modIdx !== targetModIdx) {
          const oldVids = [...(updated[editingVid._modIdx].videos || [])];
          oldVids.splice(editingVid._vidIdx, 1);
          updated[editingVid._modIdx] = { ...updated[editingVid._modIdx], videos: oldVids };

          const newVids = [...(updated[targetModIdx].videos || []), vidEntry];
          updated[targetModIdx] = { ...updated[targetModIdx], videos: newVids };
        } else {
          const curVids = [...(updated[targetModIdx].videos || [])];
          curVids[editingVid._vidIdx] = vidEntry;
          updated[targetModIdx] = { ...updated[targetModIdx], videos: curVids };
        }
        showNotice("Video lecture updated successfully.");
      } else {
        const curVids = [...(updated[targetModIdx].videos || []), vidEntry];
        updated[targetModIdx] = { ...updated[targetModIdx], videos: curVids };
        showNotice("Video lecture added to module successfully.");
      }

      setModulesList(updated);
      setVidModalOpen(false);
    } catch (err) {
      showNotice("Error saving video: " + (err.message || "Unknown error"), "danger");
    } finally {
      setSavingVid(false);
    }
  };

  const handleDeleteVid = (vid) => {
    if (!window.confirm(`Remove video lecture "${vid.title}" from ${vid._moduleName}?`)) return;
    const updated = [...modulesList];
    const vids = [...(updated[vid._modIdx].videos || [])];
    vids.splice(vid._vidIdx, 1);
    updated[vid._modIdx] = { ...updated[vid._modIdx], videos: vids };
    setModulesList(updated);
    showNotice(`Video "${vid.title}" removed.`);
  };

  const handleToggleVidLock = (vid) => {
    const updated = [...modulesList];
    const vids = [...(updated[vid._modIdx].videos || [])];
    const curLock = vid.is_locked !== false;
    vids[vid._vidIdx] = { ...vid, is_locked: !curLock };
    updated[vid._modIdx] = { ...updated[vid._modIdx], videos: vids };
    setModulesList(updated);
    showNotice(`Video "${vid.title}" is now ${!curLock ? "🔒 Locked (Paid Access)" : "🔓 Free Preview"}.`);
  };

  // Main Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showNotice("Pathway title is required.", "danger");
      return;
    }

    setSaving(true);

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
      curriculum_modules: modulesList,
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
            Configure engineering specializations, set custom course enrollment prices (₹), and manage curriculum modules, documents, and video lectures.
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
                          onClick={() => handleOpenEdit(p)}
                        >
                          <i className="bi bi-pencil-fill me-1" /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
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

      {/* ============================================================
          MODAL: ADD / EDIT PATHWAY & CURRICULUM
          ============================================================ */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1050 }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
            style={{ maxHeight: "94vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content rounded-4 border-0 shadow-lg d-flex flex-column" style={{ maxHeight: "92vh", overflow: "hidden" }}>
              {/* Modal Header */}
              <div className="modal-header bg-light border-bottom px-4 py-3 flex-shrink-0">
                <div>
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
                    <span
                      className="d-inline-flex align-items-center justify-content-center rounded-3 text-white shadow-sm"
                      style={{ width: 30, height: 30, background: formData.color || "#3b82f6", fontSize: "0.9rem" }}
                    >
                      <i className={`bi ${formData.icon || "bi-diagram-3-fill"}`} />
                    </span>
                    <span>{editingPathway ? `Edit Specialization: ${formData.title || editingPathway.title}` : "Add New Specialization Track"}</span>
                  </h5>
                  <p className="text-muted small mb-0 mt-1">
                    Configure track details, syllabus modules, study documents, and video lectures.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>

              {/* Navigation Sub-Tabs within Modal */}
              <div className="bg-light-subtle border-bottom px-4 pt-2 flex-shrink-0">
                <ul className="nav nav-tabs border-0">
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link fw-semibold border-0 py-2 px-3 ${modalTab === "details" ? "active bg-white text-primary border-bottom border-primary border-2" : "text-secondary"}`}
                      onClick={() => setModalTab("details")}
                    >
                      <i className="bi bi-card-checklist me-1" /> 1. Track Details &amp; Pricing
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link fw-semibold border-0 py-2 px-3 ${modalTab === "modules" ? "active bg-white text-primary border-bottom border-primary border-2" : "text-secondary"}`}
                      onClick={() => setModalTab("modules")}
                    >
                      <i className="bi bi-stack me-1" /> 2. Curriculum Modules ({modulesList.length})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link fw-semibold border-0 py-2 px-3 ${modalTab === "documents" ? "active bg-white text-info border-bottom border-info border-2" : "text-secondary"}`}
                      onClick={() => setModalTab("documents")}
                    >
                      <i className="bi bi-file-earmark-text-fill me-1 text-info" /> 3. Documents ({totalDocsCount})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link fw-semibold border-0 py-2 px-3 ${modalTab === "videos" ? "active bg-white text-danger border-bottom border-danger border-2" : "text-secondary"}`}
                      onClick={() => setModalTab("videos")}
                    >
                      <i className="bi bi-play-circle-fill me-1 text-danger" /> 4. Videos ({totalVidsCount})
                    </button>
                  </li>
                </ul>
              </div>

              <form onSubmit={handleSubmit} className="d-flex flex-column" style={{ minHeight: 0, overflow: "hidden", flex: "1 1 auto" }}>
                <div className="modal-body p-4" style={{ overflowY: "auto", flex: "1 1 auto" }}>
                  {/* ============================================================
                      TAB 1: BASIC DETAILS & PRICING
                      ============================================================ */}
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
                        <label className="form-label fw-semibold text-dark small">Slug Identifier</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="backend"
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
                          placeholder="e.g. High Demand, Specialization"
                          value={formData.badge}
                          onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold text-dark small">Theme Color</label>
                        <div className="d-flex gap-2 align-items-center">
                          <input
                            type="color"
                            className="form-control form-control-color p-1"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            title="Choose brand color"
                          />
                          <input
                            type="text"
                            className="form-control font-monospace"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold text-dark small">Bootstrap Icon Class</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light">
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
                        <label className="form-label fw-semibold text-dark small">Short Overview / Description</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          placeholder="Summary of what the student will learn in this pathway..."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold text-dark small">Core Skills Covered (Comma-separated)</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Python 3.12, Flask, REST APIs, Docker, PostgreSQL"
                          value={formData.skills}
                          onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold text-dark small">Duration</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. 12 Weeks"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold text-dark small">Difficulty Level</label>
                        <select
                          className="form-select"
                          value={formData.level}
                          onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        >
                          <option value="All Levels">All Levels</option>
                          <option value="Beginner">Beginner</option>
                          <option value="Beginner to Advanced">Beginner to Advanced</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>

                      {/* Course Pricing Box */}
                      <div className="col-12">
                        <div className="card border rounded-4 p-4 bg-light shadow-none">
                          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                            <i className="bi bi-currency-rupee text-success fs-5" />
                            <span>Course Pathway Pricing &amp; Enrollment Fees</span>
                          </h6>
                          <div className="row g-3">
                            <div className="col-12 col-md-4">
                              <label className="form-label fw-bold text-dark small">Enrollment Price (INR ₹) *</label>
                              <div className="input-group">
                                <span className="input-group-text bg-success-subtle text-success fw-bold">₹</span>
                                <input
                                  type="number"
                                  className="form-control fw-bold text-success"
                                  min="0"
                                  step="1"
                                  value={formData.price}
                                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                  required
                                />
                              </div>
                            </div>
                            <div className="col-12 col-md-4">
                              <label className="form-label fw-semibold text-dark small">Original Price Before Offer (₹)</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light text-muted">₹</span>
                                <input
                                  type="number"
                                  className="form-control"
                                  min="0"
                                  placeholder="1499"
                                  value={formData.original_price ?? ""}
                                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                                />
                              </div>
                              <small className="text-muted" style={{ fontSize: "0.72rem" }}>Shown as strikethrough discount</small>
                            </div>
                            <div className="col-12 col-md-4">
                              <label className="form-label fw-semibold text-dark small">Show Discount Offer Badge</label>
                              <div className="form-check form-switch mt-2">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="formOfferToggle"
                                  checked={formData.offer_enabled}
                                  onChange={(e) => setFormData({ ...formData, offer_enabled: e.target.checked })}
                                />
                                <label className="form-check-label small fw-semibold" htmlFor="formOfferToggle">
                                  {formData.offer_enabled ? "Discount Badge Visible" : "Badge Hidden"}
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Publishing & Lock Controls */}
                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold text-dark small">Sort Display Order</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.sort_order}
                          onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })}
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold text-dark small">Publish Status</label>
                        <div className="form-check form-switch mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="formActiveToggle"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          />
                          <label className="form-check-label small fw-semibold" htmlFor="formActiveToggle">
                            {formData.is_active ? "Active (Visible to Students)" : "Hidden (Draft)"}
                          </label>
                        </div>
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold text-dark small">Pathway Access Lock</label>
                        <div className="form-check form-switch mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="formLockToggle"
                            checked={formData.is_locked}
                            onChange={(e) => setFormData({ ...formData, is_locked: e.target.checked })}
                          />
                          <label className="form-check-label small fw-bold" htmlFor="formLockToggle">
                            {formData.is_locked ? "🔒 Locked (Requires Enrollment)" : "🔓 Free (Unlocked for Everyone)"}
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================================
                      TAB 2: CURRICULUM MODULES
                      ============================================================ */}
                  {modalTab === "modules" && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <div>
                          <h6 className="fw-bold text-dark mb-0">Syllabus Modules Editor ({modulesList.length} Modules)</h6>
                          <small className="text-muted">
                            Drag or reorder topics, edit detailed syllabus outlines, and organize learning materials.
                          </small>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1"
                          onClick={handleAddModule}
                        >
                          <i className="bi bi-plus-circle me-1" /> Add New Module
                        </button>
                      </div>

                      {modulesList.length === 0 ? (
                        <div className="text-center py-5 text-muted border rounded-4 bg-light">
                          <i className="bi bi-stack fs-1 mb-2 text-primary" />
                          <h6 className="fw-bold text-dark">No curriculum modules added</h6>
                          <p className="small mb-3">Add modules to construct the syllabus structure for this pathway.</p>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary rounded-pill px-4"
                            onClick={handleAddModule}
                          >
                            <i className="bi bi-plus-lg me-1" /> Add First Module
                          </button>
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-3">
                          {modulesList.map((mod, idx) => {
                            const isExpanded = expandedModuleIdx === idx;
                            const modDocsCount = Array.isArray(mod.documents) ? mod.documents.length : 0;
                            const modVidsCount = Array.isArray(mod.videos) ? mod.videos.length : 0;
                            return (
                              <div
                                key={mod.id || idx}
                                className={`card border rounded-4 shadow-none ${isExpanded ? "border-primary" : "border-light-subtle bg-light"}`}
                              >
                                {/* Module Header Bar */}
                                <div
                                  className="card-header bg-transparent d-flex justify-content-between align-items-center p-3 cursor-pointer"
                                  onClick={() => setExpandedModuleIdx(isExpanded ? null : idx)}
                                >
                                  <div className="d-flex align-items-center gap-2 text-truncate me-2">
                                    <span className="badge bg-primary text-white rounded-pill px-2 py-1 small">
                                      #{idx + 1}
                                    </span>
                                    <span className="fw-bold text-dark text-truncate">
                                      {mod.name || `Module ${idx + 1}`}
                                    </span>
                                    {mod.is_locked === false && (
                                      <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill small">
                                        Free Preview
                                      </span>
                                    )}
                                    <span className="badge bg-info-subtle text-info border border-info-subtle rounded-pill small">
                                      <i className="bi bi-file-earmark-text me-1" />{modDocsCount} Docs
                                    </span>
                                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill small">
                                      <i className="bi bi-play-circle me-1" />{modVidsCount} Videos
                                    </span>
                                  </div>

                                  <div className="d-flex align-items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-outline-secondary rounded-circle"
                                      style={{ width: 26, height: 26, padding: 0 }}
                                      disabled={idx === 0}
                                      onClick={() => handleMoveModule(idx, -1)}
                                      title="Move Up"
                                    >
                                      <i className="bi bi-arrow-up" />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-outline-secondary rounded-circle"
                                      style={{ width: 26, height: 26, padding: 0 }}
                                      disabled={idx === modulesList.length - 1}
                                      onClick={() => handleMoveModule(idx, 1)}
                                      title="Move Down"
                                    >
                                      <i className="bi bi-arrow-down" />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-outline-danger rounded-circle ms-1"
                                      style={{ width: 26, height: 26, padding: 0 }}
                                      onClick={() => handleDeleteModule(idx)}
                                      title="Delete Module"
                                    >
                                      <i className="bi bi-trash" />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-light rounded-circle ms-1"
                                      style={{ width: 26, height: 26, padding: 0 }}
                                      onClick={() => setExpandedModuleIdx(isExpanded ? null : idx)}
                                      title={isExpanded ? "Collapse" : "Expand"}
                                    >
                                      <i className={`bi ${isExpanded ? "bi-chevron-up" : "bi-chevron-down"}`} />
                                    </button>
                                  </div>
                                </div>

                                {/* Module Body */}
                                {isExpanded && (
                                  <div className="card-body p-3 pt-0 border-top">
                                    <div className="row g-3 pt-3">
                                      <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold text-dark small">Module Title *</label>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="e.g. Python Core Programming"
                                          value={mod.name || ""}
                                          onChange={(e) => handleUpdateModuleField(idx, "name", e.target.value)}
                                        />
                                      </div>
                                      <div className="col-12 col-md-3">
                                        <label className="form-label fw-semibold text-dark small">Slug</label>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="python-core"
                                          value={mod.slug || ""}
                                          onChange={(e) => handleUpdateModuleField(idx, "slug", e.target.value)}
                                        />
                                      </div>
                                      <div className="col-12 col-md-3">
                                        <label className="form-label fw-semibold text-dark small">Module Lock Status</label>
                                        <div className="form-check form-switch mt-1">
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id={`mod_lock_${idx}`}
                                            checked={mod.is_locked !== false}
                                            onChange={(e) => handleUpdateModuleField(idx, "is_locked", e.target.checked)}
                                          />
                                          <label className="form-check-label small fw-semibold" htmlFor={`mod_lock_${idx}`}>
                                            {mod.is_locked !== false ? "🔒 Locked" : "🔓 Free Preview"}
                                          </label>
                                        </div>
                                      </div>

                                      <div className="col-12">
                                        <label className="form-label fw-semibold text-dark small">Short Summary</label>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="Key concepts and practical implementation..."
                                          value={mod.short_description || ""}
                                          onChange={(e) => handleUpdateModuleField(idx, "short_description", e.target.value)}
                                        />
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

                                      {/* Quick Upload Action Bar for this Module */}
                                      <div className="col-12">
                                        <div className="p-3 bg-white rounded-3 border d-flex justify-content-between align-items-center flex-wrap gap-2">
                                          <div className="small text-muted">
                                            <strong>Resources for this module:</strong>{" "}
                                            <span className="badge bg-info-subtle text-info border border-info-subtle rounded-pill me-1">
                                              {modDocsCount} Documents
                                            </span>
                                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill">
                                              {modVidsCount} Videos
                                            </span>
                                          </div>
                                          <div className="d-flex gap-2">
                                            <button
                                              type="button"
                                              className="btn btn-xs btn-outline-info rounded-pill px-3 py-1 fw-semibold"
                                              onClick={() => handleOpenCreateDoc(idx)}
                                            >
                                              <i className="bi bi-file-earmark-plus-fill me-1" /> Upload Document
                                            </button>
                                            <button
                                              type="button"
                                              className="btn btn-xs btn-outline-danger rounded-pill px-3 py-1 fw-semibold"
                                              onClick={() => handleOpenCreateVid(idx)}
                                            >
                                              <i className="bi bi-camera-video-fill me-1" /> Add Video
                                            </button>
                                          </div>
                                        </div>
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

                  {/* ============================================================
                      TAB 3: DOCUMENTS (REPLACES ADVANCED JSON)
                      ============================================================ */}
                  {modalTab === "documents" && (
                    <div>
                      {/* Search and Action Bar */}
                      <div className="row g-2 mb-3 align-items-center">
                        <div className="col-12 col-md-5">
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-light"><i className="bi bi-search" /></span>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Search document title or description..."
                              value={docSearch}
                              onChange={(e) => setDocSearch(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-12 col-md-4">
                          <select
                            className="form-select form-select-sm"
                            value={docFilterMod}
                            onChange={(e) => setDocFilterMod(e.target.value)}
                          >
                            <option value="">All Curriculum Modules ({modulesList.length})</option>
                            {modulesList.map((m, idx) => (
                              <option key={idx} value={idx}>
                                Module {idx + 1}: {m.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-12 col-md-3 text-md-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-info text-white w-100 rounded-pill fw-semibold shadow-sm"
                            onClick={() => handleOpenCreateDoc()}
                          >
                            <i className="bi bi-file-earmark-plus-fill me-1" /> Upload Document
                          </button>
                        </div>
                      </div>

                      {filteredDocs.length === 0 ? (
                        <div className="text-center py-5 text-muted bg-light rounded-4 border border-dashed">
                          <i className="bi bi-file-earmark-text fs-1 mb-2 text-info opacity-50 d-block" />
                          <h6 className="fw-bold text-dark mb-1">No study documents found</h6>
                          <p className="small text-muted mb-3">
                            {docSearch || docFilterMod !== ""
                              ? "No documents matched your filter criteria."
                              : "Upload PDF handbooks, slides, and study notes for your modules."}
                          </p>
                          <button
                            type="button"
                            className="btn btn-sm btn-info text-white rounded-pill px-4"
                            onClick={() => handleOpenCreateDoc()}
                          >
                            <i className="bi bi-file-earmark-plus-fill me-1" /> Upload First Document
                          </button>
                        </div>
                      ) : (
                        <div className="table-responsive border rounded-4 bg-white">
                          <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.85rem" }}>
                            <thead className="table-light">
                              <tr>
                                <th>Document Title</th>
                                <th>Related Module</th>
                                <th>Lock / Pay Access</th>
                                <th>Type</th>
                                <th>Size</th>
                                <th className="text-end">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredDocs.map((doc, dIdx) => (
                                <tr key={dIdx}>
                                  <td>
                                    <div className="d-flex align-items-center gap-2">
                                      <i className="bi bi-file-earmark-pdf fs-5 text-danger flex-shrink-0" />
                                      <div>
                                        <div className="fw-bold text-dark">{doc.title}</div>
                                        {doc.description && (
                                          <div className="text-muted small text-truncate" style={{ maxWidth: 280 }}>
                                            {doc.description}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="badge bg-primary-subtle text-primary border rounded-pill">
                                      Module {doc._modIdx + 1}: {doc._moduleName}
                                    </span>
                                  </td>
                                  <td>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleDocLock(doc)}
                                      className={`btn btn-xs rounded-pill px-2 py-1 fw-semibold d-inline-flex align-items-center gap-1 ${
                                        doc.is_locked !== false
                                          ? "btn-outline-warning text-dark border-warning"
                                          : "btn-outline-success border-success"
                                      }`}
                                      style={{ fontSize: "0.75rem" }}
                                      title={doc.is_locked !== false ? "Click to make Free" : "Click to Lock"}
                                    >
                                      <i className={`bi ${doc.is_locked !== false ? "bi-lock-fill text-warning" : "bi-unlock-fill text-success"}`} />
                                      <span>{doc.is_locked !== false ? "Locked (Paid)" : "Free"}</span>
                                    </button>
                                  </td>
                                  <td>
                                    <span className="badge bg-secondary-subtle text-dark text-uppercase">
                                      {doc.file_type || "PDF"}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="text-muted">{doc.formatted_size || "-"}</span>
                                  </td>
                                  <td className="text-end">
                                    <div className="btn-group btn-group-sm">
                                      {doc.file_url && (
                                        <a
                                          href={doc.file_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="btn btn-outline-secondary"
                                          title="View File"
                                        >
                                          <i className="bi bi-eye-fill" />
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        className="btn btn-outline-primary"
                                        onClick={() => handleOpenEditDoc(doc)}
                                        title="Edit Document"
                                      >
                                        <i className="bi bi-pencil-fill" />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-outline-danger"
                                        onClick={() => handleDeleteDoc(doc)}
                                        title="Remove Document"
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
                  )}

                  {/* ============================================================
                      TAB 4: VIDEOS (REPLACES ADVANCED JSON)
                      ============================================================ */}
                  {modalTab === "videos" && (
                    <div>
                      {/* Search and Action Bar */}
                      <div className="row g-2 mb-3 align-items-center">
                        <div className="col-12 col-md-5">
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-light"><i className="bi bi-search" /></span>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Search video title or description..."
                              value={vidSearch}
                              onChange={(e) => setVidSearch(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-12 col-md-4">
                          <select
                            className="form-select form-select-sm"
                            value={vidFilterMod}
                            onChange={(e) => setVidFilterMod(e.target.value)}
                          >
                            <option value="">All Curriculum Modules ({modulesList.length})</option>
                            {modulesList.map((m, idx) => (
                              <option key={idx} value={idx}>
                                Module {idx + 1}: {m.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-12 col-md-3 text-md-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-danger text-white w-100 rounded-pill fw-semibold shadow-sm"
                            onClick={() => handleOpenCreateVid()}
                          >
                            <i className="bi bi-camera-video-fill me-1" /> Add Video
                          </button>
                        </div>
                      </div>

                      {filteredVids.length === 0 ? (
                        <div className="text-center py-5 text-muted bg-light rounded-4 border border-dashed">
                          <i className="bi bi-camera-video fs-1 mb-2 text-danger opacity-50 d-block" />
                          <h6 className="fw-bold text-dark mb-1">No video lectures found</h6>
                          <p className="small text-muted mb-3">
                            {vidSearch || vidFilterMod !== ""
                              ? "No videos matched your filter criteria."
                              : "Add video stream recordings, YouTube/Vimeo links, and lecture materials for your modules."}
                          </p>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger text-white rounded-pill px-4"
                            onClick={() => handleOpenCreateVid()}
                          >
                            <i className="bi bi-camera-video-fill me-1" /> Add First Video
                          </button>
                        </div>
                      ) : (
                        <div className="table-responsive border rounded-4 bg-white">
                          <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.85rem" }}>
                            <thead className="table-light">
                              <tr>
                                <th>Video Lecture Title</th>
                                <th>Related Module</th>
                                <th>Duration</th>
                                <th>Video Source</th>
                                <th>Lock / Pay Access</th>
                                <th className="text-end">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredVids.map((vid, vIdx) => (
                                <tr key={vIdx}>
                                  <td>
                                    <div className="d-flex align-items-center gap-2">
                                      <i className="bi bi-play-circle-fill fs-5 text-danger flex-shrink-0" />
                                      <div>
                                        <div className="fw-bold text-dark">{vid.title}</div>
                                        {vid.description && (
                                          <div className="text-muted small text-truncate" style={{ maxWidth: 280 }}>
                                            {vid.description}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="badge bg-primary-subtle text-primary border rounded-pill">
                                      Module {vid._modIdx + 1}: {vid._moduleName}
                                    </span>
                                  </td>
                                  <td>
                                    {vid.duration ? (
                                      <span className="text-muted"><i className="bi bi-clock me-1" />{vid.duration}</span>
                                    ) : "-"}
                                  </td>
                                  <td>
                                    {vid.video_url ? (
                                      <span className="badge bg-primary-subtle text-primary border" style={{ fontSize: "0.72rem" }}>
                                        URL / Stream
                                      </span>
                                    ) : (
                                      <span className="badge bg-secondary-subtle text-dark" style={{ fontSize: "0.72rem" }}>
                                        Uploaded File
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleVidLock(vid)}
                                      className={`btn btn-xs rounded-pill px-2 py-1 fw-semibold d-inline-flex align-items-center gap-1 ${
                                        vid.is_locked !== false
                                          ? "btn-outline-warning text-dark border-warning"
                                          : "btn-outline-success border-success"
                                      }`}
                                      style={{ fontSize: "0.75rem" }}
                                      title={vid.is_locked !== false ? "Click to make Free" : "Click to Lock"}
                                    >
                                      <i className={`bi ${vid.is_locked !== false ? "bi-lock-fill text-warning" : "bi-unlock-fill text-success"}`} />
                                      <span>{vid.is_locked !== false ? "Locked (Paid)" : "Free"}</span>
                                    </button>
                                  </td>
                                  <td className="text-end">
                                    <div className="btn-group btn-group-sm">
                                      {vid.video_url && (
                                        <a
                                          href={vid.video_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="btn btn-outline-secondary"
                                          title="Test / Watch Stream"
                                        >
                                          <i className="bi bi-play-circle-fill text-danger" />
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        className="btn btn-outline-primary"
                                        onClick={() => handleOpenEditVid(vid)}
                                        title="Edit Video"
                                      >
                                        <i className="bi bi-pencil-fill" />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-outline-danger"
                                        onClick={() => handleDeleteVid(vid)}
                                        title="Remove Video"
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
                  )}
                </div>

                {/* Modal Footer */}
                <div className="modal-footer bg-light rounded-bottom-4 py-3 px-4 flex-shrink-0">
                  <div className="d-flex justify-content-between align-items-center w-100 flex-wrap gap-2">
                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        type="button"
                        className={`btn btn-sm ${modalTab === "details" ? "btn-secondary" : "btn-outline-secondary"} rounded-pill px-3`}
                        onClick={() => setModalTab("details")}
                      >
                        1. Details
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${modalTab === "modules" ? "btn-secondary" : "btn-outline-secondary"} rounded-pill px-3`}
                        onClick={() => setModalTab("modules")}
                      >
                        2. Modules ({modulesList.length})
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${modalTab === "documents" ? "btn-info text-white" : "btn-outline-info"} rounded-pill px-3`}
                        onClick={() => setModalTab("documents")}
                      >
                        3. Documents ({totalDocsCount})
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${modalTab === "videos" ? "btn-danger text-white" : "btn-outline-danger"} rounded-pill px-3`}
                        onClick={() => setModalTab("videos")}
                      >
                        4. Videos ({totalVidsCount})
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
                        className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm"
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

      {/* ============================================================
          MODAL: UPLOAD / EDIT DOCUMENT (Same as LectureMaterialManager)
          ============================================================ */}
      {docModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1065 }}
          onClick={() => setDocModalOpen(false)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            style={{ maxHeight: "92vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={handleSaveDoc}
              className="modal-content rounded-4 shadow-lg border-0 d-flex flex-column"
              style={{ maxHeight: "90vh", overflow: "hidden" }}
            >
              <div className="modal-header border-bottom px-4 py-3 bg-light rounded-top-4 flex-shrink-0">
                <div>
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
                    <span className="badge bg-info text-white rounded-circle p-2" />
                    <span>{editingDoc ? `Edit Document: ${editingDoc.title}` : "Upload Document for Module"}</span>
                  </h5>
                  <p className="text-muted small mb-0 mt-1">
                    Attach study handbooks, lecture slides, and notes for student access.
                  </p>
                </div>
                <button type="button" className="btn-close" onClick={() => setDocModalOpen(false)} />
              </div>

              <div className="modal-body p-4" style={{ overflowY: "auto", flex: "1 1 auto" }}>
                {/* Card 1: Related Module & Title */}
                <div className="card border shadow-none rounded-4 p-3 mb-3 bg-light-subtle">
                  <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                    <i className="bi bi-tag text-info" />
                    <span>Document Classification &amp; Title</span>
                  </h6>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Related Curriculum Module *</label>
                      <select
                        className="form-select"
                        required
                        value={docFormData.module_idx}
                        onChange={(e) => setDocFormData({ ...docFormData, module_idx: parseInt(e.target.value, 10) || 0 })}
                      >
                        {modulesList.map((m, idx) => (
                          <option key={idx} value={idx}>
                            Module #{idx + 1}: {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Document Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Python Core Architecture Handbook PDF"
                        required
                        value={docFormData.title}
                        onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: Attached File & Upload */}
                <div className="card border shadow-none rounded-4 p-3 mb-3 bg-light-subtle">
                  <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                    <i className="bi bi-file-earmark-arrow-up text-primary" />
                    <span>Attached File &amp; Upload</span>
                  </h6>

                  {editingDoc && editingDoc.file_url && (
                    <div className="alert alert-light border rounded-3 p-3 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-file-earmark-pdf fs-4 text-danger" />
                        <div>
                          <div className="fw-semibold text-dark small">{editingDoc.title}</div>
                          <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                            Type: <strong className="text-uppercase">{editingDoc.file_type || "PDF"}</strong> &bull; Size: <strong>{editingDoc.formatted_size || "N/A"}</strong>
                          </div>
                        </div>
                      </div>
                      <a
                        href={editingDoc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-xs btn-outline-primary rounded-pill px-3 py-1"
                        style={{ fontSize: "0.75rem" }}
                      >
                        <i className="bi bi-eye me-1" /> View Current File
                      </a>
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        {editingDoc ? "Replace Document File (Optional)" : "Select Document File"}
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                        onChange={(e) => setDocFile(e.target.files[0] || null)}
                      />
                      <small className="text-muted d-block mt-1" style={{ fontSize: "0.72rem" }}>
                        Supported formats: PDF, DOCX, PPTX, TXT, ZIP. Maximum size: 50MB.
                      </small>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Or Provide Direct File URL</label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://cdn.example.com/handbook.pdf"
                        value={docFormData.file_url}
                        onChange={(e) => setDocFormData({ ...docFormData, file_url: e.target.value })}
                      />
                      <small className="text-muted d-block mt-1" style={{ fontSize: "0.72rem" }}>
                        Direct web link to a hosted document file or cloud storage.
                      </small>
                    </div>
                  </div>
                </div>

                {/* Card 3: Description */}
                <div className="card border shadow-none rounded-4 p-3 mb-3 bg-light-subtle">
                  <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                    <i className="bi bi-card-text text-secondary" />
                    <span>Description &amp; Study Guidance (Optional)</span>
                  </h6>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Brief notes summarizing this study document, chapters included, prerequisites..."
                    value={docFormData.description}
                    onChange={(e) => setDocFormData({ ...docFormData, description: e.target.value })}
                  />
                </div>

                {/* Card 4: Access Lock & Publishing Settings */}
                <div className="card border shadow-none rounded-4 p-3 bg-light-subtle">
                  <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                    <i className="bi bi-shield-lock text-warning-emphasis" />
                    <span>Access Lock &amp; Format Details</span>
                  </h6>
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">File Type Format</label>
                      <select
                        className="form-select"
                        value={docFormData.file_type}
                        onChange={(e) => setDocFormData({ ...docFormData, file_type: e.target.value })}
                      >
                        {["PDF", "DOCX", "PPTX", "TXT", "ZIP", "OTHER"].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">Display File Size</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 2.4 MB"
                        value={docFormData.formatted_size}
                        onChange={(e) => setDocFormData({ ...docFormData, formatted_size: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">Document Access Lock</label>
                      <div className="form-check form-switch mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="docLockToggle"
                          checked={docFormData.is_locked}
                          onChange={(e) => setDocFormData({ ...docFormData, is_locked: e.target.checked })}
                        />
                        <label className="form-check-label fw-bold" htmlFor="docLockToggle">
                          {docFormData.is_locked ? "🔒 Locked (Paid Access)" : "🔓 Free (Free Preview)"}
                        </label>
                      </div>
                      <small className="text-muted d-block" style={{ fontSize: "0.72rem" }}>
                        When Free, students can read without purchasing the track.
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="modal-footer px-4 py-3 bg-light rounded-bottom-4 border-top flex-shrink-0 d-flex justify-content-end align-items-center gap-2"
                style={{ position: "sticky", bottom: 0, zIndex: 10, background: "#f8fafc" }}
              >
                <button type="button" className="btn btn-secondary rounded-pill px-4 fw-semibold" onClick={() => setDocModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-info text-white rounded-pill px-5 fw-bold shadow-sm" disabled={savingDoc}>
                  {savingDoc ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Saving...
                    </>
                  ) : editingDoc ? (
                    "Save Changes"
                  ) : (
                    "Upload Document"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: ADD / EDIT VIDEO (Same as LectureMaterialManager)
          ============================================================ */}
      {vidModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1065 }}
          onClick={() => setVidModalOpen(false)}
        >
          <div
            className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
            style={{ maxHeight: "92vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={handleSaveVid}
              className="modal-content rounded-4 shadow-lg border-0 d-flex flex-column"
              style={{ maxHeight: "90vh", overflow: "hidden" }}
            >
              <div className="modal-header border-bottom px-4 py-3 bg-light rounded-top-4 flex-shrink-0">
                <div>
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
                    <span className="badge bg-danger text-white rounded-circle p-2" />
                    <span>{editingVid ? `Edit Video Lecture: ${editingVid.title}` : "Add New Video Lecture"}</span>
                  </h5>
                  <p className="text-muted small mb-0 mt-1">
                    Manage high-definition lecture recordings, video streaming links, and individual lock controls.
                  </p>
                </div>
                <button type="button" className="btn-close" onClick={() => setVidModalOpen(false)} />
              </div>

              <div className="modal-body p-4" style={{ overflowY: "auto", flex: "1 1 auto" }}>
                {/* Card 1: Related Module & Title */}
                <div className="card border shadow-none rounded-4 p-3 mb-3 bg-light-subtle">
                  <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                    <i className="bi bi-play-circle text-danger" />
                    <span>Video Module &amp; Lecture Title</span>
                  </h6>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Related Curriculum Module *</label>
                      <select
                        className="form-select"
                        required
                        value={vidFormData.module_idx}
                        onChange={(e) => setVidFormData({ ...vidFormData, module_idx: parseInt(e.target.value, 10) || 0 })}
                      >
                        {modulesList.map((m, idx) => (
                          <option key={idx} value={idx}>
                            Module #{idx + 1}: {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Video Lecture Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Master Class 01: Functions &amp; Variable Scopes"
                        required
                        value={vidFormData.title}
                        onChange={(e) => setVidFormData({ ...vidFormData, title: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: Video Source & Live Preview */}
                <div className="card border shadow-none rounded-4 p-3 mb-3 bg-light-subtle">
                  <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                    <i className="bi bi-camera-reels text-primary" />
                    <span>Video Stream Source &amp; Media Files</span>
                  </h6>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Video URL (YouTube, Vimeo, Cloud MP4 stream link)</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light"><i className="bi bi-link-45deg" /></span>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://www.youtube.com/watch?v=... or https://cdn.example.com/video.mp4"
                          value={vidFormData.video_url}
                          onChange={(e) => setVidFormData({ ...vidFormData, video_url: e.target.value })}
                        />
                      </div>
                      <small className="text-muted d-block mt-1" style={{ fontSize: "0.72rem" }}>
                        Paste a YouTube or Vimeo or direct MP4 URL, or upload a video file below.
                      </small>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Or Upload Video File (MP4, WebM)</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="video/*"
                        onChange={(e) => setVidFile(e.target.files[0] || null)}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Custom Thumbnail Image (Optional)</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) => setVidThumbnail(e.target.files[0] || null)}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Or Thumbnail URL (Optional)</label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={vidFormData.thumbnail_url}
                        onChange={(e) => setVidFormData({ ...vidFormData, thumbnail_url: e.target.value })}
                      />
                    </div>

                    {/* Video Live Preview Banner */}
                    {(vidFormData.video_url || vidFormData.thumbnail_url) && (
                      <div className="col-12">
                        <div className="p-3 bg-dark rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-2 text-white">
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-film fs-4 text-danger" />
                            <div>
                              <strong className="small">Video Stream Configured</strong>
                              <div className="text-white-50 text-truncate" style={{ fontSize: "0.75rem", maxWidth: 450 }}>
                                {vidFormData.video_url || "Uploaded Video File"}
                              </div>
                            </div>
                          </div>
                          {vidFormData.video_url && (
                            <a
                              href={vidFormData.video_url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-xs btn-outline-light rounded-pill px-3 py-1"
                              style={{ fontSize: "0.75rem" }}
                            >
                              <i className="bi bi-play-circle me-1" /> Test Stream URL
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 3: Lecture Description */}
                <div className="card border shadow-none rounded-4 p-3 mb-3 bg-light-subtle">
                  <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                    <i className="bi bi-card-text text-secondary" />
                    <span>Lecture Description &amp; Topic Summary</span>
                  </h6>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Detailed topics covered in this video lecture, hands-on demonstrations, timestamps..."
                    value={vidFormData.description}
                    onChange={(e) => setVidFormData({ ...vidFormData, description: e.target.value })}
                  />
                </div>

                {/* Card 4: Playback Details & Access Lock */}
                <div className="card border shadow-none rounded-4 p-3 bg-light-subtle">
                  <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                    <i className="bi bi-sliders text-warning-emphasis" />
                    <span>Playback Details &amp; Access Lock</span>
                  </h6>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Duration (e.g. 24:15)</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light"><i className="bi bi-clock" /></span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="24:15"
                          value={vidFormData.duration}
                          onChange={(e) => setVidFormData({ ...vidFormData, duration: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Video Access Lock</label>
                      <div className="form-check form-switch mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="vidLockToggle"
                          checked={vidFormData.is_locked}
                          onChange={(e) => setVidFormData({ ...vidFormData, is_locked: e.target.checked })}
                        />
                        <label className="form-check-label fw-bold" htmlFor="vidLockToggle">
                          {vidFormData.is_locked ? "🔒 Locked (Paid Access)" : "🔓 Free (Free Preview)"}
                        </label>
                      </div>
                      <small className="text-muted d-block" style={{ fontSize: "0.72rem" }}>
                        When Free, students can play this lecture without purchasing the track.
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="modal-footer px-4 py-3 bg-light rounded-bottom-4 border-top flex-shrink-0 d-flex justify-content-end align-items-center gap-2"
                style={{ position: "sticky", bottom: 0, zIndex: 10, background: "#f8fafc" }}
              >
                <button type="button" className="btn btn-secondary rounded-pill px-4 fw-semibold" onClick={() => setVidModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger rounded-pill px-5 fw-bold shadow-sm" disabled={savingVid}>
                  {savingVid ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Saving...
                    </>
                  ) : editingVid ? (
                    "Save Changes"
                  ) : (
                    "Save Video"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: QUICK PRICE UPDATE
          ============================================================ */}
      {showPriceModal && pricingPathway && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1060 }}
          onClick={() => setShowPriceModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveQuickPrice} className="modal-content rounded-4 border-0 shadow-lg d-flex flex-column">
              <div className="modal-header bg-success text-white rounded-top-4 flex-shrink-0">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-currency-rupee" />
                  <span>Update Pathway Price: {pricingPathway.title}</span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowPriceModal(false)}
                />
              </div>
              <div className="modal-body p-4">
                <div className="text-center mb-4">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-circle text-white shadow-sm mb-2"
                    style={{ width: 44, height: 44, background: pricingPathway.color || "#3b82f6", fontSize: "1.2rem" }}
                  >
                    <i className={`bi ${pricingPathway.icon || "bi-diagram-3-fill"}`} />
                  </span>
                  <h5 className="fw-bold text-dark mb-1">{pricingPathway.title}</h5>
                  <p className="text-muted small mb-0">Set the payment fee students must pay to enroll in this specialization track.</p>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold text-dark small">Track Enrollment Price (INR ₹) *</label>
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
                      Show promotional offer to students
                    </label>
                  </div>
                  <small className="text-muted d-block mb-2">
                    When off, students see only the normal enrollment amount without discount badges.
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

              <div className="modal-footer bg-light rounded-bottom-4 flex-shrink-0 d-flex justify-content-end align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill px-4 fw-semibold"
                  onClick={() => setShowPriceModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success rounded-pill px-4 fw-semibold shadow-sm"
                  disabled={savingPrice}
                >
                  {savingPrice ? "Saving..." : "Update Pathway Price"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
