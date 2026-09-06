import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import WelcomePage from "./pages/WelcomePage.jsx";
import HomePage from "./pages/HomePage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CareerPathwaysPage from "./pages/CareerPathwaysPage.jsx";
import CurriculumPage from "./pages/CurriculumPage.jsx";
import ConceptDetailsPage from "./pages/ConceptDetailsPage.jsx";
import SectionPage from "./pages/SectionPage.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import GoogleOAuthCallback from "./pages/GoogleOAuthCallback.jsx";
import AdminGate from "./admin/AdminGate.jsx";
import { SECTIONS } from "./api/client";

export default function App() {
  return (
    <Routes>
      {/* 1. Welcome Page */}
      <Route path="/" element={<WelcomePage />} />
      <Route path="/welcome" element={<WelcomePage />} />

      {/* Main App Layout with Navbar & Footer */}
      <Route element={<AppShell />}>
        {/* 2. Premium Home Page */}
        <Route path="/home" element={<HomePage />} />

        {/* 3. Main Dashboard page */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* 4. Career Pathways & Curated Specializations */}
        <Route path="/career-pathways" element={<CareerPathwaysPage />} />
        <Route path="/career-pathways/:slug" element={<CareerPathwaysPage />} />

        {/* 5. Student Curriculum / Lectures & Materials (Reference Image Design) */}
        <Route path="/lectures-and-materials" element={<CurriculumPage />} />
        <Route path="/lecture-material" element={<CurriculumPage />} />

        {/* 6. Concept Details View (Opens on 'Know more') */}
        <Route path="/lectures-and-materials/concept/:identifier" element={<ConceptDetailsPage />} />
        <Route path="/concept/:identifier" element={<ConceptDetailsPage />} />

        {/* Individual Section Pages for online classes, suggestions, proxy support, registrations */}
        {Object.values(SECTIONS)
          .filter((s) => s.key !== "lecture_material" && s.key !== "career_pathways")
          .map((s) => (
            <Route
              key={s.key}
              path={`/${s.key.replace(/_/g, "-")}`}
              element={<SectionPage section={s} />}
            />
          ))}

        {/* Auth Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
      </Route>

      {/* Admin entry point */}
      <Route path="/class/developer" element={<AdminGate />} />

      {/* Fallback to Home */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
