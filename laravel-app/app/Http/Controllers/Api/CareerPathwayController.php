<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminSetting;
use App\Models\CareerPathway;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CareerPathwayController extends Controller
{
    /**
     * Default starter pathways used if the database is initially empty.
     */
    private function defaultPathways(): array
    {
        return [
            [
                'slug' => 'backend',
                'title' => 'Backend & Systems Architecture',
                'badge' => 'High Demand',
                'color' => '#3b82f6',
                'icon' => 'bi-terminal-fill',
                'description' => 'Master Python, Flask, REST APIs, microservices, authentication security, and scalable server architecture.',
                'skills' => ['Python 3.12', 'Flask', 'SQLAlchemy', 'JWT Auth', 'Docker', 'PostgreSQL'],
                'duration' => '12 Weeks',
                'level' => 'Beginner to Advanced',
                'price' => 499,
                'sort_order' => 1,
                'is_active' => true,
                'curriculum_modules' => [
                    [
                        'id' => 101,
                        'name' => 'Python Core Programming',
                        'slug' => 'python-core',
                        'short_description' => 'Fundamentals, OOP, functional paradigms, memory management and decorators.',
                        'description' => "Deep dive into the core mechanics of Python 3.12. Understand bytecode execution, dynamic typing system, memory model (Garbage Collection, Reference Counting), OOP, and advanced metaprogramming with decorators and metaclasses.",
                        'important_points' => [
                            'Master Python memory architecture and Garbage Collection mechanisms.',
                            'Implement custom Context Managers with the __enter__ and __exit__ protocol.',
                            'Write clean Object Oriented Python utilizing dataclasses and inheritance hierarchies.',
                            'Understand closures, higher-order functions, and multi-tier parameter decorators.'
                        ],
                        'examples_notes' => "from functools import wraps\nimport time\n\ndef performance_logger(func):\n    @wraps(func)\n    def wrapper(*args, **kwargs):\n        start = time.perf_counter()\n        result = func(*args, **kwargs)\n        duration = time.perf_counter() - start\n        print(f\"{func.__name__} executed in {duration:.4f}s\")\n        return result\n    return wrapper\n\n@performance_logger\ndef compute_data(items: list[int]) -> int:\n    return sum(x**2 for x in items)",
                        'topics' => ['Data Structures & Collections', 'OOP & Magic Methods', 'Context Managers', 'Generators & Iterators', 'Type Hinting & Pydantic'],
                        'documents' => [
                            [
                                'id' => 1011,
                                'title' => 'Python 3.12 Core Architecture & Syntax Handbook',
                                'description' => 'Complete guide covering data structures, OOP patterns, and modern syntax features.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '2.4 MB'
                            ],
                            [
                                'id' => 1012,
                                'title' => 'Generators, Iterators & Memory Profiling Reference',
                                'description' => 'Detailed notes and code snippets on memory-efficient streams and lazy evaluation.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '1.8 MB'
                            ]
                        ],
                        'videos' => [
                            [
                                'id' => 1011,
                                'title' => 'Python OOP & Memory Architecture Explained',
                                'description' => 'Lecture walkthrough of Python object model, dunder methods, and decorators.',
                                'duration' => '42:15',
                                'video_url' => 'https://www.youtube.com/watch?v=rfscVS0vtbw',
                                'thumbnail_url' => 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=60'
                            ],
                            [
                                'id' => 1012,
                                'title' => 'Decorators, Metaclasses & Pythonic Design Patterns',
                                'description' => 'Hands-on live coding session creating reusable production-grade decorators.',
                                'duration' => '38:50',
                                'video_url' => 'https://www.youtube.com/watch?v=FsAPt_9Bf3U',
                                'thumbnail_url' => 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&auto=format&fit=crop&q=60'
                            ]
                        ],
                        'documents_count' => 2,
                        'videos_count' => 2,
                        'color' => 'blue',
                    ],
                    [
                        'id' => 102,
                        'name' => 'Flask & REST API Microservices',
                        'slug' => 'flask-backend',
                        'short_description' => 'Blueprints, SQLAlchemy ORM, migrations, middleware, and JWT authentication.',
                        'description' => "Build rock-solid backend services with Flask. Learn application factories, blueprint modularization, database relationships with SQLAlchemy ORM, database migrations, rate limiting, and JWT authentication workflows.",
                        'important_points' => [
                            'Implement Application Factory pattern for testability and configuration environments.',
                            'Structure relational data with SQLAlchemy declarative base and relationship backrefs.',
                            'Implement Role-Based Access Control (RBAC) with JSON Web Tokens (JWT).',
                            'Design idempotency and rate limiting into RESTful endpoints.'
                        ],
                        'examples_notes' => "from flask import Flask, jsonify, request\nfrom flask_jwt_extended import JWTManager, create_access_token, jwt_required\n\napp = Flask(__name__)\napp.config['JWT_SECRET_KEY'] = 'production_super_secret_key'\njwt = JWTManager(app)\n\n@app.route('/api/auth/login', methods=['POST'])\ndef login():\n    data = request.get_json() or {}\n    if data.get('username') == 'admin' and data.get('password') == 'pass':\n        token = create_access_token(identity={'id': 1, 'role': 'admin'})\n        return jsonify(access_token=token), 200\n    return jsonify(message='Invalid credentials'), 401",
                        'topics' => ['Application Factory Pattern', 'SQLAlchemy Relationships', 'Marshmallow Schemas', 'JWT Tokens & RBAC', 'Database Migrations with Alembic'],
                        'documents' => [
                            [
                                'id' => 1021,
                                'title' => 'Flask Production Architecture & ORM Blueprint',
                                'description' => 'Architecture manual for building production-ready scalable REST APIs.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '3.1 MB'
                            ],
                            [
                                'id' => 1022,
                                'title' => 'REST API Security & JWT Authentication Guide',
                                'description' => 'Handbook on token validation, token refresh strategies, and rate limiting.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '1.5 MB'
                            ]
                        ],
                        'videos' => [
                            [
                                'id' => 1021,
                                'title' => 'Building Scalable Flask REST APIs from Scratch',
                                'description' => 'Complete walkthrough building modular Flask API with SQLAlchemy ORM.',
                                'duration' => '45:30',
                                'video_url' => 'https://www.youtube.com/watch?v=GMppyAPbLYk',
                                'thumbnail_url' => 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=60'
                            ]
                        ],
                        'documents_count' => 2,
                        'videos_count' => 1,
                        'color' => 'amber',
                    ],
                    [
                        'id' => 103,
                        'name' => 'Server Security & Microservices',
                        'slug' => 'server-security',
                        'short_description' => 'DRM protection, rate limiting, Docker containerization, and production deployment.',
                        'description' => "Scale and protect your backend systems. Implement DRM content security, encrypted streams, Docker containerization, reverse proxying with NGINX, and CI/CD pipelines.",
                        'important_points' => [
                            'Configure NGINX reverse proxies with TLS 1.3 and gzip acceleration.',
                            'Multi-stage Docker builds for minimal production image footprint.',
                            'Watermarked content streaming and tokenized DRM protection.',
                            'Zero-downtime blue-green deployments.'
                        ],
                        'examples_notes' => "FROM python:3.12-slim as builder\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\n\nFROM python:3.12-slim\nWORKDIR /app\nCOPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages\nCOPY . .\nCMD [\"gunicorn\", \"--workers=4\", \"--bind=0.0.0.0:8000\", \"wsgi:app\"]",
                        'topics' => ['Docker Containers', 'Rate Limiting & CORS', 'OAuth2 Integration', 'High Availability Arch', 'TLS & DRM Security'],
                        'documents' => [
                            [
                                'id' => 1031,
                                'title' => 'Docker & Cloud Deployment Playbook',
                                'description' => 'Step-by-step containerization, compose clustering, and NGINX setup.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '2.9 MB'
                            ]
                        ],
                        'videos' => [
                            [
                                'id' => 1031,
                                'title' => 'Containerizing Backend APIs with Docker & Compose',
                                'description' => 'Live deployment from local machine to cloud VM with Docker.',
                                'duration' => '36:10',
                                'video_url' => 'https://www.youtube.com/watch?v=fqMOX6JJhGo',
                                'thumbnail_url' => 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=600&auto=format&fit=crop&q=60'
                            ]
                        ],
                        'documents_count' => 1,
                        'videos_count' => 1,
                        'color' => 'violet',
                    ],
                ],
            ],
            [
                'slug' => 'frontend',
                'title' => 'Modern Frontend & UI/UX Engineering',
                'badge' => 'Industry Standard',
                'color' => '#06b6d4',
                'icon' => 'bi-browser-chrome',
                'description' => 'Build lightning-fast, reactive web applications with JavaScript (ES6+), React 19, Vite, and modern CSS/Bootstrap.',
                'skills' => ['React 19', 'JavaScript ES6+', 'React Router', 'Axios', 'Glassmorphism UI', 'Vite'],
                'duration' => '10 Weeks',
                'level' => 'All Levels',
                'price' => 499,
                'sort_order' => 2,
                'is_active' => true,
                'curriculum_modules' => [
                    [
                        'id' => 201,
                        'name' => 'Modern JavaScript ES6+ Deep Dive',
                        'slug' => 'javascript-es6',
                        'short_description' => 'Asynchronous JavaScript, Event Loop, Closures, DOM, and Fetch API.',
                        'description' => "Master the foundations of the web. Understand JavaScript execution context, event loop, microtask queue, closures, prototypal inheritance, and async programming with Promises and Async/Await.",
                        'important_points' => [
                            'Grasp Event Loop mechanisms: Call Stack, Web APIs, Microtask & Macrotask queues.',
                            'Deep understanding of variable scoping, lexical environments, and closures.',
                            'Modern ES6+ array manipulation (map, filter, reduce, find, some, every).',
                            'Handling asynchronous I/O and resilient API error boundaries.'
                        ],
                        'examples_notes' => "async function fetchCurriculumData(slug) {\n  try {\n    const response = await fetch(\`/api/career-pathways/\${slug}\`);\n    if (!response.ok) throw new Error(\`HTTP Error: \${response.status}\`);\n    const { data } = await response.json();\n    return data;\n  } catch (err) {\n    console.error('Fetch failed:', err);\n    throw err;\n  }\n}",
                        'topics' => ['Async/Await & Promises', 'Closures & Scope Chain', 'ES Modules', 'Event Bubbling & Capture', 'DOM Manipulation'],
                        'documents' => [
                            [
                                'id' => 2011,
                                'title' => 'Modern JavaScript ES6+ Comprehensive Guide',
                                'description' => 'Cheatsheet and technical deep-dive into closures, async programming, and syntax.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '2.1 MB'
                            ]
                        ],
                        'videos' => [
                            [
                                'id' => 2011,
                                'title' => 'JavaScript Event Loop & Async Architecture',
                                'description' => 'Visualizing the call stack, task queue, and event loop in action.',
                                'duration' => '32:40',
                                'video_url' => 'https://www.youtube.com/watch?v=8aGhZQkoFbQ',
                                'thumbnail_url' => 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600&auto=format&fit=crop&q=60'
                            ]
                        ],
                        'documents_count' => 1,
                        'videos_count' => 1,
                        'color' => 'cyan',
                    ],
                    [
                        'id' => 202,
                        'name' => 'React 19 & State Architecture',
                        'slug' => 'react-19',
                        'short_description' => 'Component lifecycle, Custom Hooks, Context API, and Performance Optimization.',
                        'description' => "Construct high-performance Single Page Applications with React 19. Master useState, useEffect, useMemo, useCallback, custom hooks, global state with Context API, and client-side routing.",
                        'important_points' => [
                            'Component lifecycle and reconciliation with Virtual DOM.',
                            'Building reusable custom hooks to encapsulate domain state logic.',
                            'Optimizing re-renders with memoization and shallow equality comparisons.',
                            'Declarative routing and navigation with React Router.'
                        ],
                        'examples_notes' => "import { useState, useEffect, useCallback } from 'react';\n\nexport function useDebounce(value, delay = 300) {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const handler = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(handler);\n  }, [value, delay]);\n  return debounced;\n}",
                        'topics' => ['React Hooks Ecosystem', 'Context API & Reducers', 'React Router v7', 'Vite Bundler & Performance', 'Custom Hooks Pattern'],
                        'documents' => [
                            [
                                'id' => 2021,
                                'title' => 'React 19 Architecture & State Patterns Handbook',
                                'description' => 'Complete manual on hooks, performance optimizations, and Context architecture.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '3.5 MB'
                            ]
                        ],
                        'videos' => [
                            [
                                'id' => 2021,
                                'title' => 'React 19 Masterclass & State Architecture',
                                'description' => 'Building production web applications with React 19, hooks, and Context.',
                                'duration' => '54:20',
                                'video_url' => 'https://www.youtube.com/watch?v=w7ejDZ8SWv8',
                                'thumbnail_url' => 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=60'
                            ]
                        ],
                        'documents_count' => 1,
                        'videos_count' => 1,
                        'color' => 'cyan',
                    ],
                    [
                        'id' => 203,
                        'name' => 'Responsive UI & Glassmorphism Styling',
                        'slug' => 'modern-ui-ux',
                        'short_description' => 'Mobile-first layout design, animations, dark mode themes, and CSS grids.',
                        'description' => "Craft pixel-perfect, accessible user interfaces. Master CSS Grid, Flexbox, keyframe animations, glassmorphism card styling, responsive layouts, and cohesive color palettes.",
                        'important_points' => [
                            'Mobile-first responsive design breakpoints.',
                            'Modern CSS backdrop-filter glassmorphism aesthetics.',
                            'Fluid typography with CSS clamp() functions.',
                            'Micro-interactions, hover-lifts, and accessible contrast ratios.'
                        ],
                        'examples_notes' => ".glass-card {\n  background: rgba(255, 255, 255, 0.85);\n  backdrop-filter: blur(12px);\n  border: 1px solid rgba(255, 255, 255, 0.3);\n  border-radius: 16px;\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);\n}",
                        'topics' => ['CSS Grid & Flexbox', 'Bootstrap 5 Customization', 'Keyframe Animations', 'Accessible Web Design', 'Glassmorphism Aesthetics'],
                        'documents' => [
                            [
                                'id' => 2031,
                                'title' => 'Modern UI/UX Design System Guide',
                                'description' => 'Reference on typography scales, color palettes, and glassmorphism styling.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '1.9 MB'
                            ]
                        ],
                        'videos' => [
                            [
                                'id' => 2031,
                                'title' => 'CSS Grid, Flexbox & Modern UI Aesthetics',
                                'description' => 'Building responsive card layouts and modern navigation bars.',
                                'duration' => '28:45',
                                'video_url' => 'https://www.youtube.com/watch?v=rg7Fvvl3taU',
                                'thumbnail_url' => 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=60'
                            ]
                        ],
                        'documents_count' => 1,
                        'videos_count' => 1,
                        'color' => 'teal',
                    ],
                ],
            ],
            [
                'slug' => 'ai',
                'title' => 'Machine Learning & Applied AI',
                'badge' => 'Cutting Edge',
                'color' => '#8b5cf6',
                'icon' => 'bi-cpu-fill',
                'description' => 'From mathematics & NumPy to PyTorch neural networks, computer vision, NLP, and model production deployment.',
                'skills' => ['PyTorch', 'Scikit-Learn', 'Pandas', 'Computer Vision', 'Transformers', 'EDA'],
                'duration' => '14 Weeks',
                'level' => 'Intermediate',
                'price' => 599,
                'sort_order' => 3,
                'is_active' => true,
                'curriculum_modules' => [
                    [
                        'id' => 301,
                        'name' => 'Data Science Foundations (NumPy & Pandas)',
                        'slug' => 'data-foundations',
                        'short_description' => 'Exploratory data analysis, statistical modeling, data cleaning, and feature engineering.',
                        'description' => "Work with large scale data. Learn NumPy array vectorization, Pandas DataFrame manipulation, exploratory data analysis (EDA), data cleaning, and statistical visualizations.",
                        'important_points' => [
                            'Vectorized array computation vs iterative loops.',
                            'Data imputation, outlier detection, and feature transformation.',
                            'Statistical hypothesis testing and distributions.',
                            'Data visualization with Matplotlib and Seaborn.'
                        ],
                        'examples_notes' => "import numpy as np\nimport pandas as pd\n\ndef clean_and_normalize(df: pd.DataFrame) -> pd.DataFrame:\n    df = df.dropna(subset=['target'])\n    numeric_cols = df.select_dtypes(include=[np.number]).columns\n    df[numeric_cols] = (df[numeric_cols] - df[numeric_cols].mean()) / df[numeric_cols].std()\n    return df",
                        'topics' => ['NumPy Vectorization', 'Pandas DataFrame Manipulation', 'Matplotlib & Seaborn', 'Data Preprocessing', 'Feature Engineering'],
                        'documents' => [
                            [
                                'id' => 3011,
                                'title' => 'Data Science & NumPy / Pandas Reference Handbook',
                                'description' => 'Formulas, vectorized transforms, and data cleaning cheat sheets.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '2.7 MB'
                            ]
                        ],
                        'videos' => [
                            [
                                'id' => 3011,
                                'title' => 'Data Analysis Masterclass with Pandas & NumPy',
                                'description' => 'End-to-end dataset cleaning, aggregation, and visualization.',
                                'duration' => '48:10',
                                'video_url' => 'https://www.youtube.com/watch?v=vmEHCJofslg',
                                'thumbnail_url' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=60'
                            ]
                        ],
                        'documents_count' => 1,
                        'videos_count' => 1,
                        'color' => 'purple',
                    ],
                    [
                        'id' => 302,
                        'name' => 'Supervised & Unsupervised Machine Learning',
                        'slug' => 'ml-algorithms',
                        'short_description' => 'Classification, Regression, Decision Trees, SVM, and Clustering algorithms.',
                        'description' => "Understand core machine learning theory and Scikit-Learn pipelines. Implement linear regression, logistic regression, decision trees, random forests, gradient boosting (XGBoost), and K-Means clustering.",
                        'important_points' => [
                            'Bias-Variance tradeoff and cross-validation techniques.',
                            'Hyperparameter tuning using GridSearchCV and Optuna.',
                            'Evaluation metrics: Precision, Recall, F1-Score, ROC-AUC.',
                            'Building repeatable pipelines with Scikit-Learn.'
                        ],
                        'examples_notes' => "from sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.ensemble import RandomForestClassifier\n\nmodel_pipeline = Pipeline([\n    ('scaler', StandardScaler()),\n    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))\n])",
                        'topics' => ['Linear & Logistic Regression', 'Random Forests & XGBoost', 'K-Means Clustering', 'Model Validation & Tuning', 'Scikit-Learn Pipelines'],
                        'documents' => [
                            [
                                'id' => 3021,
                                'title' => 'Machine Learning Algorithms & Metrics Handbook',
                                'description' => 'Mathematical foundations, cost functions, and validation metrics.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '3.8 MB'
                            ]
                        ],
                        'videos' => [
                            [
                                'id' => 3021,
                                'title' => 'Scikit-Learn ML Pipelines & Algorithm Tuning',
                                'description' => 'Building and evaluating classifiers on real-world datasets.',
                                'duration' => '50:00',
                                'video_url' => 'https://www.youtube.com/watch?v=0B5eIE_1vpU',
                                'thumbnail_url' => 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=60'
                            ]
                        ],
                        'documents_count' => 1,
                        'videos_count' => 1,
                        'color' => 'purple',
                    ],
                    [
                        'id' => 303,
                        'name' => 'Deep Learning & Neural Networks',
                        'slug' => 'deep-learning',
                        'short_description' => 'PyTorch architectures, CNNs for Computer Vision, and Transformer LLMs.',
                        'description' => "Construct deep neural networks in PyTorch. Learn tensor operations, automatic differentiation (autograd), Convolutional Neural Networks (CNN) for images, and Transformer architectures for natural language processing.",
                        'important_points' => [
                            'PyTorch autograd, forward and backward propagation cycles.',
                            'Convolutional layers, pooling, and residual blocks (ResNet).',
                            'Self-attention mechanisms and Transformer architectures.',
                            'Exporting models to ONNX and TorchScript for production serving.'
                        ],
                        'examples_notes' => "import torch\nimport torch.nn as nn\n\nclass DeepClassifier(nn.Module):\n    def __init__(self, in_features, num_classes):\n        super().__init__()\n        self.network = nn.Sequential(\n            nn.Linear(in_features, 128),\n            nn.ReLU(),\n            nn.Dropout(0.2),\n            nn.Linear(128, num_classes)\n        )\n    def forward(self, x):\n        return self.network(x)",
                        'topics' => ['PyTorch Tensors & Autograd', 'Convolutional Networks (CNN)', 'Transformers & Attention', 'Model Inference Deployment', 'Transfer Learning'],
                        'documents' => [
                            [
                                'id' => 3031,
                                'title' => 'PyTorch Deep Learning & Transformer Architecture Guide',
                                'description' => 'Tensor calculus, neural layer designs, and attention mechanisms.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '4.2 MB'
                            ]
                        ],
                        'videos' => [
                            [
                                'id' => 3031,
                                'title' => 'Deep Learning in PyTorch from Tensors to Transformers',
                                'description' => 'Complete neural network training and validation loop.',
                                'duration' => '58:30',
                                'video_url' => 'https://www.youtube.com/watch?v=V_xro1bcAuA',
                                'thumbnail_url' => 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=60'
                            ]
                        ],
                        'documents_count' => 1,
                        'videos_count' => 1,
                        'color' => 'violet',
                    ],
                ],
            ],
            [
                'slug' => 'database',
                'title' => 'Database Engineering & SQL Mastery',
                'badge' => 'Core Essential',
                'color' => '#10b981',
                'icon' => 'bi-database-fill-gear',
                'description' => 'Relational database schema modeling, ACID transactions, complex indexing strategies, and query performance tuning.',
                'skills' => ['MySQL', 'PostgreSQL', 'Window Functions', 'B-Tree Indexing', 'CTEs', 'Redis'],
                'duration' => '8 Weeks',
                'level' => 'Beginner to Pro',
                'price' => 399,
                'sort_order' => 4,
                'is_active' => true,
                'curriculum_modules' => [
                    [
                        'id' => 401,
                        'name' => 'Advanced SQL & Query Optimization',
                        'slug' => 'advanced-sql',
                        'short_description' => 'Complex joins, Window functions, Subqueries, CTEs, and execution plan analysis.',
                        'description' => "Write enterprise-grade SQL queries. Master window functions (ROW_NUMBER, RANK, DENSE_RANK, LEAD, LAG), recursive Common Table Expressions (CTEs), subqueries, and EXPLAIN ANALYZE execution plan optimizations.",
                        'important_points' => [
                            'Window analytical functions across partitions and ordering frames.',
                            'Hierarchical data traversal with recursive CTEs.',
                            'Analyzing EXPLAIN cost estimates, sequential scans vs index scans.',
                            'Eliminating N+1 queries and subquery bottlenecks.'
                        ],
                        'examples_notes' => "WITH RankedEnrollments AS (\n  SELECT \n    user_id,\n    purpose,\n    amount,\n    created_at,\n    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn\n  FROM payments\n  WHERE status = 'paid'\n)\nSELECT user_id, purpose, amount, created_at\nFROM RankedEnrollments\nWHERE rn = 1;",
                        'topics' => ['Window Functions (ROW_NUMBER, RANK)', 'Recursive CTEs', 'EXPLAIN Query Plans', 'Aggregation Pipelines', 'Query Optimization'],
                        'documents' => [
                            [
                                'id' => 4011,
                                'title' => 'Advanced SQL & Query Optimization Cheat Sheet',
                                'description' => 'Window functions, CTE templates, and EXPLAIN command analysis.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '2.0 MB'
                            ]
                        ],
                        'videos' => [
                            [
                                'id' => 4011,
                                'title' => 'Advanced SQL Window Functions & Performance Tuning',
                                'description' => 'Deep dive into analytical SQL queries and indexing strategies.',
                                'duration' => '40:15',
                                'video_url' => 'https://www.youtube.com/watch?v=HXV3zeRR3h4',
                                'thumbnail_url' => 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=60'
                            ]
                        ],
                        'documents_count' => 1,
                        'videos_count' => 1,
                        'color' => 'emerald',
                    ],
                    [
                        'id' => 402,
                        'name' => 'Schema Architecture & ACID Transactions',
                        'slug' => 'schema-design',
                        'short_description' => 'Normalization, foreign keys, database partitioning, and concurrent transactions.',
                        'description' => "Architect resilient database systems. Master 1NF to 3NF normalization, ACID transaction guarantees, concurrency isolation levels (Read Committed, Repeatable Read, Serializable), deadlocks, and table partitioning.",
                        'important_points' => [
                            'Relational database normalization and foreign key integrity.',
                            'ACID properties and multi-version concurrency control (MVCC).',
                            'Optimistic vs Pessimistic row locking (SELECT ... FOR UPDATE).',
                            'Horizontal partitioning and sharding architecture.'
                        ],
                        'examples_notes' => "START TRANSACTION;\nSELECT balance FROM accounts WHERE id = 101 FOR UPDATE;\nUPDATE accounts SET balance = balance - 500 WHERE id = 101;\nUPDATE accounts SET balance = balance + 500 WHERE id = 202;\nINSERT INTO transaction_logs (sender, receiver, amount) VALUES (101, 202, 500);\nCOMMIT;",
                        'topics' => ['3NF Normalization', 'ACID & Isolation Levels', 'Deadlock Prevention', 'Sharding & Replication', 'Table Partitioning'],
                        'documents' => [
                            [
                                'id' => 4021,
                                'title' => 'Database Schema Design & ACID Architecture Manual',
                                'description' => 'Design guidelines, normalization rules, and isolation levels.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '2.5 MB'
                            ]
                        ],
                        'videos' => [
                            [
                                'id' => 4021,
                                'title' => 'Relational Schema Design & ACID Transaction Concurrency',
                                'description' => 'Designing production database schemas with transactions and locks.',
                                'duration' => '35:20',
                                'video_url' => 'https://www.youtube.com/watch?v=7X8II6J-6mU',
                                'thumbnail_url' => 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=60'
                            ]
                        ],
                        'documents_count' => 1,
                        'videos_count' => 1,
                        'color' => 'emerald',
                    ],
                    [
                        'id' => 403,
                        'name' => 'High-Speed Caching with Redis',
                        'slug' => 'redis-caching',
                        'short_description' => 'In-memory data structures, caching layers, pub/sub, and performance tuning.',
                        'description' => "Accelerate database query times from 200ms to 2ms using Redis. Master string, hash, list, set, and sorted set primitives, cache-aside pattern, cache invalidation, rate limiting, and pub/sub messaging.",
                        'important_points' => [
                            'Cache-aside and write-through caching architectures.',
                            'Handling Cache Stampede, Cache Penetration, and Cache Avalanche.',
                            'Redis TTL expiration strategies and LRU memory policies.',
                            'Implementing distributed rate limiters and session stores.'
                        ],
                        'examples_notes' => "import redis\nimport json\n\nr = redis.Redis(host='localhost', port=6379, db=0)\n\ndef get_cached_pathway(slug: str):\n    key = f\"pathway:{slug}\"\n    cached = r.get(key)\n    if cached:\n        return json.loads(cached)\n    # Fallback to database query and cache result for 1 hour (3600s)\n    data = fetch_from_db(slug)\n    r.setex(key, 3600, json.dumps(data))\n    return data",
                        'topics' => ['Key-Value & Hashes', 'Cache Invalidation Strategies', 'Rate Limiting with Redis', 'Session Storage', 'Pub/Sub Messaging'],
                        'documents' => [
                            [
                                'id' => 4031,
                                'title' => 'Redis In-Memory Caching & Performance Architecture',
                                'description' => 'Data structures, caching strategies, and distributed locking handbook.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '1.7 MB'
                            ]
                        ],
                        'videos' => [
                            [
                                'id' => 4031,
                                'title' => 'High-Speed In-Memory Caching with Redis',
                                'description' => 'Speeding up web applications with Redis caching and rate limiters.',
                                'duration' => '30:45',
                                'video_url' => 'https://www.youtube.com/watch?v=jgpVdJB2sKQ',
                                'thumbnail_url' => 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=60'
                            ]
                        ],
                        'documents_count' => 1,
                        'videos_count' => 1,
                        'color' => 'teal',
                    ],
                ],
            ],
        ];
    }

    private function ensureSeeded(): void
    {
        if (CareerPathway::count() === 0) {
            foreach ($this->defaultPathways() as $p) {
                CareerPathway::create($p);
            }
        }
    }

    /**
     * GET /api/career-pathways
     * Public endpoint: Lists all active specialization pathways.
     */
    public function publicIndex()
    {
        $this->ensureSeeded();

        $pathways = CareerPathway::active()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $pathways]);
    }

    /**
     * GET /api/career-pathways/{idOrSlug}
     * Public endpoint: Fetch single pathway details.
     */
    public function publicShow($identifier)
    {
        $this->ensureSeeded();

        $pathway = is_numeric($identifier)
            ? CareerPathway::active()->where('id', $identifier)->first()
            : CareerPathway::active()->where('slug', $identifier)->first();

        if (!$pathway) {
            return response()->json(['message' => 'Career pathway not found.'], 404);
        }

        return response()->json(['data' => $pathway]);
    }

    /**
     * GET /api/career-pathways/my-access (auth:user)
     * Returns the list of unlocked pathway slugs for this authenticated student.
     */
    public function myAccess(Request $request)
    {
        $user = $request->attributes->get('auth_user');

        if (!$user) {
            return response()->json(['data' => []]);
        }

        $paymentRequiredSetting = AdminSetting::where('key', 'payment_required')->value('value');
        $paymentRequired = ($paymentRequiredSetting !== '0');

        // If global payment is OFF, all pathways are freely unlocked
        if (!$paymentRequired) {
            $allSlugsAndIds = CareerPathway::all()->flatMap(function ($p) {
                return array_filter([$p->slug, (string) $p->id]);
            })->unique()->values();
            return response()->json(['data' => $allSlugsAndIds]);
        }

        $unlockedSlugs = Payment::where('user_id', $user->id)
            ->where('status', 'paid')
            ->where('purpose', 'like', 'pathway_%')
            ->pluck('purpose')
            ->map(fn ($p) => substr($p, strlen('pathway_')))
            ->toArray();

        // Also, any pathway where is_locked is false is freely unlocked for everyone
        $unlockedPathways = CareerPathway::where('is_locked', false)->get();
        foreach ($unlockedPathways as $p) {
            if ($p->slug) {
                $unlockedSlugs[] = $p->slug;
            }
            $unlockedSlugs[] = (string) $p->id;
        }

        return response()->json(['data' => array_values(array_unique($unlockedSlugs))]);
    }

    /**
     * POST /api/career-pathways/{idOrSlug}/create-order (auth:user)
     * Creates a Razorpay order for this specific pathway at the admin-configured price.
     */
    public function createOrder(Request $request, $identifier)
    {
        $user = $request->attributes->get('auth_user');
        $this->ensureSeeded();

        $pathway = is_numeric($identifier)
            ? CareerPathway::where('id', $identifier)->first()
            : CareerPathway::where('slug', $identifier)->first();

        if (!$pathway) {
            return response()->json(['message' => 'Course pathway not found.'], 404);
        }

        $paymentRequiredSetting = AdminSetting::where('key', 'payment_required')->value('value');
        if ($paymentRequiredSetting === '0' || $pathway->is_locked === false) {
            return response()->json([
                'already_paid' => true,
                'message' => 'This career pathway is completely free. No payment required.',
            ]);
        }

        $purpose = 'pathway_' . $pathway->slug;

        // Check if already paid
        $alreadyPaid = Payment::where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->where('status', 'paid')
            ->exists();

        if ($alreadyPaid) {
            return response()->json([
                'already_paid' => true,
                'message' => 'You already have unlocked access to this pathway course.',
            ]);
        }

        $keyId = env('RAZORPAY_KEY_ID');
        $keySecret = env('RAZORPAY_KEY_SECRET');

        if (!$keyId || !$keySecret) {
            return response()->json([
                'message' => 'Payment gateway keys are not configured in backend .env.',
            ], 500);
        }

        $amountInPaise = ($pathway->price ?: 499) * 100;
        $currency = env('RAZORPAY_CURRENCY', 'INR');
        $receipt = 'pw_' . $pathway->slug . '_' . $user->id . '_' . time();

        // Check if there is an existing pending order
        $existing = Payment::where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->where('status', 'created')
            ->latest()
            ->first();

        if ($existing) {
            return response()->json([
                'key' => $keyId,
                'order_id' => $existing->razorpay_order_id,
                'amount' => $existing->amount,
                'currency' => $existing->currency,
                'name' => 'Online Class',
                'description' => 'Enroll in ' . $pathway->title,
                'prefill' => ['name' => $user->name, 'email' => $user->email],
            ]);
        }

        $response = Http::withBasicAuth($keyId, $keySecret)
            ->acceptJson()
            ->post('https://api.razorpay.com/v1/orders', [
                'amount' => $amountInPaise,
                'currency' => $currency,
                'receipt' => $receipt,
                'payment_capture' => 1,
                'notes' => [
                    'user_id' => (string) $user->id,
                    'purpose' => $purpose,
                    'pathway_id' => (string) $pathway->id,
                    'pathway_title' => $pathway->title,
                ],
            ]);

        if ($response->failed()) {
            Log::error('Razorpay pathway order creation failed', ['body' => $response->body()]);
            return response()->json(['message' => 'Could not create payment order.'], 502);
        }

        $order = $response->json();

        $payment = Payment::create([
            'user_id' => $user->id,
            'purpose' => $purpose,
            'razorpay_order_id' => $order['id'],
            'amount' => $order['amount'],
            'currency' => $order['currency'],
            'status' => 'created',
            'meta' => [
                'pathway_id' => $pathway->id,
                'pathway_title' => $pathway->title,
            ],
        ]);

        return response()->json([
            'key' => $keyId,
            'order_id' => $payment->razorpay_order_id,
            'amount' => $payment->amount,
            'currency' => $payment->currency,
            'name' => 'Online Class',
            'description' => 'Enroll in ' . $pathway->title,
            'prefill' => ['name' => $user->name, 'email' => $user->email],
        ], 201);
    }

    /**
     * POST /api/career-pathways/{idOrSlug}/verify-payment (auth:user)
     */
    public function verifyPayment(Request $request, $identifier)
    {
        $validated = $request->validate([
            'razorpay_order_id' => 'required|string',
            'razorpay_payment_id' => 'required|string',
            'razorpay_signature' => 'required|string',
        ]);

        $user = $request->attributes->get('auth_user');

        $payment = Payment::where('user_id', $user->id)
            ->where('razorpay_order_id', $validated['razorpay_order_id'])
            ->first();

        if (!$payment) {
            return response()->json(['message' => 'Payment record not found.'], 404);
        }

        if ($payment->status === 'paid') {
            return response()->json(['status' => 'paid', 'message' => 'Course pathway already unlocked.']);
        }

        $keySecret = env('RAZORPAY_KEY_SECRET');
        $expected = hash_hmac(
            'sha256',
            $validated['razorpay_order_id'] . '|' . $validated['razorpay_payment_id'],
            $keySecret
        );

        if (!hash_equals($expected, $validated['razorpay_signature'])) {
            // Row-locked so this can never race with the Razorpay webhook
            // (PaymentController::webhook) also touching the same payment
            // row -- whichever call gets here first wins, the other is a
            // safe no-op instead of double-processing the same order.
            DB::transaction(function () use ($payment) {
                $locked = Payment::whereKey($payment->id)->lockForUpdate()->first();
                if ($locked && $locked->status !== 'paid') {
                    $locked->update([
                        'status' => 'failed',
                        'meta' => array_merge($locked->meta ?? [], ['source' => 'verify', 'reason' => 'signature_mismatch']),
                    ]);
                }
            });

            return response()->json(['message' => 'Payment verification failed.'], 422);
        }

        DB::transaction(function () use ($payment, $validated) {
            $locked = Payment::whereKey($payment->id)->lockForUpdate()->first();
            if ($locked && $locked->status !== 'paid') {
                $locked->update([
                    'razorpay_payment_id' => $validated['razorpay_payment_id'],
                    'razorpay_signature' => $validated['razorpay_signature'],
                    'status' => 'paid',
                    'meta' => array_merge($locked->meta ?? [], ['source' => 'verify']),
                ]);
            }
        });

        return response()->json([
            'status' => 'paid',
            'message' => 'Course unlocked successfully! Full curriculum access is now active.',
        ]);
    }

    // =========================================================================
    // ADMIN ENDPOINTS (admin.auth)
    // =========================================================================

    /**
     * GET /api/admin/career-pathways
     */
    public function adminIndex()
    {
        $this->ensureSeeded();

        $pathways = CareerPathway::orderBy('sort_order')->orderBy('id')->get()->map(function ($p) {
            $purchaseCount = Payment::where('purpose', 'pathway_' . $p->slug)
                ->where('status', 'paid')
                ->count();

            $revenue = Payment::where('purpose', 'pathway_' . $p->slug)
                ->where('status', 'paid')
                ->sum('amount') / 100;

            $pArray = $p->toArray();
            $pArray['enrollments_count'] = $purchaseCount;
            $pArray['total_revenue'] = $revenue;
            return $pArray;
        });

        return response()->json(['data' => $pathways]);
    }

    /**
     * POST /api/admin/career-pathways
     */
    public function adminStore(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:career_pathways,slug',
            'badge' => 'nullable|string|max:100',
            'color' => 'nullable|string|max:50',
            'icon' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'skills' => 'nullable',
            'duration' => 'nullable|string|max:100',
            'level' => 'nullable|string|max:100',
            'price' => 'required|numeric|min:0',
            'curriculum_modules' => 'nullable',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'is_locked' => 'nullable|boolean',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        if (isset($validated['skills']) && is_string($validated['skills'])) {
            $validated['skills'] = json_decode($validated['skills'], true)
                ?: array_filter(array_map('trim', explode(',', $validated['skills'])));
        }

        if (isset($validated['curriculum_modules']) && is_string($validated['curriculum_modules'])) {
            $validated['curriculum_modules'] = json_decode($validated['curriculum_modules'], true);
        }

        $validated['price'] = (int) $validated['price'];
        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['is_locked'] = $request->boolean('is_locked', true);

        $pathway = CareerPathway::create($validated);

        return response()->json(['data' => $pathway], 201);
    }

    /**
     * PUT /api/admin/career-pathways/{id}
     */
    public function adminUpdate(Request $request, $id)
    {
        $pathway = CareerPathway::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:career_pathways,slug,' . $pathway->id,
            'badge' => 'nullable|string|max:100',
            'color' => 'nullable|string|max:50',
            'icon' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'skills' => 'nullable',
            'duration' => 'nullable|string|max:100',
            'level' => 'nullable|string|max:100',
            'price' => 'sometimes|required|numeric|min:0',
            'curriculum_modules' => 'nullable',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'is_locked' => 'nullable|boolean',
        ]);

        if (isset($validated['skills']) && is_string($validated['skills'])) {
            $validated['skills'] = json_decode($validated['skills'], true)
                ?: array_filter(array_map('trim', explode(',', $validated['skills'])));
        }

        if (isset($validated['curriculum_modules']) && is_string($validated['curriculum_modules'])) {
            $validated['curriculum_modules'] = json_decode($validated['curriculum_modules'], true);
        }

        if (isset($validated['price'])) {
            $validated['price'] = (int) $validated['price'];
        }

        if ($request->has('is_active')) {
            $validated['is_active'] = $request->boolean('is_active');
        }

        if ($request->has('is_locked')) {
            $validated['is_locked'] = $request->boolean('is_locked');
        }

        $pathway->update($validated);

        return response()->json(['data' => $pathway]);
    }

    /**
     * PATCH /api/admin/career-pathways/{id}/lock
     */
    public function adminToggleLock(Request $request, $id)
    {
        $pathway = CareerPathway::findOrFail($id);

        $validated = $request->validate([
            'is_locked' => 'required|boolean',
        ]);

        $pathway->update([
            'is_locked' => (bool) $validated['is_locked'],
        ]);

        $statusStr = $pathway->is_locked ? 'locked (payment required)' : 'unlocked (free access)';

        return response()->json([
            'data' => $pathway,
            'message' => "Career Pathway {$pathway->title} is now {$statusStr}.",
        ]);
    }

    /**
     * PATCH /api/admin/career-pathways/{id}/price
     */
    public function adminUpdatePrice(Request $request, $id)
    {
        $pathway = CareerPathway::findOrFail($id);

        $validated = $request->validate([
            'price' => 'required|numeric|min:0',
        ]);

        $pathway->update([
            'price' => (int) $validated['price'],
        ]);

        return response()->json([
            'data' => $pathway,
            'message' => "Enrollment price for {$pathway->title} updated to ₹{$pathway->price} successfully.",
        ]);
    }

    /**
     * DELETE /api/admin/career-pathways/{id}
     */
    public function adminDestroy($id)
    {
        $pathway = CareerPathway::findOrFail($id);
        $pathway->delete();

        return response()->json(['message' => 'Career pathway deleted successfully.']);
    }
}
