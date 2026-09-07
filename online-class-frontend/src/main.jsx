import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./theme.css";
import App from "./App.jsx";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";
import { UserAuthProvider } from "./context/UserAuthContext.jsx";
import { SiteSettingsProvider } from "./context/SiteSettingsContext.jsx";
import GlobalSecurityGuard from "./components/GlobalSecurityGuard.jsx";
import PageLifecycleGuard from "./components/PageLifecycleGuard.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdminAuthProvider>
        <UserAuthProvider>
          <SiteSettingsProvider>
            <PageLifecycleGuard>
              <GlobalSecurityGuard>
                <App />
              </GlobalSecurityGuard>
            </PageLifecycleGuard>
          </SiteSettingsProvider>
        </UserAuthProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
