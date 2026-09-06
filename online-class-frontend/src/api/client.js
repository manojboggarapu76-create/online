import axios from "axios";

// Set VITE_API_URL in .env to point at the Laravel backend, e.g.
// VITE_API_URL=http://localhost:8000/api
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const url = config.url || "";

  if (url.startsWith("/admin")) {
    const adminToken = localStorage.getItem("oc_admin_token");
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    return config;
  }

  // Everything else (including /sections/*) can carry a student token when
  // one exists — the backend only actually uses it for /auth/*, /payment/*
  // and to decide whether an Online Classes video is unlocked for you.
  const userToken = localStorage.getItem("oc_user_token");
  if (userToken) {
    config.headers.Authorization = `Bearer ${userToken}`;
  }
  return config;
});

export default api;

export const SECTIONS = {
  lecture_material: {
    key: "lecture_material",
    title: "Lectures & Materials",
    tagline: "Slides, notes and recordings from every session.",
    icon: "bi-journal-text",
    color: "var(--tab-1)",
    route: "/lectures-and-materials",
  },
  career_pathways: {
    key: "career_pathways",
    title: "Career Pathways",
    tagline: "Curated engineering tracks with course enrollment.",
    icon: "bi-diagram-3-fill",
    color: "#8b5cf6",
    route: "/career-pathways",
  },
  online_class: {
    key: "online_class",
    title: "Online Classes",
    tagline: "Live sessions, join links and instructors.",
    icon: "bi-camera-video",
    color: "var(--tab-2)",
  },
  suggestion: {
    key: "suggestion",
    title: "Suggestions",
    tagline: "Tips and guidance for learning online well.",
    icon: "bi-lightbulb",
    color: "var(--tab-3)",
  },
  proxy_support: {
    key: "proxy_support",
    title: "Proxy Support",
    tagline: "Help for missed sessions and stand-in coverage.",
    icon: "bi-people",
    color: "var(--tab-4)",
  },
  registration: {
    key: "registration",
    title: "Registrations",
    tagline: "Open enrollments and how to sign up.",
    icon: "bi-pencil-square",
    color: "var(--tab-5)",
  },
  interview_prep: {
    key: "interview_prep",
    title: "Interview Preparation",
    tagline: "Technical round walkthroughs, interview tips, mock videos, and Q&A guides.",
    icon: "bi-briefcase-fill",
    color: "#059669",
    route: "/interview-prep",
  },
};

export const SECTION_LIST = Object.values(SECTIONS);

// Concept API helpers
export const fetchConcepts = (params = {}) => api.get("/concepts", { params });
export const fetchConceptDetails = (idOrSlug) => api.get(`/concepts/${idOrSlug}`);
export const fetchMyConceptAccess = () => api.get("/concepts-access/status");
export const createConceptOrder = (idOrSlug) => api.post(`/concepts/${idOrSlug}/create-order`);
export const verifyConceptPayment = (idOrSlug, data) => api.post(`/concepts/${idOrSlug}/verify-payment`, data);
export const fetchAdminConceptStats = () => api.get("/admin/concepts/stats");
export const fetchAdminConcepts = (params = {}) => api.get("/admin/concepts", { params });
export const createAdminConcept = (formData) => api.post("/admin/concepts", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const updateAdminConcept = (id, formData) => api.post(`/admin/concepts/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
export const updateAdminConceptPrice = (id, pricing) =>
  api.patch(`/admin/concepts/${id}/price`, typeof pricing === "object" ? pricing : { price: pricing });
export const toggleAdminConceptLock = (id, is_locked) =>
  api.patch(`/admin/concepts/${id}/lock`, { is_locked });
export const deleteAdminConcept = (id) => api.delete(`/admin/concepts/${id}`);
export const fetchAdminDocuments = (params = {}) => api.get("/admin/concept-documents", { params });
export const toggleAdminDocumentLock = (id, is_locked) =>
  api.patch(`/admin/concept-documents/${id}/lock`, { is_locked });
export const fetchAdminVideos = (params = {}) => api.get("/admin/concept-videos", { params });
export const toggleAdminVideoLock = (id, is_locked) =>
  api.patch(`/admin/concept-videos/${id}/lock`, { is_locked });

// Career Pathways API helpers
export const fetchCareerPathways = (params = {}) => api.get("/career-pathways", { params });
export const fetchCareerPathwayDetails = (idOrSlug) => api.get(`/career-pathways/${idOrSlug}`);
export const fetchMyPathwayAccess = () => api.get("/career-pathways-access/status");
export const createPathwayOrder = (idOrSlug) => api.post(`/career-pathways/${idOrSlug}/create-order`);
export const verifyPathwayPayment = (idOrSlug, data) => api.post(`/career-pathways/${idOrSlug}/verify-payment`, data);
export const fetchAdminPathways = (params = {}) => api.get("/admin/career-pathways", { params });
export const createAdminPathway = (data) => api.post("/admin/career-pathways", data);
export const updateAdminPathway = (id, data) => api.put(`/admin/career-pathways/${id}`, data);
export const updateAdminPathwayPrice = (id, pricing) =>
  api.patch(`/admin/career-pathways/${id}/price`, typeof pricing === "object" ? pricing : { price: pricing });
export const toggleAdminPathwayLock = (id, is_locked) =>
  api.patch(`/admin/career-pathways/${id}/lock`, { is_locked });
export const deleteAdminPathway = (id) => api.delete(`/admin/career-pathways/${id}`);

// Proxy Support API helpers
export const submitProxyMessage = (data) => api.post("/proxy-support/messages", data);
export const fetchAdminProxyMessages = (params = {}) => api.get("/admin/proxy-messages", { params });
export const updateAdminProxyMessage = (id, data) => api.put(`/admin/proxy-messages/${id}`, data);
export const deleteAdminProxyMessage = (id) => api.delete(`/admin/proxy-messages/${id}`);

// Student Registrations API helpers
export const submitStudentRegistration = (data) => api.post("/registrations/submit", data);
export const fetchAdminRegistrations = (params = {}) => api.get("/admin/registrations", { params });
export const updateAdminRegistration = (id, data) => api.put(`/admin/registrations/${id}`, data);
export const deleteAdminRegistration = (id) => api.delete(`/admin/registrations/${id}`);

// Site Settings, Logo & Footer API helpers
export const fetchSiteSettings = () => api.get("/site-settings");
export const fetchAdminSiteSettings = () => api.get("/admin/site-settings");
export const updateAdminSiteSettings = (data) => api.post("/admin/site-settings", data);
export const uploadAdminEducationLogo = (formData) =>
  api.post("/admin/site-settings/logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const removeAdminEducationLogo = () =>
  api.delete("/admin/site-settings/logo");

// Custom Classroom Sections API helpers
export const fetchCustomSections = () => api.get("/custom-sections");
export const createAdminCustomSection = (data) => api.post("/admin/custom-sections", data);
export const updateAdminCustomSection = (key, data) => api.put(`/admin/custom-sections/${key}`, data);
export const deleteAdminCustomSection = (key) => api.delete(`/admin/custom-sections/${key}`);

// Reviews & Ratings API helpers
export const fetchMyReview = () => api.get("/user/my-review");
export const submitUserReview = (data) => api.post("/user/reviews", data);
export const fetchPublicReviews = () => api.get("/reviews");

// Admin Reviews & User Logins Analytics API helpers
export const fetchAdminReviews = () => api.get("/admin/reviews");
export const toggleAdminReviewFeature = (id) => api.patch(`/admin/reviews/${id}/feature`);
export const deleteAdminReview = (id) => api.delete(`/admin/reviews/${id}`);
export const fetchAdminUserLoginStats = () => api.get("/admin/user-logins-stats");
