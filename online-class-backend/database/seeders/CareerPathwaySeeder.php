<?php

namespace Database\Seeders;

use App\Models\CareerPathway;
use Illuminate\Database\Seeder;

class CareerPathwaySeeder extends Seeder
{
    public function run(): void
    {
        $pathways = [
            [
                'slug' => 'backend',
                'title' => 'Backend & Systems Architecture',
                'badge' => 'High Demand',
                'color' => '#3b82f6',
                'icon' => 'bi-terminal-fill',
                'description' => 'Master Python 3.12, Flask, REST APIs, microservices, authentication security, and scalable server architecture.',
                'skills' => ['Python 3.12', 'Flask', 'SQLAlchemy', 'JWT Auth', 'Docker', 'PostgreSQL'],
                'duration' => '12 Weeks',
                'level' => 'Beginner to Advanced',
                'price' => 499,
                'sort_order' => 1,
                'is_active' => true,
                'curriculum_modules' => [
                    [
                        'id' => 101,
                        'name' => 'Python Core Programming & Memory Architecture',
                        'short_description' => 'Fundamentals, OOP, functional paradigms, memory management and decorators.',
                        'description' => "Comprehensive deep dive into Python 3.12 internals, data models, object-oriented design patterns, and asynchronous execution.",
                        'topics' => ['Data Structures & Collections', 'OOP & Magic Methods', 'Context Managers & Generators', 'Decorators & Metaclasses'],
                        'important_points' => [
                            'Understand Python memory management and garbage collection mechanisms',
                            'Master closures, decorators, and high-order functional concepts',
                            'Build resilient exception handling pipelines'
                        ],
                        'examples_notes' => "def logged(func):\n    def wrapper(*args, **kwargs):\n        print(f\"Executing {func.__name__}\")\n        return func(*args, **kwargs)\n    return wrapper",
                        'documents' => [
                            [
                                'id' => 1001,
                                'title' => 'Python 3.12 Architecture & Data Structures Handbook',
                                'description' => 'In-depth reference manual for core Python programming and memory optimization.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '2.4 MB'
                            ],
                            [
                                'id' => 1002,
                                'title' => 'OOP Design Patterns in Modern Python',
                                'description' => 'Creational, Structural, and Behavioral patterns implemented in Python.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '1.8 MB'
                            ]
                        ],
                        'videos' => [
                            [
                                'id' => 2001,
                                'title' => 'Python Memory Management & GIL Explained',
                                'description' => 'Walkthrough on how CPython handles allocations, reference counting, and thread execution.',
                                'duration' => '28:40',
                                'video_url' => 'https://www.youtube.com/watch?v=rfscVS0vtbw',
                                'thumbnail_url' => 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=60'
                            ]
                        ],
                        'documents_count' => 2,
                        'videos_count' => 1,
                        'color' => 'primary',
                    ],
                    [
                        'id' => 102,
                        'name' => 'Flask & REST API Microservices',
                        'short_description' => 'Blueprints, SQLAlchemy ORM, migrations, middleware, and JWT authentication.',
                        'description' => "Construct enterprise RESTful APIs using Flask application factories, declarative SQLAlchemy ORM models, and token-based RBAC.",
                        'topics' => ['Application Factory Pattern', 'SQLAlchemy Relationships', 'Marshmallow Schemas', 'JWT Tokens & RBAC'],
                        'important_points' => [
                            'Structured separation of concerns using Flask Blueprints',
                            'Automated migrations with Alembic and database transactions',
                            'Role-based access control and token revocation security'
                        ],
                        'examples_notes' => "from flask import Blueprint, jsonify\napi_bp = Blueprint('api', __name__)\n\n@api_bp.route('/health')\ndef health():\n    return jsonify(status='healthy', v='1.0')",
                        'documents' => [
                            [
                                'id' => 1003,
                                'title' => 'Flask RESTful Microservices Architecture Guide',
                                'description' => 'Complete blueprint for scalable API service design.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '3.1 MB'
                            ]
                        ],
                        'videos' => [
                            [
                                'id' => 2002,
                                'title' => 'Building Production REST APIs with Flask & SQLAlchemy',
                                'description' => 'Complete step-by-step video lecture on blueprint structuring and ORM relations.',
                                'duration' => '34:15',
                                'video_url' => 'https://www.youtube.com/watch?v=rfscVS0vtbw',
                                'thumbnail_url' => 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=60'
                            ]
                        ],
                        'documents_count' => 1,
                        'videos_count' => 1,
                        'color' => 'warning',
                    ]
                ]
            ],
            [
                'slug' => 'frontend',
                'title' => 'Modern Frontend & UI/UX Engineering',
                'badge' => 'Industry Standard',
                'color' => '#06b6d4',
                'icon' => 'bi-window-sidebar',
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
                        'short_description' => 'Asynchronous JavaScript, Event Loop, Closures, DOM, and Fetch API.',
                        'description' => "Master async/await paradigms, microtask queues, prototypal inheritance, and ES Modules.",
                        'topics' => ['Async/Await & Promises', 'Closures & Scope Chain', 'ES Modules', 'Event Bubbling & Capture'],
                        'important_points' => [
                            'Event Loop mechanics and call stack vs macro/micro queues',
                            'Functional programming primitives: map, filter, reduce, currying',
                            'Modern DOM manipulation and custom event handling'
                        ],
                        'examples_notes' => "const fetchData = async (url) => {\n  const res = await fetch(url);\n  if (!res.ok) throw new Error(`HTTP ${res.status}`);\n  return res.json();\n};",
                        'documents' => [
                            [
                                'id' => 2001,
                                'title' => 'JavaScript ES6+ Language Specification Handbook',
                                'description' => 'Complete language guide with visual memory diagrams.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '2.9 MB'
                            ]
                        ],
                        'videos' => [
                            [
                                'id' => 2003,
                                'title' => 'JavaScript Event Loop & Async Architecture',
                                'description' => 'Visualizing how V8 executes asynchronous code and handles promises.',
                                'duration' => '26:10',
                                'video_url' => 'https://www.youtube.com/watch?v=8aGhZQkoFbQ',
                                'thumbnail_url' => 'https://images.unsplash.com/photo-1581291518655-9523c932edcf?w=600&auto=format&fit=crop&q=60'
                            ]
                        ],
                        'documents_count' => 1,
                        'videos_count' => 1,
                        'color' => 'info',
                    ]
                ]
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
                        'short_description' => 'Exploratory data analysis, statistical modeling, data cleaning, and feature engineering.',
                        'description' => "Vectorized mathematics with NumPy, high-performance DataFrame operations with Pandas, and data visualization.",
                        'topics' => ['NumPy Vectorization', 'Pandas DataFrame Manipulation', 'Matplotlib & Seaborn', 'Data Preprocessing'],
                        'important_points' => [
                            'Avoid slow Python loops with broadcasting and vectorized array math',
                            'Handle missing data, outliers, and normalization cleanly',
                            'Generate publication-quality statistical visualizations'
                        ],
                        'examples_notes' => "import numpy as np\nimport pandas as pd\n\ndf = pd.DataFrame({'val': np.random.randn(100)})\ndf['rolling_avg'] = df['val'].rolling(window=5).mean()",
                        'documents' => [
                            [
                                'id' => 3001,
                                'title' => 'Applied Data Science & Statistical Analysis Manual',
                                'description' => 'Comprehensive manual for Pandas, NumPy, and statistical transforms.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '3.5 MB'
                            ]
                        ],
                        'videos' => [
                            [
                                'id' => 3002,
                                'title' => 'Exploratory Data Analysis with Pandas & Seaborn',
                                'description' => 'Hands-on session on feature engineering and correlation heatmaps.',
                                'duration' => '31:50',
                                'video_url' => 'https://www.youtube.com/watch?v=rfscVS0vtbw',
                                'thumbnail_url' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=60'
                            ]
                        ],
                        'documents_count' => 1,
                        'videos_count' => 1,
                        'color' => 'purple',
                    ]
                ]
            ],
            [
                'slug' => 'database',
                'title' => 'Database Engineering & SQL Mastery',
                'badge' => 'Core Essential',
                'color' => '#10b981',
                'icon' => 'bi-database-fill',
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
                        'short_description' => 'Complex joins, Window functions, Subqueries, CTEs, and execution plan analysis.',
                        'description' => "Analyze query performance with EXPLAIN ANALYZE, build recursive CTEs, and design efficient B-Tree composite indexes.",
                        'topics' => ['Window Functions (ROW_NUMBER, RANK)', 'Recursive CTEs', 'EXPLAIN Query Plans', 'Aggregation Pipelines'],
                        'important_points' => [
                            'Master partitioning and framing with OVER (PARTITION BY ...)',
                            'Identify table scans and optimize indexes for composite filters',
                            'ACID isolation levels and lock contention prevention'
                        ],
                        'examples_notes' => "WITH RankedOrders AS (\n  SELECT user_id, amount, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn\n  FROM orders\n)\nSELECT * FROM RankedOrders WHERE rn = 1;",
                        'documents' => [
                            [
                                'id' => 4001,
                                'title' => 'High-Performance SQL & Index Tuning Playbook',
                                'description' => 'Query execution plan analysis and index design strategies.',
                                'file_type' => 'PDF',
                                'file_url' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                                'formatted_size' => '2.2 MB'
                            ]
                        ],
                        'videos' => [
                            [
                                'id' => 4002,
                                'title' => 'Database Indexing Deep Dive: B-Trees & Query Optimization',
                                'description' => 'Step-by-step demonstration of slow queries before and after index tuning.',
                                'duration' => '29:45',
                                'video_url' => 'https://www.youtube.com/watch?v=rfscVS0vtbw',
                                'thumbnail_url' => 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=60'
                            ]
                        ],
                        'documents_count' => 1,
                        'videos_count' => 1,
                        'color' => 'emerald',
                    ]
                ]
            ]
        ];

        foreach ($pathways as $data) {
            CareerPathway::updateOrCreate(
                ['slug' => $data['slug']],
                $data
            );
        }
    }
}
