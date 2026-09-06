import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import {
  fetchCareerPathways,
  fetchMyPathwayAccess,
  fetchSiteSettings,
  createPathwayOrder,
  verifyPathwayPayment,
} from "../api/client";
import DynamicWatermark from "./DynamicWatermark.jsx";

export const FALLBACK_CAREER_TRACKS = [
  {
    slug: "backend",
    title: "Backend & Systems Architecture",
    badge: "High Demand",
    color: "#3b82f6",
    price: 499,
    original_price: 1499,
    description: "Master Python 3.12, Flask, REST APIs, microservices, authentication security, and scalable server architecture.",
    skills: ["Python 3.12", "Flask", "SQLAlchemy", "JWT Auth", "Docker", "PostgreSQL"],
    duration: "12 Weeks",
    level: "Beginner to Advanced",
    curriculum_modules: [
      {
        id: 101,
        name: "Python Core Programming & Memory Architecture",
        short_description: "Fundamentals, OOP, functional paradigms, memory management and decorators.",
        description: "Comprehensive deep dive into Python 3.12 internals, data models, object-oriented design patterns, and asynchronous execution.",
        topics: ["Data Structures & Collections", "OOP & Magic Methods", "Context Managers & Generators", "Decorators & Metaclasses"],
        important_points: [
          "Understand Python memory management and garbage collection mechanisms",
          "Master closures, decorators, and high-order functional concepts",
          "Build resilient exception handling pipelines",
        ],
        examples_notes: "def logged(func):\n    def wrapper(*args, **kwargs):\n        print(f\"Executing {func.__name__}\")\n        return func(*args, **kwargs)\n    return wrapper",
        documents: [
          {
            id: 1001,
            title: "Python 3.12 Architecture & Data Structures Handbook",
            description: "In-depth reference manual for core Python programming and memory optimization.",
            file_type: "PDF",
            file_url: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
            formatted_size: "2.4 MB",
          },
          {
            id: 1002,
            title: "OOP Design Patterns in Modern Python",
            description: "Creational, Structural, and Behavioral patterns implemented in Python.",
            file_type: "PDF",
            file_url: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
            formatted_size: "1.8 MB",
          },
        ],
        videos: [
          {
            id: 2001,
            title: "Python Memory Management & GIL Explained",
            description: "Walkthrough on how CPython handles allocations, reference counting, and thread execution.",
            duration: "28:40",
            video_url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
            thumbnail_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=60",
          },
        ],
        documents_count: 2,
        videos_count: 1,
        color: "primary",
      },
      {
        id: 102,
        name: "Flask & REST API Microservices",
        short_description: "Blueprints, SQLAlchemy ORM, migrations, middleware, and JWT authentication.",
        description: "Construct enterprise RESTful APIs using Flask application factories, declarative SQLAlchemy ORM models, and token-based RBAC.",
        topics: ["Application Factory Pattern", "SQLAlchemy Relationships", "Marshmallow Schemas", "JWT Tokens & RBAC"],
        important_points: [
          "Structured separation of concerns using Flask Blueprints",
          "Automated migrations with Alembic and database transactions",
          "Role-based access control and token revocation security",
        ],
        examples_notes: "from flask import Blueprint, jsonify\napi_bp = Blueprint('api', __name__)\n\n@api_bp.route('/health')\ndef health():\n    return jsonify(status='healthy', v='1.0')",
        documents: [
          {
            id: 1003,
            title: "Flask RESTful Microservices Architecture Guide",
            description: "Complete blueprint for scalable API service design.",
            file_type: "PDF",
            file_url: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
            formatted_size: "3.1 MB",
          },
        ],
        videos: [
          {
            id: 2002,
            title: "Building Production REST APIs with Flask & SQLAlchemy",
            description: "Complete step-by-step video lecture on blueprint structuring and ORM relations.",
            duration: "34:15",
            video_url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
            thumbnail_url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=60",
          },
        ],
        documents_count: 1,
        videos_count: 1,
        color: "warning",
      },
      {
        id: 103,
        name: "Server Security & Deployment",
        short_description: "DRM protection, rate limiting, Docker containerization, and production deployment.",
        description: "Production readiness with container orchestration, SSL/TLS, reverse proxies, and DRM content protection.",
        topics: ["Docker Containers", "Rate Limiting & CORS", "OAuth2 Integration", "High Availability Arch"],
        important_points: [
          "Docker multi-stage container optimization",
          "Hardened security headers, rate limiting and CORS policies",
        ],
        examples_notes: "FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nCMD [\"gunicorn\", \"-w\", \"4\", \"-b\", \"0.0.0.0:8000\", \"app:create_app()\"]",
        documents: [
          {
            id: 1004,
            title: "Server Security & Containerization Manual",
            description: "Production checklist for high-availability cloud deployments.",
            file_type: "PDF",
            file_url: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
            formatted_size: "2.1 MB",
          },
        ],
        videos: [
          {
            id: 2003,
            title: "Dockerization & Production Nginx Setup",
            description: "Deploying microservices behind Nginx reverse proxies with SSL.",
            duration: "30:10",
            video_url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
            thumbnail_url: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=600&auto=format&fit=crop&q=60",
          },
        ],
        documents_count: 1,
        videos_count: 1,
        color: "info",
      },
    ],
  },
  {
    slug: "frontend",
    title: "Modern Frontend & UI/UX Engineering",
    badge: "Industry Standard",
    color: "#06b6d4",
    price: 499,
    original_price: 1499,
    description: "Build lightning-fast, reactive web applications with JavaScript (ES6+), React 19, Vite, and modern CSS/Bootstrap.",
    skills: ["React 19", "JavaScript ES6+", "React Router", "Axios", "Glassmorphism UI", "Vite"],
    duration: "10 Weeks",
    level: "All Levels",
    curriculum_modules: [
      {
        id: 201,
        name: "Modern JavaScript ES6+ Deep Dive",
        short_description: "Asynchronous JavaScript, Event Loop, Closures, DOM, and Fetch API.",
        description: "Master async/await paradigms, microtask queues, prototypal inheritance, and ES Modules.",
        topics: ["Async/Await & Promises", "Closures & Scope Chain", "ES Modules", "Event Bubbling & Capture"],
        important_points: [
          "Event Loop mechanics and call stack vs macro/micro queues",
          "Functional programming primitives: map, filter, reduce, currying",
          "Modern DOM manipulation and custom event handling",
        ],
        examples_notes: "const fetchData = async (url) => {\n  const res = await fetch(url);\n  if (!res.ok) throw new Error(`HTTP ${res.status}`);\n  return res.json();\n};",
        documents: [
          {
            id: 2001,
            title: "JavaScript ES6+ Language Specification Handbook",
            description: "Complete language guide with visual memory diagrams.",
            file_type: "PDF",
            file_url: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
            formatted_size: "2.9 MB",
          },
        ],
        videos: [
          {
            id: 2004,
            title: "JavaScript Event Loop & Async Architecture",
            description: "Visualizing how V8 executes asynchronous code and handles promises.",
            duration: "26:10",
            video_url: "https://www.youtube.com/watch?v=8aGhZQkoFbQ",
            thumbnail_url: "https://images.unsplash.com/photo-1581291518655-9523c932edcf?w=600&auto=format&fit=crop&q=60",
          },
        ],
        documents_count: 1,
        videos_count: 1,
        color: "info",
      },
      {
        id: 202,
        name: "React 19 & State Architecture",
        short_description: "Component lifecycle, Custom Hooks, Context API, and Performance Optimization.",
        description: "Modern component design, state machines, memoization, suspense boundaries, and server actions.",
        topics: ["React Hooks Ecosystem", "Context API & Reducers", "React Router v7", "Vite Bundler & SSR"],
        important_points: [
          "Effective state modeling avoiding unnecessary re-renders",
          "Custom hooks for composable asynchronous data fetching",
        ],
        examples_notes: "import { useState, useEffect } from 'react';\n\nexport function useOnlineStatus() {\n  const [isOnline, setIsOnline] = useState(navigator.onLine);\n  useEffect(() => {\n    const handleStatus = () => setIsOnline(navigator.onLine);\n    window.addEventListener('online', handleStatus);\n    window.addEventListener('offline', handleStatus);\n    return () => {\n      window.removeEventListener('online', handleStatus);\n      window.removeEventListener('offline', handleStatus);\n    };\n  }, []);\n  return isOnline;\n}",
        documents: [
          {
            id: 2002,
            title: "React 19 Design Patterns & State Architecture",
            description: "Complete reference for scalable React application patterns.",
            file_type: "PDF",
            file_url: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
            formatted_size: "3.4 MB",
          },
        ],
        videos: [
          {
            id: 2005,
            title: "Mastering React 19 State, Hooks & Custom Architecture",
            description: "Architecting clean state stores and performance optimizations.",
            duration: "32:00",
            video_url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
            thumbnail_url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=60",
          },
        ],
        documents_count: 1,
        videos_count: 1,
        color: "cyan",
      },
    ],
  },
  {
    slug: "ai",
    title: "Machine Learning & Applied AI",
    badge: "Cutting Edge",
    color: "#8b5cf6",
    price: 599,
    original_price: 1999,
    description: "From mathematics & NumPy to PyTorch neural networks, computer vision, NLP, and model production deployment.",
    skills: ["PyTorch", "Scikit-Learn", "Pandas", "Computer Vision", "Transformers", "EDA"],
    duration: "14 Weeks",
    level: "Intermediate",
    curriculum_modules: [
      {
        id: 301,
        name: "Data Science Foundations (NumPy & Pandas)",
        short_description: "Exploratory data analysis, statistical modeling, data cleaning, and feature engineering.",
        description: "Vectorized mathematics with NumPy, high-performance DataFrame operations with Pandas, and data visualization.",
        topics: ["NumPy Vectorization", "Pandas DataFrame Manipulation", "Matplotlib & Seaborn", "Data Preprocessing"],
        important_points: [
          "Avoid slow Python loops with broadcasting and vectorized array math",
          "Handle missing data, outliers, and normalization cleanly",
          "Generate publication-quality statistical visualizations",
        ],
        examples_notes: "import numpy as np\nimport pandas as pd\n\ndf = pd.DataFrame({'val': np.random.randn(100)})\ndf['rolling_avg'] = df['val'].rolling(window=5).mean()",
        documents: [
          {
            id: 3001,
            title: "Applied Data Science & Statistical Analysis Manual",
            description: "Comprehensive manual for Pandas, NumPy, and statistical transforms.",
            file_type: "PDF",
            file_url: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
            formatted_size: "3.5 MB",
          },
        ],
        videos: [
          {
            id: 3002,
            title: "Exploratory Data Analysis with Pandas & Seaborn",
            description: "Hands-on session on feature engineering and correlation heatmaps.",
            duration: "31:50",
            video_url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
            thumbnail_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=60",
          },
        ],
        documents_count: 1,
        videos_count: 1,
        color: "purple",
      },
      {
        id: 302,
        name: "Supervised & Unsupervised Machine Learning",
        short_description: "Classification, Regression, Decision Trees, SVM, and Clustering algorithms.",
        description: "Theory and application of supervised learning pipelines, gradient boosted trees, clustering, and hyperparameter tuning.",
        topics: ["Linear & Logistic Regression", "Random Forests & XGBoost", "K-Means Clustering", "Model Validation & Tuning"],
        important_points: [
          "Cross-validation techniques and metrics (Precision, Recall, F1, ROC-AUC)",
          "Ensemble methods: Bagging vs Boosting",
        ],
        examples_notes: "from sklearn.ensemble import RandomForestClassifier\nfrom sklearn.model_selection import train_test_split\n\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)\nclf = RandomForestClassifier(n_estimators=100)\nclf.fit(X_train, y_train)\nscore = clf.score(X_test, y_test)",
        documents: [
          {
            id: 3003,
            title: "Machine Learning Algorithms & Optimization Playbook",
            description: "Mathematical explanations and Scikit-Learn pipelines.",
            file_type: "PDF",
            file_url: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
            formatted_size: "4.1 MB",
          },
        ],
        videos: [
          {
            id: 3004,
            title: "Building Production Machine Learning Pipelines",
            description: "Complete walk-through of feature engineering, model training, and evaluation.",
            duration: "35:40",
            video_url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
            thumbnail_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=60",
          },
        ],
        documents_count: 1,
        videos_count: 1,
        color: "purple",
      },
    ],
  },
  {
    slug: "database",
    title: "Database Engineering & SQL Mastery",
    badge: "Core Essential",
    color: "#10b981",
    price: 399,
    original_price: 1199,
    description: "Relational database schema modeling, ACID transactions, complex indexing strategies, and query performance tuning.",
    skills: ["MySQL", "PostgreSQL", "Window Functions", "B-Tree Indexing", "CTEs", "Redis"],
    duration: "8 Weeks",
    level: "Beginner to Pro",
    curriculum_modules: [
      {
        id: 401,
        name: "Advanced SQL & Query Optimization",
        short_description: "Complex joins, Window functions, Subqueries, CTEs, and execution plan analysis.",
        description: "Analyze query performance with EXPLAIN ANALYZE, build recursive CTEs, and design efficient B-Tree composite indexes.",
        topics: ["Window Functions (ROW_NUMBER, RANK)", "Recursive CTEs", "EXPLAIN Query Plans", "Aggregation Pipelines"],
        important_points: [
          "Master partitioning and framing with OVER (PARTITION BY ...)",
          "Identify table scans and optimize indexes for composite filters",
          "ACID isolation levels and lock contention prevention",
        ],
        examples_notes: "WITH RankedOrders AS (\n  SELECT user_id, amount, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn\n  FROM orders\n)\nSELECT * FROM RankedOrders WHERE rn = 1;",
        documents: [
          {
            id: 4001,
            title: "High-Performance SQL & Index Tuning Playbook",
            description: "Query execution plan analysis and index design strategies.",
            file_type: "PDF",
            file_url: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
            formatted_size: "2.2 MB",
          },
        ],
        videos: [
          {
            id: 4002,
            title: "Database Indexing Deep Dive: B-Trees & Query Optimization",
            description: "Step-by-step demonstration of slow queries before and after index tuning.",
            duration: "29:45",
            video_url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
            thumbnail_url: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=60",
          },
        ],
        documents_count: 1,
        videos_count: 1,
        color: "emerald",
      },
      {
        id: 402,
        name: "Schema Architecture & ACID Transactions",
        short_description: "Normalization, foreign keys, database partitioning, and concurrent transactions.",
        description: "Relational database modeling, transaction isolation levels, row-level locking, and distributed caching with Redis.",
        topics: ["3NF Normalization", "ACID & Isolation Levels", "Deadlock Prevention", "Sharding & Replication"],
        important_points: [
          "Designing resilient schemas with constraints and foreign keys",
          "Preventing deadlocks and optimizing concurrent write workloads",
        ],
        examples_notes: "BEGIN TRANSACTION;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;",
        documents: [
          {
            id: 4003,
            title: "Schema Architecture & ACID Transactions Handbook",
            description: "Best practices for relational schema modeling and concurrency control.",
            file_type: "PDF",
            file_url: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
            formatted_size: "2.7 MB",
          },
        ],
        videos: [
          {
            id: 4004,
            title: "Transactions, Isolation Levels & Locking in PostgreSQL",
            description: "Visual explanation of Dirty Reads, Non-repeatable Reads, and Phantom Reads.",
            duration: "27:15",
            video_url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
            thumbnail_url: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=60",
          },
        ],
        documents_count: 1,
        videos_count: 1,
        color: "emerald",
      },
    ],
  },
];

export function getSpecializationPricing(pathway) {
  const payablePrice = Number(pathway?.price ?? 499);
  const offerEnabled = pathway?.offer_enabled !== false;
  const configuredOriginalPrice = Number(
    pathway?.original_price ??
    (payablePrice === 499 ? 1499 : payablePrice === 599 ? 1999 : payablePrice === 399 ? 1199 : Math.round(payablePrice * 2.8))
  );
  const hasOffer = offerEnabled && configuredOriginalPrice > payablePrice;
  const originalPrice = hasOffer ? configuredOriginalPrice : payablePrice;
  const discountAmount = hasOffer ? originalPrice - payablePrice : 0;
  const discountPercent = hasOffer ? Math.round((discountAmount / originalPrice) * 100) : 0;

  return {
    payablePrice,
    originalPrice,
    discountAmount,
    discountPercent,
    hasOffer,
    offerTag: `${discountPercent}% OFF • Limited Period Offer`,
  };
}

export default function CareerPathwaysSection({ initialSlug, showHeaderBack = false, className = "" }) {
  const { isAuthed, user } = useUserAuth();
  const navigate = useNavigate();

  // Robust student resolution with cached fallback so student name is never blank
  const activeUser = user || (() => {
    try {
      const cached = localStorage.getItem("oc_user_cached");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  })();
  const userLoggedIn = isAuthed || Boolean(activeUser);
  const displayName = activeUser?.name || (activeUser?.email ? activeUser.email.split("@")[0] : "");

  const [pathways, setPathways] = useState(() => {
    try {
      const cached = sessionStorage.getItem("oc_cache_career_pathways");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [activePathway, setActivePathway] = useState(() => {
    try {
      const cached = sessionStorage.getItem("oc_cache_career_pathways");
      if (cached) {
        const list = JSON.parse(cached);
        if (initialSlug) {
          const match = list.find((p) => p.slug === initialSlug);
          return match || list[0] || null;
        }
        return list[0] || null;
      }
    } catch {}
    return null;
  });
  const [unlockedSlugs, setUnlockedSlugs] = useState(() => {
    try {
      const cached = sessionStorage.getItem("oc_cache_my_pathway_access");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // Payment & study module states
  const [paying, setPaying] = useState(false);
  const [payNotice, setPayNotice] = useState(null);
  const [paymentEnabled, setPaymentEnabled] = useState(true);
  const [activeModule, setActiveModule] = useState(null);
  const [moduleTab, setModuleTab] = useState("info");
  const [activeDocument, setActiveDocument] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [docViewSize, setDocViewSize] = useState("medium"); // "medium" | "expanded"
  const [docZoom, setDocZoom] = useState(1); // 0.5 to 2.5
  const [videoViewSize, setVideoViewSize] = useState("medium"); // "medium" | "expanded"
  const [lockedPromptModule, setLockedPromptModule] = useState(null);

  // Prevent background page scrolling while modal viewer is active
  useEffect(() => {
    if (activeDocument) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeDocument]);

  useEffect(() => {
    let mounted = true;

    // Load career pathways from backend
    fetchCareerPathways()
      .then((res) => {
        if (!mounted) return;
        if (res.data?.data?.length) {
          const list = res.data.data;
          setPathways(list);
          try {
            sessionStorage.setItem("oc_cache_career_pathways", JSON.stringify(list));
          } catch {}
          if (initialSlug) {
            const match = list.find((p) => p.slug === initialSlug);
            setActivePathway(match || list[0]);
          } else {
            setActivePathway((curr) => {
              if (!curr) return list[0];
              const match = list.find((p) => (p.slug && p.slug === curr.slug) || (p.id != null && curr.id != null && String(p.id) === String(curr.id)));
              return match || list[0];
            });
          }
        }
      })
      .catch(() => {});

    fetchSiteSettings()
      .then((res) => {
        if (!mounted) return;
        if (res.data?.data) {
          const isReq = res.data.data.payment_required !== "0";
          setPaymentEnabled(isReq);
        }
      })
      .catch(() => {});

    if (isAuthed) {
      fetchMyPathwayAccess()
        .then((res) => {
          if (!mounted) return;
          if (res.data?.data) {
            const accessList = res.data.data;
            setUnlockedSlugs(accessList);
            try {
              sessionStorage.setItem("oc_cache_my_pathway_access", JSON.stringify(accessList));
            } catch {}
          }
        })
        .catch(() => {});
    }

    return () => {
      mounted = false;
    };
  }, [isAuthed, initialSlug]);

  useEffect(() => {
    if (initialSlug && pathways.length > 0) {
      const match = pathways.find((p) => p.slug === initialSlug);
      if (match) {
        setActivePathway(match);
        setActiveModule(null);
      }
    }
  }, [initialSlug, pathways]);

  const currentPathways = pathways.length > 0 ? pathways : FALLBACK_CAREER_TRACKS;
  const currentActive = activePathway || currentPathways[0];
  const activePricing = currentActive ? getSpecializationPricing(currentActive) : null;

  const isUnlocked = (pathway) => {
    if (!pathway) return false;
    if (!paymentEnabled) return true;
    if (pathway.is_locked === false || pathway.is_locked === 0 || pathway.is_locked === "0") return true;
    const s = pathway.slug || String(pathway.id);
    return unlockedSlugs.includes(s) || (pathway.slug && unlockedSlugs.includes(pathway.slug)) || false;
  };

  const isModuleUnlocked = (mod, pathway) => {
    if (isUnlocked(pathway)) return true;
    if (mod && (mod.is_locked === false || mod.is_locked === 0 || mod.is_locked === "0")) return true;
    return false;
  };

  const handleSelectPathway = (p) => {
    setActivePathway(p);
    setActiveModule(null);
    if (typeof window !== "undefined" && window.innerWidth < 992) {
      setTimeout(() => {
        const el = document.getElementById("oc-active-track-card");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 60);
    }
  };

  const handlePayForPathway = async (pathway) => {
    if (!isAuthed) {
      navigate("/login", { state: { from: "/home" } });
      return;
    }

    if (!pathway) return;
    const targetSlug = pathway.slug || String(pathway.id);

    setPaying(true);
    setPayNotice(null);

    try {
      const res = await createPathwayOrder(targetSlug);

      if (res.data?.already_paid) {
        setUnlockedSlugs((prev) => [...prev, targetSlug, pathway.slug]);
        setPayNotice({ type: "success", msg: "You already have unlocked access to this course pathway!" });
        setPaying(false);
        setLockedPromptModule(null);
        return;
      }

      const orderData = res.data;

      // Load Razorpay script if needed
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Online Class",
        description: `Unlock ${pathway.title}`,
        order_id: orderData.order_id,
        prefill: orderData.prefill || {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: pathway.color || "#3b82f6",
        },
        handler: async function (response) {
          try {
            await verifyPathwayPayment(targetSlug, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setUnlockedSlugs((prev) => [...prev, targetSlug, pathway.slug]);
            setPayNotice({
              type: "success",
              msg: `Payment successful! Full access for "${pathway.title}" is now unlocked.`,
            });
            setLockedPromptModule(null);
          } catch {
            setPayNotice({
              type: "danger",
              msg: "Payment verification failed. If your account was debited, please contact support.",
            });
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setPayNotice({
        type: "danger",
        msg: err.response?.data?.message || "Could not start payment. Please verify keys and try again.",
      });
      setPaying(false);
    }
  };

  const handleModuleClick = (mod, pathway) => {
    if (!isModuleUnlocked(mod, pathway)) {
      setLockedPromptModule(mod);
    } else {
      setActiveModule(mod);
      setModuleTab("info");
      setActiveVideo(null);
      setActiveDocument(null);
      setTimeout(() => {
        const el = document.getElementById("oc-active-study-module");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 60);
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }
    return url;
  };

  const isDirectVideo = (url) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg|mov|mkv|m4v)$/i.test(url) || url.includes("/stream");
  };

  const getDocIcon = (type) => {
    const t = (type || "").toLowerCase();
    if (t === "pdf") return "bi-file-earmark-pdf text-danger";
    if (t === "doc" || t === "docx") return "bi-file-earmark-word text-primary";
    if (t === "ppt" || t === "pptx") return "bi-file-earmark-slides text-warning";
    if (t === "zip" || t === "rar") return "bi-file-earmark-zip text-secondary";
    return "bi-file-earmark-text text-info";
  };

  return (
    <section className={`oc-tracks-section py-5 py-lg-6 ${className}`}>
      <div className="container">
        {showHeaderBack && (
          <div className="mb-4">
            <Link
              to="/dashboard"
              className="text-decoration-none text-muted d-inline-flex align-items-center gap-2 fw-semibold"
            >
              <i className="bi bi-arrow-left" />
              <span>Back to Main Dashboard</span>
            </Link>
          </div>
        )}

        <div className="text-center mb-5">
          <span className="oc-section-eyebrow text-violet">
            <i className="bi bi-diagram-3-fill me-1" /> Career Pathways
          </span>
          {userLoggedIn && displayName && (
            <div className="d-block mt-2 mb-2">
              <span className="badge bg-primary text-white px-3 py-2 rounded-pill shadow-sm fw-semibold" style={{ fontSize: "0.85rem" }}>
                <i className="bi bi-person-check-fill me-1" />
                Welcome, {displayName} &mdash; Choose Your Specialization
              </span>
            </div>
          )}
          <h2 className="oc-section-title">Curated Engineering Specializations</h2>
          <p className="oc-section-subtitle">
            Select a specialization to explore its course modules, notes, handbooks, and video lectures.
          </p>
        </div>

        {payNotice && (
          <div className={`alert alert-${payNotice.type} py-3 px-4 rounded-4 shadow-sm mb-4 d-flex align-items-center justify-content-between`}>
            <div className="d-flex align-items-center gap-2">
              <i className={`bi ${payNotice.type === "success" ? "bi-check-circle-fill fs-5 text-success" : "bi-exclamation-octagon-fill fs-5 text-danger"}`} />
              <span className="fw-semibold">{payNotice.msg}</span>
            </div>
            <button type="button" className="btn-close" onClick={() => setPayNotice(null)} />
          </div>
        )}

        <div className="row g-4 align-items-start">
          {/* Specialization Selector Tabs */}
          <div className="col-12 col-lg-4">
            <div className="oc-track-nav-list d-flex flex-column gap-2">
              <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom flex-wrap gap-2">
                <div>
                  <h3 className="h6 fw-bold text-dark text-uppercase letter-spacing-1 mb-0">
                    Choose Specialization
                  </h3>
                  {userLoggedIn && displayName && (
                    <Link
                      to="/dashboard"
                      className="d-inline-flex align-items-center gap-2 mt-1 text-decoration-none"
                      title="Go to Student Dashboard"
                      style={{ cursor: "pointer" }}
                    >
                      <span
                        className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold shadow-sm"
                        style={{ width: 22, height: 22, fontSize: "0.72rem" }}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                      <span className="fw-bold text-primary" style={{ fontSize: "0.88rem" }}>
                        {displayName}
                      </span>
                      <span
                        className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill"
                        style={{ fontSize: "0.68rem", padding: "0.15rem 0.45rem" }}
                      >
                        Verified Student
                      </span>
                    </Link>
                  )}
                </div>
                <span className="badge bg-light text-muted border rounded-pill">
                  {currentPathways.length} Available
                </span>
              </div>

              {currentPathways.map((p) => {
                const isSelected = Boolean(
                  (currentActive?.slug && p.slug && currentActive.slug === p.slug) ||
                  (currentActive?.id != null && p.id != null && String(currentActive.id) === String(p.id))
                );
                const unlocked = isUnlocked(p);
                const pricing = getSpecializationPricing(p);

                return (
                  <button
                    key={p.slug || p.id}
                    type="button"
                    className={`oc-track-nav-btn ${isSelected ? "active shadow-sm" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelectPathway(p);
                    }}
                    style={{
                      textAlign: "left",
                      borderLeft: isSelected
                        ? `5px solid ${p.color || "var(--brand-blue, #3b82f6)"}`
                        : "3px solid transparent",
                      background: isSelected ? "#1e1b4b" : undefined,
                      color: isSelected ? "#ffffff" : "#0f172a",
                      cursor: "pointer",
                      position: "relative",
                      zIndex: 5,
                      userSelect: "none",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-1" style={{ pointerEvents: "none" }}>
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="d-inline-flex align-items-center justify-content-center rounded-circle text-white shadow-sm"
                          style={{ width: 28, height: 28, background: p.color || "#3b82f6", fontSize: "0.85rem" }}
                        >
                          <i className={`bi ${p.icon || "bi-diagram-3-fill"}`} />
                        </span>
                        <span
                          className="fw-bold"
                          style={{
                            fontSize: "0.95rem",
                            color: isSelected ? "#ffffff" : "#0f172a",
                          }}
                        >
                          {p.title || p.name}
                        </span>
                      </div>
                      {unlocked ? (
                        <span
                          className={`badge rounded-pill small ${
                            isSelected
                              ? "bg-success text-white"
                              : "bg-success-subtle text-success border border-success-subtle"
                          }`}
                        >
                          <i className="bi bi-check-circle-fill me-1" /> Unlocked
                        </span>
                      ) : (
                        <div className="d-flex align-items-center gap-1">
                          {pricing.hasOffer && (
                            <>
                              <span
                                className="small text-decoration-line-through"
                                style={{
                                  fontSize: "0.74rem",
                                  color: isSelected ? "rgba(255, 255, 255, 0.65)" : "#64748b",
                                }}
                              >
                                ₹{pricing.originalPrice}
                              </span>
                              <span
                                className={`badge rounded-pill ${
                                  isSelected
                                    ? "bg-danger text-white"
                                    : "bg-danger-subtle text-danger border border-danger-subtle"
                                }`}
                                style={{ fontSize: "0.68rem", padding: "0.15rem 0.4rem" }}
                              >
                                {pricing.discountPercent}% OFF
                              </span>
                            </>
                          )}
                          <span
                            className={`badge rounded-pill small fw-bold ${
                              isSelected
                                ? "bg-warning text-dark"
                                : "bg-warning-subtle text-warning-emphasis border border-warning-subtle"
                            }`}
                          >
                            <i className="bi bi-lock-fill me-1" /> ₹{pricing.payablePrice}
                          </span>
                        </div>
                      )}
                    </div>
                    <div
                      className="d-flex align-items-center gap-2 small mt-1 ps-4"
                      style={{
                        pointerEvents: "none",
                        color: isSelected ? "rgba(255, 255, 255, 0.75)" : "#64748b",
                      }}
                    >
                      <span><i className="bi bi-clock me-1" />{p.duration}</span>
                      <span>&bull;</span>
                      <span>{p.level}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Specialization Details OR Full Subject Study Module View */}
          <div className="col-12 col-lg-8">
            {currentActive && !activeModule && (
              <div id="oc-active-track-card" className="oc-track-display-card p-4 p-md-5 rounded-4 shadow-sm bg-white border">
                  <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-3">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                        <span className="badge bg-primary-subtle text-primary px-3 py-1 rounded-pill fw-bold">
                          {currentActive.badge || "Specialization"}
                        </span>
                        <span className="badge bg-dark text-white px-3 py-1 rounded-pill">
                          {currentActive.duration}
                        </span>
                        <span className="badge bg-light text-muted border px-3 py-1 rounded-pill">
                          {currentActive.level}
                        </span>
                      </div>
                      <h3 className="h4 fw-bold text-dark mb-1">{currentActive.title || currentActive.name}</h3>
                      {userLoggedIn && displayName && (
                        <div className="d-inline-flex align-items-center gap-2 text-muted small mt-1 mb-2">
                          <i className="bi bi-person-check-fill text-primary" />
                          <span>Student Account: <strong className="text-dark">{displayName}</strong></span>
                        </div>
                      )}
                      <p className="text-muted mb-0" style={{ maxWidth: 640, lineHeight: 1.6 }}>
                        {currentActive.description || currentActive.desc}
                      </p>
                      <div className="mt-2 pt-1">
                        <Link
                          to={`/career-pathways/${currentActive.slug || currentActive.id}`}
                          className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1"
                        >
                          <span>Open Full Specialization Page</span>
                          <i className="bi bi-arrow-right" />
                        </Link>
                      </div>
                    </div>

                    {/* Pricing Breakdown & Access Box */}
                    <div className="text-lg-end bg-light p-3 p-md-4 rounded-4 border shadow-sm" style={{ minWidth: 280 }}>
                      {activePricing.hasOffer && (
                      <div className="d-flex align-items-center justify-content-lg-end gap-2 mb-1">
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2 py-1 small fw-bold">
                          <i className="bi bi-tag-fill me-1" /> {activePricing.discountPercent}% OFF &bull; Special Enrollment Offer
                        </span>
                      </div>
                      )}

                      <div className="d-flex align-items-baseline justify-content-lg-end gap-2 my-1">
                        {activePricing.hasOffer && <span className="text-muted text-decoration-line-through small fw-semibold">
                          Original: ₹{activePricing.originalPrice}
                        </span>}
                        <span className="h4 fw-bold text-dark mb-0">
                          ₹{activePricing.payablePrice}
                        </span>
                      </div>

                      {activePricing.hasOffer && <div className="text-success small fw-semibold mb-2" style={{ fontSize: "0.82rem" }}>
                        <i className="bi bi-gift-fill me-1" /> Save ₹{activePricing.discountAmount} on this track!
                      </div>}

                      <div className="d-flex justify-content-between align-items-center py-1 px-2 rounded-3 bg-white border mb-2 small text-start">
                        <span className="text-muted fw-semibold">Total to Pay:</span>
                        <span className="fw-bold text-primary fs-6">₹{activePricing.payablePrice}</span>
                      </div>

                      {isUnlocked(currentActive) ? (
                        <span className="badge bg-success text-white px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1 w-100 justify-content-center">
                          <i className="bi bi-patch-check-fill" /> Full Access Unlocked
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary rounded-pill px-4 py-2 fw-semibold shadow-sm w-100 d-inline-flex align-items-center justify-content-center gap-2"
                          onClick={() => handlePayForPathway(currentActive)}
                          disabled={paying}
                        >
                          {paying ? (
                            <>
                              <span className="spinner-border spinner-border-sm" role="status" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-unlock-fill" /> Unlock for ₹{activePricing.payablePrice}
                            </>
                          )}
                        </button>
                      )}
                      <small className="text-muted d-block mt-1 text-center text-lg-end" style={{ fontSize: "0.72rem" }}>
                        One-time fee &bull; Instant lifetime access
                      </small>
                    </div>
                  </div>

                <hr className="my-3" />

                {/* Technologies Covered */}
                {currentActive.skills && (
                  <div className="mb-4">
                    <h4 className="h6 fw-bold mb-2 text-dark">Core Technologies Covered:</h4>
                    <div className="d-flex flex-wrap gap-2">
                      {currentActive.skills.map((skill, i) => (
                        <span className="badge bg-light text-dark border px-3 py-2 rounded-pill" key={i}>
                          <i className="bi bi-check2 text-success me-1" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Curriculum Course Modules */}
                <div className="pt-2">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h4 className="h6 fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                        <i className="bi bi-book-half text-primary" />
                        <span>Curriculum Courses &amp; Modules:</span>
                      </h4>
                      <p className="text-muted small mb-0">
                        {isUnlocked(currentActive)
                          ? "Click on any course module below to study lecture notes, handbooks, and video recordings."
                          : "This track is locked. Complete enrollment to unlock all course handbooks and HD lectures."}
                      </p>
                    </div>
                    <span className="badge bg-primary-subtle text-primary border rounded-pill px-2 py-1 small">
                      {currentActive.curriculum_modules?.length || 0} Modules Included
                    </span>
                  </div>

                  <div className="row g-3 mb-4">
                    {currentActive.curriculum_modules?.map((mod, idx) => {
                      const modUnlocked = isModuleUnlocked(mod, currentActive);
                      return (
                        <div className="col-12 col-md-6" key={mod.id || idx}>
                          <div
                            className={`card h-100 border shadow-sm rounded-4 p-4 d-flex flex-column hover-lift cursor-pointer ${
                              !modUnlocked ? "bg-light-subtle" : "bg-white"
                            }`}
                            onClick={() => handleModuleClick(mod, currentActive)}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className={`badge bg-${mod.color || "primary"}-subtle text-${mod.color || "primary"} rounded-pill small border`}>
                                Module #{idx + 1}
                              </span>
                              <div className="d-flex align-items-center gap-1">
                                {mod.is_locked === false && !isUnlocked(currentActive) && (
                                  <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill small">
                                    <i className="bi bi-unlock-fill me-1" /> Free Preview
                                  </span>
                                )}
                                <span className="text-warning small fw-bold">
                                  <i className="bi bi-star-fill me-1" />5.0
                                </span>
                              </div>
                            </div>
                            <h5 className="h6 fw-bold text-dark mb-1">{mod.name}</h5>
                            <p className="text-muted small mb-2 flex-grow-1" style={{ lineHeight: 1.45 }}>
                              {mod.short_description || mod.description}
                            </p>

                            {mod.topics && (
                              <ul className="list-unstyled small text-muted mb-2">
                                {mod.topics.slice(0, 2).map((top, tIdx) => (
                                  <li key={tIdx} className="mb-1 d-flex align-items-center gap-1">
                                    <i className="bi bi-check-circle text-primary" style={{ fontSize: "0.75rem" }} />
                                    <span className="text-truncate">{top}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            <div className="mt-auto pt-2 border-top text-muted small d-flex justify-content-between align-items-center">
                              <span>
                                <i className="bi bi-files me-1" />{mod.documents_count || mod.documents?.length || 2} Docs &bull; {mod.videos_count || mod.videos?.length || 1} Vids
                              </span>
                              <button
                                type="button"
                                className={`btn btn-sm rounded-pill px-3 py-1 ${
                                  modUnlocked ? "btn-outline-primary" : "btn-warning text-dark fw-bold"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleModuleClick(mod, currentActive);
                                }}
                              >
                                {modUnlocked ? (
                                  <>
                                    <i className="bi bi-eye me-1" /> Study Module
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-lock-fill me-1" /> Locked
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* FULL SUBJECT STUDY MODULE EXPERIENCE */}
            {currentActive && activeModule && isModuleUnlocked(activeModule, currentActive) && (
              <div id="oc-active-study-module" className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white mb-4 position-relative">
                {/* Top Breadcrumb / Back Button */}
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-2"
                    onClick={() => setActiveModule(null)}
                  >
                    <i className="bi bi-arrow-left" />
                    <span>Back to {currentActive.title} Modules</span>
                  </button>

                  <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill">
                    <i className="bi bi-patch-check-fill me-1" /> Unlocked Educational Study Module
                  </span>
                </div>

                {/* Module Header Title Banner */}
                <div className="p-4 rounded-4 mb-4 text-white" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}>
                  <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                    <span className="badge bg-primary text-white rounded-pill px-3 py-1">
                      {currentActive.title}
                    </span>
                    <span className="badge bg-light text-dark rounded-pill px-3 py-1">
                      <i className="bi bi-star-fill text-warning me-1" /> 5.0 Rating
                    </span>
                    <span className="badge bg-secondary-subtle text-white rounded-pill px-3 py-1">
                      {activeModule.documents?.length || activeModule.documents_count || 2} Documents &bull; {activeModule.videos?.length || activeModule.videos_count || 1} Lectures
                    </span>
                  </div>

                  <h2 className="h3 fw-bold text-white mb-2">{activeModule.name}</h2>
                  <p className="text-white-50 mb-0" style={{ maxWidth: 680, lineHeight: 1.6 }}>
                    {activeModule.description || activeModule.short_description}
                  </p>
                </div>

                {/* Module Navigation Tabs */}
                <div className="oc-details-tabs mb-4">
                  <button
                    type="button"
                    className={`oc-details-tab ${moduleTab === "info" ? "active" : ""}`}
                    onClick={() => setModuleTab("info")}
                  >
                    <i className="bi bi-info-circle-fill me-2" />
                    Module Information &amp; Syllabus
                  </button>
                  <button
                    type="button"
                    className={`oc-details-tab ${moduleTab === "documents" ? "active" : ""}`}
                    onClick={() => setModuleTab("documents")}
                  >
                    <i className="bi bi-file-earmark-text-fill me-2" />
                    Study Documents ({activeModule.documents?.length || activeModule.documents_count || 2})
                  </button>
                  <button
                    type="button"
                    className={`oc-details-tab ${moduleTab === "videos" ? "active" : ""}`}
                    onClick={() => setModuleTab("videos")}
                  >
                    <i className="bi bi-play-circle-fill me-2" />
                    Video Lectures ({activeModule.videos?.length || activeModule.videos_count || 1})
                  </button>
                </div>

                {/* TAB 1: MODULE SYLLABUS & INFORMATION */}
                {moduleTab === "info" && (
                  <div className="row g-4">
                    <div className="col-12 col-lg-8">
                      <div className="oc-info-card mb-4">
                        <div className="oc-info-card-header">
                          <i className="bi bi-book-half text-primary me-2 fs-5" />
                          <h3 className="h5 mb-0 fw-bold">Overview &amp; Concept Architecture</h3>
                        </div>
                        <div className="oc-info-card-body">
                          <div className="oc-rich-text" style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>
                            {activeModule.description || activeModule.short_description}
                          </div>
                        </div>
                      </div>

                      {activeModule.important_points && activeModule.important_points.length > 0 && (
                        <div className="oc-info-card mb-4 oc-card-highlights">
                          <div className="oc-info-card-header">
                            <i className="bi bi-stars text-warning me-2 fs-5" />
                            <h3 className="h5 mb-0 fw-bold">Key Takeaways &amp; Important Points</h3>
                          </div>
                          <div className="oc-info-card-body">
                            <div className="row g-3">
                              {activeModule.important_points.map((pt, idx) => (
                                <div className="col-12" key={idx}>
                                  <div className="oc-highlight-item d-flex align-items-start gap-3">
                                    <span className="oc-highlight-bullet">
                                      <i className="bi bi-check2-circle" />
                                    </span>
                                    <span className="flex-grow-1" style={{ lineHeight: 1.55 }}>
                                      {pt}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {activeModule.examples_notes && (
                        <div className="oc-info-card mb-4">
                          <div className="oc-info-card-header d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-terminal-fill text-success me-2 fs-5" />
                              <h3 className="h5 mb-0 fw-bold">Code Examples &amp; Syntax Notes</h3>
                            </div>
                            <span className="badge bg-dark text-white-50 border border-secondary-subtle">
                              Architecture Snippet
                            </span>
                          </div>
                          <div className="oc-info-card-body p-0">
                            <pre className="oc-code-block m-0 p-3">
                              <code>{activeModule.examples_notes}</code>
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="col-12 col-lg-4">
                      {/* TOPICS COVERED LIST */}
                      {activeModule.topics && activeModule.topics.length > 0 && (
                        <div className="oc-info-card mb-4 border rounded-4 shadow-sm bg-white overflow-hidden">
                          <div className="oc-info-card-header d-flex align-items-center justify-content-between p-3 px-4 bg-light border-bottom">
                            <div className="d-flex align-items-center gap-2">
                              <i className="bi bi-list-check text-primary fs-5" />
                              <h3 className="h6 mb-0 fw-bold text-dark">Topics Covered</h3>
                            </div>
                            <span className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1" style={{ fontSize: "0.75rem" }}>
                              {activeModule.topics.length} Key Topics
                            </span>
                          </div>
                          <div className="oc-info-card-body p-0">
                            <ul className="list-group list-group-flush oc-topics-list">
                              {activeModule.topics.map((top, i) => (
                                <li className="list-group-item d-flex align-items-start gap-2 py-3 px-4 border-bottom-0" key={i}>
                                  <span className="badge bg-primary-subtle text-primary rounded-circle p-1 mt-1 d-inline-flex align-items-center justify-content-center" style={{ width: 20, height: 20, minWidth: 20 }}>
                                    <i className="bi bi-check-lg" style={{ fontSize: "0.75rem" }} />
                                  </span>
                                  <span style={{ fontSize: "0.9rem", fontWeight: 500, lineHeight: 1.5 }} className="text-dark">{top}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* READY TO STUDY ACTION CARD */}
                      <div className="oc-sidebar-action-card p-4 rounded-4 text-center bg-white border shadow-sm mb-4 position-relative overflow-hidden">
                        <div className="mb-3">
                          <span
                            className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary shadow-sm"
                            style={{ width: 56, height: 56, fontSize: "1.75rem" }}
                          >
                            <i className="bi bi-mortarboard-fill" />
                          </span>
                        </div>
                        <h4 className="fw-bold mb-2 text-dark fs-5">Ready to Study?</h4>
                        <p className="text-muted mb-4 small" style={{ lineHeight: 1.55 }}>
                          Explore study handbooks, lecture slides, and HD video walkthroughs for this course module.
                        </p>
                        <div className="d-grid gap-2">
                          <button
                            type="button"
                            className="btn btn-primary rounded-pill py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                            onClick={() => setModuleTab("documents")}
                          >
                            <i className="bi bi-files" />
                            <span>Browse Study Documents</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-primary rounded-pill py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                            onClick={() => setModuleTab("videos")}
                          >
                            <i className="bi bi-play-circle" />
                            <span>Watch Video Lectures</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: STUDY DOCUMENTS */}
                {moduleTab === "documents" && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                      <div>
                        <h3 className="h5 fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
                          <i className="bi bi-file-earmark-text text-primary" />
                          <span>Study Handbooks &amp; Materials for {activeModule.name}</span>
                        </h3>
                        <p className="text-muted mb-0 small">
                          Secure in-browser study documents protected with dynamic DRM watermarking.
                        </p>
                      </div>
                      <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">
                        <i className="bi bi-shield-lock-fill me-1" /> View-Only Mode
                      </span>
                    </div>

                    {/* Anti-Download Information Banner */}
                    <div className="alert alert-primary py-2 px-3 rounded-3 small d-flex align-items-center gap-2 mb-4 border-0 shadow-sm bg-primary-subtle text-primary-emphasis">
                      <i className="bi bi-shield-check fs-5 text-primary" />
                      <span>
                        <strong>Anti-Download DRM Active:</strong> Educational handbooks, slides, and study notes are strictly view-only and cannot be downloaded, exported, or redistributed.
                      </span>
                    </div>

                    {(!activeModule.documents || activeModule.documents.length === 0) ? (
                      <div className="text-center py-5 text-muted bg-light rounded-4 border border-dashed">
                        <i className="bi bi-folder-x fs-2 mb-2 d-block text-secondary" />
                        <h6 className="fw-bold text-dark">No document files uploaded for this module yet</h6>
                        <p className="small text-muted mb-0">Check back soon for uploaded course handbooks and slides.</p>
                      </div>
                    ) : (
                      <div className="row g-3">
                        {activeModule.documents.map((doc) => (
                          <div className="col-12" key={doc.id || doc.title}>
                            <div className="oc-doc-card p-4 rounded-4 shadow-sm bg-white border d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                              <div className="d-flex align-items-start gap-3">
                                <div className="oc-doc-icon-box">
                                  <i className={`bi ${getDocIcon(doc.file_type)} fs-2 text-primary`} />
                                </div>
                                <div>
                                  <h4 className="h6 fw-bold mb-1 text-dark d-flex align-items-center gap-2 flex-wrap">
                                    <span>{doc.title}</span>
                                    <span className="badge bg-light text-dark border text-uppercase" style={{ fontSize: "0.68rem" }}>
                                      {doc.file_type || "PDF"}
                                    </span>
                                    {doc.formatted_size && (
                                      <span className="badge bg-light text-muted border" style={{ fontSize: "0.68rem" }}>
                                        {doc.formatted_size}
                                      </span>
                                    )}
                                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle" style={{ fontSize: "0.68rem" }}>
                                      <i className="bi bi-lock-fill me-1" /> View Only
                                    </span>
                                  </h4>
                                  {doc.description && (
                                    <p className="text-muted mb-0 small" style={{ maxWidth: 650, lineHeight: 1.5 }}>
                                      {doc.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="d-flex align-items-center gap-2 w-100 w-md-auto justify-content-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2 shadow-sm fw-semibold"
                                  onClick={() => setActiveDocument(doc)}
                                >
                                  <i className="bi bi-eye-fill" />
                                  <span>View Online</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: VIDEO LECTURES */}
                {moduleTab === "videos" && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                      <div>
                        <h3 className="h5 fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
                          <i className="bi bi-play-circle text-danger" />
                          <span>HD Video Lectures for {activeModule.name}</span>
                        </h3>
                        <p className="text-muted mb-0 small">
                          High-definition recordings and walkthrough sessions with instructor guidance.
                        </p>
                      </div>
                    </div>

                    {/* Inline Active Video Player */}
                    {activeVideo && (
                      <div className={`oc-active-video-container mb-5 p-3 p-md-4 rounded-4 shadow-lg bg-dark ${videoViewSize === "expanded" ? "oc-active-video-container--expanded" : "oc-active-video-container--medium"}`}>
                        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                          <h4 className="text-white mb-0 d-flex align-items-center gap-2 fs-6">
                            <i className="bi bi-play-circle-fill text-danger" />
                            <span>{activeVideo.title}</span>
                          </h4>
                          <div className="d-flex align-items-center gap-2">
                            <div className="oc-view-size-btn-group" role="group" aria-label="Player Size">
                              <button
                                type="button"
                                className={`btn ${videoViewSize === "medium" ? "active" : "oc-btn-medium-prominent"}`}
                                onClick={() => setVideoViewSize("medium")}
                                title="Medium Player View"
                              >
                                <i className="bi bi-window me-1" /> Medium
                              </button>
                              <button
                                type="button"
                                className={`btn ${videoViewSize === "expanded" ? "active" : "oc-btn-entire-prominent"}`}
                                onClick={() => setVideoViewSize("expanded")}
                                title="Display Entire Website Width"
                              >
                                <i className="bi bi-arrows-fullscreen me-1" /> Entire Website
                              </button>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-light rounded-pill px-3"
                              onClick={() => setActiveVideo(null)}
                            >
                              <i className="bi bi-x-lg me-1" /> Close Player
                            </button>
                          </div>
                        </div>

                        <div className="ratio ratio-16x9 rounded-3 overflow-hidden bg-black shadow position-relative">
                          {activeVideo.video_url && !isDirectVideo(activeVideo.video_url) ? (
                            <iframe
                              src={getEmbedUrl(activeVideo.video_url)}
                              title={activeVideo.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              controls
                              autoPlay
                              playsInline
                              controlsList="nodownload noplaybackrate noremoteplayback"
                              disablePictureInPicture
                              disableRemotePlayback
                              onContextMenu={(e) => e.preventDefault()}
                              src={activeVideo.video_url}
                              className="w-100 h-100"
                            >
                              Your browser does not support video playback.
                            </video>
                          )}
                        </div>
                      </div>
                    )}

                    {(!activeModule.videos || activeModule.videos.length === 0) ? (
                      <div className="text-center py-5 text-muted bg-light rounded-4">
                        <i className="bi bi-camera-video-off fs-2 mb-2 d-block" />
                        <h6>No video recordings posted for this module yet</h6>
                      </div>
                    ) : (
                      <div className="row g-4">
                        {activeModule.videos.map((vid) => (
                          <div className="col-12 col-md-6" key={vid.id || vid.title}>
                            <div className="oc-video-card h-100 rounded-4 overflow-hidden shadow-sm bg-white border d-flex flex-column">
                              <div
                                className="oc-video-thumb-wrap position-relative cursor-pointer"
                                onClick={() => setActiveVideo(vid)}
                              >
                                {vid.thumbnail_url ? (
                                  <img
                                    src={vid.thumbnail_url}
                                    alt={vid.title}
                                    className="w-100 h-100 object-fit-cover"
                                  />
                                ) : (
                                  <div className="oc-video-default-thumb">
                                    <i className="bi bi-camera-video-fill text-white-50 fs-1" />
                                  </div>
                                )}
                                <div className="oc-play-overlay">
                                  <span className="oc-play-button-pulse">
                                    <i className="bi bi-play-fill" />
                                  </span>
                                </div>
                                {vid.duration && (
                                  <span className="oc-video-duration-badge">
                                    <i className="bi bi-clock me-1" />
                                    {vid.duration}
                                  </span>
                                )}
                              </div>

                              <div className="p-3 d-flex flex-column flex-grow-1">
                                <h4 className="h6 fw-bold mb-2 text-dark line-clamp-2" title={vid.title}>
                                  {vid.title}
                                </h4>
                                {vid.description && (
                                  <p className="text-muted small mb-3 flex-grow-1 line-clamp-2">
                                    {vid.description}
                                  </p>
                                )}
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger w-100 rounded-pill mt-auto d-flex align-items-center justify-content-center gap-1"
                                  onClick={() => setActiveVideo(vid)}
                                >
                                  <i className="bi bi-play-circle-fill" />
                                  <span>Play Video Lecture</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LOCKED MODULE PROMPT MODAL */}
      {lockedPromptModule && currentActive && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }}
          onClick={() => setLockedPromptModule(null)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content rounded-4 border-0 shadow-lg text-center p-4">
              <div className="mb-3">
                <span
                  className="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning-subtle text-warning-emphasis shadow-sm"
                  style={{ width: 64, height: 64, fontSize: "1.8rem" }}
                >
                  <i className="bi bi-lock-fill" />
                </span>
              </div>

              <h4 className="fw-bold text-dark mb-2">Specialization Track Locked</h4>
              <p className="text-muted small mb-4" style={{ lineHeight: 1.6 }}>
                <strong>"{lockedPromptModule.name}"</strong> is part of the <strong>{currentActive.title}</strong> specialization.
                Please complete the enrollment payment to unlock all course handbooks, slides, and HD recordings.
              </p>

              {(() => {
                const modalPricing = getSpecializationPricing(currentActive);

                return (
                  <>
                    <div className="bg-light p-3 rounded-4 border mb-4 text-start">
                      {modalPricing.hasOffer && <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="text-muted small">Standard Track Fee:</span>
                        <span className="text-muted text-decoration-line-through small fw-semibold">₹{modalPricing.originalPrice}</span>
                      </div>}
                      {modalPricing.hasOffer && <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="text-danger small fw-semibold">
                          <i className="bi bi-tag-fill me-1" /> Special Track Discount ({modalPricing.discountPercent}% OFF):
                        </span>
                        <span className="text-danger small fw-semibold">-₹{modalPricing.discountAmount}</span>
                      </div>}
                      {modalPricing.hasOffer && <div className="d-flex align-items-center gap-1 mb-2">
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill" style={{ fontSize: "0.72rem" }}>
                          <i className="bi bi-stars me-1" /> Limited Period Enrollment Offer
                        </span>
                      </div>}
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-dark">Total Amount to Pay:</span>
                        <span className="h4 fw-bold text-primary mb-0">₹{modalPricing.payablePrice}</span>
                      </div>
                    </div>

                    <div className="d-grid gap-2">
                      <button
                        type="button"
                        className="btn btn-primary rounded-pill py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                        onClick={() => handlePayForPathway(currentActive)}
                        disabled={paying}
                      >
                        {paying ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-unlock-fill" /> Unlock Full Track for ₹{modalPricing.payablePrice}
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-light rounded-pill py-2 text-muted"
                        onClick={() => setLockedPromptModule(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* PROTECTED DOCUMENT MODAL VIEWER WITH DYNAMIC WATERMARK (STRICT NO-DOWNLOAD) */}
      {activeDocument && (
        <div
          className={`oc-doc-viewer-modal-backdrop ${docViewSize === "expanded" ? "oc-doc-viewer-modal-backdrop--expanded" : ""}`}
          onClick={() => setActiveDocument(null)}
          onContextMenu={(e) => e.preventDefault()}
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
        >
          <div
            className={`oc-doc-viewer-modal ${docViewSize === "expanded" ? "oc-doc-viewer-modal--expanded" : "oc-doc-viewer-modal--medium"}`}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Header */}
            <div className="oc-doc-viewer-header">
              <div className="d-flex align-items-center gap-2 overflow-hidden" style={{ minWidth: 0, flex: "1 1 200px" }}>
                <span className="oc-popover-icon bg-primary text-white flex-shrink-0">
                  <i className="bi bi-shield-lock-fill" />
                </span>
                <div className="overflow-hidden">
                  <h4 className="mb-0 text-white text-truncate" style={{ fontSize: "0.95rem" }} title={activeDocument.title}>
                    {activeDocument.title}
                  </h4>
                  <small className="text-white-50 text-truncate d-block" style={{ fontSize: "0.72rem" }}>
                    🔒 Protected Study Viewer &bull; {currentActive?.title} &bull; (Downloads Disabled)
                  </small>
                </div>
              </div>
              <div className="oc-viewer-controls d-flex align-items-center flex-wrap gap-2">
                {/* Zoom Controls */}
                <div className="oc-doc-zoom-toolbar" role="group" aria-label="Document Zoom">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setDocZoom((prev) => Math.max(0.5, +(prev - 0.25).toFixed(2)))}
                    title="Zoom Out (-25%)"
                    disabled={docZoom <= 0.5}
                  >
                    <i className="bi bi-dash-lg" />
                  </button>
                  <span
                    className="oc-doc-zoom-val"
                    onClick={() => setDocZoom(1)}
                    title="Click to reset zoom to 100%"
                  >
                    {Math.round(docZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setDocZoom((prev) => Math.min(2.5, +(prev + 0.25).toFixed(2)))}
                    title="Zoom In (+25%)"
                    disabled={docZoom >= 2.5}
                  >
                    <i className="bi bi-plus-lg" />
                  </button>
                  {docZoom !== 1 && (
                    <button
                      type="button"
                      className="btn oc-doc-zoom-reset-btn"
                      onClick={() => setDocZoom(1)}
                      title="Reset Zoom to 100%"
                    >
                      <i className="bi bi-arrow-counterclockwise me-1" /> Reset
                    </button>
                  )}
                </div>

                {/* Sizing Switcher (Medium vs Entire Website) */}
                <div className="oc-view-size-btn-group" role="group" aria-label="Viewer Size">
                  <button
                    type="button"
                    className={`btn ${docViewSize === "medium" ? "active" : "oc-btn-medium-prominent"}`}
                    onClick={() => {
                      setDocViewSize("medium");
                      setDocZoom(1);
                    }}
                    title="Switch to Medium View"
                  >
                    <i className="bi bi-window me-1" />
                    <span>Medium</span>
                  </button>
                  <button
                    type="button"
                    className={`btn ${docViewSize === "expanded" ? "active" : "oc-btn-entire-prominent"}`}
                    onClick={() => setDocViewSize("expanded")}
                    title="Display Entire Website Width"
                  >
                    <i className="bi bi-arrows-fullscreen me-1" />
                    <span>Entire Website</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-dark text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: 32, height: 32, padding: 0, border: "1px solid rgba(255, 255, 255, 0.25)" }}
                  onClick={() => {
                    setActiveDocument(null);
                    setDocZoom(1);
                  }}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            </div>

            {/* Viewer Content Body */}
            <div
              className={`oc-doc-viewer-body position-relative ${docViewSize === "expanded" ? "oc-doc-viewer-body--expanded" : "oc-doc-viewer-body--medium"}`}
              style={{ backgroundColor: "#0f172a", userSelect: "none" }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <DynamicWatermark
                username={user?.name || "Student Viewer"}
                sessionId="ONLINE-CLASS-DRM"
                sectionTitle={`${currentActive?.title} - ${activeDocument.title}`}
              />

              {activeDocument.file_url ? (
                <div
                  className="w-100 h-100 position-relative"
                  style={{
                    minHeight: docViewSize === "expanded" ? "calc(100vh - 180px)" : "75vh",
                    overflow: "auto",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round(docZoom * 100)}%`,
                      minHeight: docViewSize === "expanded" ? (docZoom > 1 ? `calc(${Math.round(docZoom * 100)}vh - 180px)` : "calc(100vh - 180px)") : (docZoom > 1 ? `${Math.round(docZoom * 75)}vh` : "75vh"),
                      height: docZoom > 1 ? `${Math.round(docZoom * 100)}%` : "100%",
                      margin: "0 auto",
                      transition: "width 0.2s ease-out, min-height 0.2s ease-out",
                    }}
                  >
                    <iframe
                      key={`cp-pdf-${activeDocument.id || activeDocument._id || activeDocument.title}-${docViewSize}`}
                      src={`${activeDocument.file_url}#view=FitH&toolbar=0&navpanes=0`}
                      title={activeDocument.title}
                      className="w-100 h-100 rounded border-0"
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: docViewSize === "expanded" ? (docZoom > 1 ? `calc(${Math.round(docZoom * 100)}vh - 180px)` : "calc(100vh - 180px)") : (docZoom > 1 ? `${Math.round(docZoom * 75)}vh` : "75vh"),
                        backgroundColor: "#0f172a",
                        display: "block",
                      }}
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </div>
              ) : (
                /* Rich In-Browser Study Handbook Viewer (If direct file URL is not hosted, render clean syllabus guide) */
                <div
                  className="p-4 p-md-5 text-white"
                  style={{
                    minHeight: docViewSize === "expanded" ? "calc(100vh - 180px)" : "75vh",
                    overflowY: "auto",
                    zoom: docZoom !== 1 ? docZoom : undefined,
                    transition: "zoom 0.18s ease-out",
                  }}
                >
                  <div className="text-center mb-4">
                    <span className="badge bg-primary text-white px-3 py-1 rounded-pill mb-2">
                      {currentActive?.title} &bull; {activeModule?.name}
                    </span>
                    <h3 className="fw-bold text-white mb-2">{activeDocument.title}</h3>
                    <p className="text-white-50 small mb-0" style={{ maxWidth: 640, margin: "0 auto" }}>
                      {activeDocument.description || "Official educational handbook and course study material."}
                    </p>
                  </div>

                  <div className="card bg-dark border-secondary rounded-4 p-4 mb-4 text-white">
                    <h5 className="fw-bold text-info mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-book-half" />
                      <span>Module Handbook Contents &amp; Study Guide</span>
                    </h5>
                    <div className="text-light small mb-3" style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>
                      {activeModule?.description || activeModule?.short_description}
                    </div>

                    {activeModule?.important_points && activeModule.important_points.length > 0 && (
                      <div className="mt-3 pt-3 border-top border-secondary">
                        <h6 className="fw-bold text-warning mb-2">Key Highlights &amp; Exam Notes:</h6>
                        <ul className="mb-0 text-white-50 ps-3">
                          {activeModule.important_points.map((pt, idx) => (
                            <li key={idx} className="mb-1">{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {activeModule?.examples_notes && (
                    <div className="card bg-black border-secondary rounded-4 p-4 text-white font-monospace">
                      <h6 className="text-success mb-2 font-monospace"># Code Architecture / Notes</h6>
                      <pre className="text-light m-0" style={{ fontSize: "0.85rem" }}>
                        <code>{activeModule.examples_notes}</code>
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="oc-doc-viewer-footer d-flex justify-content-between align-items-center">
              <span className="text-white-50 small d-flex align-items-center gap-2">
                <i className="bi bi-shield-fill-check text-success" />
                <span>Anti-Download &amp; Academic Watermarking Active &bull; View Only</span>
              </span>
              <button
                type="button"
                className="btn btn-sm btn-secondary rounded-pill px-4"
                onClick={() => setActiveDocument(null)}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
