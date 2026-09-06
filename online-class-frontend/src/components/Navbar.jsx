import { useState } from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import { SECTION_LIST } from "../api/client";
import EducationLogo from "./EducationLogo.jsx";

export default function Navbar() {
  const { isAuthed, user, paid, logout } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [hoveredNav, setHoveredNav] = useState(null); // 'home' | 'dashboard' | null

  const isAuthRoute = location.pathname === "/login" || location.pathname === "/signup";

  async function handleLogout() {
    await logout();
    navigate("/home");
  }

  return (
    <nav className="navbar navbar-expand-lg oc-navbar sticky-top">
      <div className="container position-relative">
        {/* Brand Logo & Name */}
        <NavLink to="/home" className="oc-navbar-brand">
          <EducationLogo size={34} showText={true} />
        </NavLink>

        {/* Mobile Toggler */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#ocNav"
          aria-controls="ocNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" style={{ filter: "invert(1)" }} />
        </button>

        {/* Navigation Items */}
        <div className="collapse navbar-collapse" id="ocNav">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-1 gap-lg-2">
            {/* HOME NAV ITEM */}
            <li
              className="nav-item position-relative oc-nav-hover-wrapper"
              onMouseEnter={() => setHoveredNav("home")}
              onMouseLeave={() => setHoveredNav(null)}
            >
              <NavLink to="/home" className="nav-link">
                <i className="bi bi-house-door me-1" />
                <span>Home</span>
              </NavLink>
            </li>

            {/* CURRICULUM NAV ITEM (Displayed only when logged in) */}
            {isAuthed && (
              <li
                className="nav-item position-relative oc-nav-hover-wrapper"
                onMouseEnter={() => setHoveredNav("curriculum")}
                onMouseLeave={() => setHoveredNav(null)}
              >
                <NavLink to="/lectures-and-materials" className="nav-link">
                  <i className="bi bi-book me-1" />
                  <span>Curriculum</span>
                  <i className="bi bi-chevron-down ms-1" style={{ fontSize: "0.7rem", opacity: 0.7 }} />
                </NavLink>

                {/* Curriculum Pop-up Preview on Hover */}
                {hoveredNav === "curriculum" && (
                  <div className="oc-nav-popover oc-popover-curriculum" role="tooltip">
                    <div className="oc-nav-popover-header">
                      <div className="d-flex align-items-center gap-2">
                        <span className="oc-popover-icon bg-primary text-white">
                          <i className="bi bi-journal-code" />
                        </span>
                        <div>
                          <h4 className="mb-0" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                            Student Curriculum Hub
                          </h4>
                          <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                            Lecture Notes, Handbooks &amp; Videos
                          </small>
                        </div>
                      </div>
                    </div>
                    <div className="oc-nav-popover-body">
                      <p className="mb-2 text-muted" style={{ fontSize: "0.82rem", lineHeight: 1.45 }}>
                        Concept cards modeled for Python, Flask, Frontend, Machine Learning, Database &amp; SQL.
                      </p>
                      <div className="oc-nav-popover-grid">
                        <div className="oc-popover-item">
                          <i className="bi bi-filetype-py text-primary" />
                          <span>Python Core</span>
                        </div>
                        <div className="oc-popover-item">
                          <i className="bi bi-code-slash text-warning" />
                          <span>Flask Backend</span>
                        </div>
                        <div className="oc-popover-item">
                          <i className="bi bi-browser-chrome text-info" />
                          <span>Frontend JS</span>
                        </div>
                        <div className="oc-popover-item">
                          <i className="bi bi-cpu text-purple" />
                          <span>Machine Learning</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-top text-end">
                        <Link to="/lectures-and-materials" className="oc-popover-link">
                          Explore All Concepts &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            )}

            {/* DASHBOARD NAV ITEM (Displayed only when logged in) */}
            {isAuthed && !isAuthRoute && (
              <li
                className="nav-item position-relative oc-nav-hover-wrapper"
                onMouseEnter={() => setHoveredNav("dashboard")}
                onMouseLeave={() => setHoveredNav(null)}
              >
                <NavLink to="/dashboard" className="nav-link" end>
                  <i className="bi bi-grid me-1" />
                  <span>Dashboard</span>
                  <i className="bi bi-chevron-down ms-1" style={{ fontSize: "0.7rem", opacity: 0.7 }} />
                </NavLink>

                {/* Dashboard Pop-up Preview on Hover */}
                {hoveredNav === "dashboard" && (
                  <div className="oc-nav-popover oc-popover-dashboard" role="tooltip">
                    <div className="oc-nav-popover-header">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <span className="oc-popover-icon bg-success text-white">
                            <i className="bi bi-folder-check" />
                          </span>
                          <div>
                            <h4 className="mb-0" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                              Workspace Navigator
                            </h4>
                            <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                              5 Active Course Sections
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="oc-nav-popover-body">
                      <div className="oc-popover-section-list">
                        {SECTION_LIST.map((s) => (
                          <Link
                            key={s.key}
                            to={s.route || `/${s.key.replace(/_/g, "-")}`}
                            className="oc-popover-section-row text-decoration-none text-reset"
                          >
                            <span className="oc-badge-dot" style={{ background: s.color }} />
                            <span className="flex-grow-1 text-truncate" style={{ fontSize: "0.82rem", fontWeight: 500 }}>
                              {s.title}
                            </span>
                            <i className="bi bi-arrow-right-short text-muted" />
                          </Link>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-top d-flex justify-content-between align-items-center">
                        <Link to="/dashboard" className="oc-popover-link ms-auto">
                          Open Dashboard &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            )}

            {/* Auth Buttons & User Status */}
            <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
              <div className="oc-navbar-auth">
                {isAuthed ? (
                  <>
                    <span className="oc-navbar-user">
                      <span className="oc-navbar-user-avatar">
                        {user?.name ? user.name.charAt(0).toUpperCase() : <i className="bi bi-person" />}
                      </span>
                      <span className="oc-navbar-user-name">{user?.name}</span>
                      {paid && (
                        <span className="oc-pay-badge paid" style={{ fontSize: "0.68rem" }}>
                          <i className="bi bi-check-circle-fill" /> Unlocked
                        </span>
                      )}
                    </span>
                    <button type="button" className="oc-btn-nav-ghost" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right" />
                      <span>Log out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink to="/login" className="oc-btn-nav-ghost">
                      <i className="bi bi-box-arrow-in-right" />
                      <span>Log in</span>
                    </NavLink>
                    <NavLink to="/signup" className="oc-btn-nav-solid">
                      <i className="bi bi-person-plus-fill" />
                      <span>Sign up</span>
                    </NavLink>
                  </>
                )}
              </div>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
