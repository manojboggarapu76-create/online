<?php

namespace Database\Seeders;

use App\Models\Concept;
use App\Models\ConceptDocument;
use App\Models\ConceptVideo;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class ConceptSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure storage directories exist
        Storage::disk('public')->makeDirectory('concepts');
        Storage::disk('public')->makeDirectory('concept-documents');
        Storage::disk('public')->makeDirectory('concept-videos');
        Storage::disk('public')->makeDirectory('concept-thumbnails');

        // Create sample placeholder files if not present
        $samplePdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n185\n%%EOF";
        
        $docPath = 'concept-documents/sample_guide.pdf';
        if (!Storage::disk('public')->exists($docPath)) {
            Storage::disk('public')->put($docPath, $samplePdfContent);
        }

        $concepts = [
            [
                'name' => 'Python',
                'slug' => 'python',
                'short_description' => 'Master Python programming from core syntax, data structures, OOP to automation & backend engineering.',
                'description' => "Python is a powerful, high-level, general-purpose programming language known for its clear syntax and immense versatility. In this curriculum, students learn everything from variables and control flow to object-oriented programming, data structures, algorithmic thinking, and modern software design patterns.\n\nPython powers machine learning, web development, data science, and cloud automation across major technology leaders worldwide.",
                'important_points' => [
                    'Dynamic typing and intuitive readability with clean indentation.',
                    'Extensive standard library (batteries-included philosophy).',
                    'Object-Oriented, Functional, and Procedural programming paradigms.',
                    'Powerful package ecosystem via PyPI and pip package manager.',
                    'Memory management and garbage collection handled automatically.',
                ],
                'topics_covered' => [
                    'Python Syntax, Variables & Primitive Data Types',
                    'Lists, Tuples, Sets, and Dictionaries deep-dive',
                    'Control Flow: Loops, Conditionals & List Comprehensions',
                    'Functions, *args, **kwargs, Scope & Closures',
                    'Object-Oriented Programming (Classes, Inheritance, Polymorphism)',
                    'File I/O, Exception Handling & Custom Exceptions',
                    'Modules, Packages, and Virtual Environments (venv)',
                    'Working with JSON, REST APIs, and HTTP Requests',
                ],
                'examples_notes' => "# Python OOP Example\nclass Student:\n    def __init__(self, name: str, track: str):\n        self.name = name\n        self.track = track\n        self.skills = []\n\n    def add_skill(self, skill: str) -> None:\n        self.skills.append(skill)\n\nstudent = Student('Alex', 'Backend Engineering')\nstudent.add_skill('Python 3.12')\nprint(f'{student.name} is learning {student.skills}')",
                'icon_class' => 'bi-filetype-py',
                'color_scheme' => 'blue',
                'rating' => 5.0,
                'sort_order' => 1,
                'is_active' => true,
                'documents' => [
                    [
                        'title' => 'Python Basics Complete Handbook',
                        'description' => 'Comprehensive starter guide covering syntax, operators, variables, data types, and standard library basics.',
                        'file_path' => $docPath,
                        'file_name' => 'Python_Basics_Handbook.pdf',
                        'file_type' => 'pdf',
                        'file_size' => 1420000,
                    ],
                    [
                        'title' => 'Python Variables & Data Structures Notes',
                        'description' => 'In-depth notes on Lists, Dictionaries, Sets, Tuples, and memory representation with code diagrams.',
                        'file_path' => $docPath,
                        'file_name' => 'Python_Variables_and_Data_Structures.pdf',
                        'file_type' => 'pdf',
                        'file_size' => 2180000,
                    ],
                    [
                        'title' => 'Python OOP Architecture & Design Patterns',
                        'description' => 'Class diagrams, inheritance hierarchies, abstract base classes, decorators, and design patterns in Python.',
                        'file_path' => $docPath,
                        'file_name' => 'Python_OOP_Architecture.pdf',
                        'file_type' => 'pdf',
                        'file_size' => 3450000,
                    ],
                    [
                        'title' => 'Python Technical Interview Questions & Solutions',
                        'description' => '100+ curated Python interview questions with step-by-step solutions, time complexities, and best practices.',
                        'file_path' => $docPath,
                        'file_name' => 'Python_Interview_Mastery.pdf',
                        'file_type' => 'pdf',
                        'file_size' => 4100000,
                    ],
                ],
                'videos' => [
                    [
                        'title' => 'Python Introduction & Environment Setup',
                        'description' => 'Get started with Python 3, setting up VS Code, virtual environments, and writing your first scripts.',
                        'video_url' => 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
                        'duration' => '18:45',
                    ],
                    [
                        'title' => 'Variables, Data Types & Operations',
                        'description' => 'Learn how Python stores integers, floats, strings, booleans, and perform mathematical & logical operations.',
                        'video_url' => 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
                        'duration' => '24:10',
                    ],
                    [
                        'title' => 'Functions, Scope & Lambda Expressions',
                        'description' => 'Deep dive into parameter passing, return values, default arguments, closures, and higher-order functions.',
                        'video_url' => 'https://www.youtube.com/watch?v=9Os0o3wzS_I',
                        'duration' => '32:15',
                    ],
                    [
                        'title' => 'Object Oriented Programming (OOP) in Depth',
                        'description' => 'Building modular software with classes, inheritance, dunder methods, encapsulation, and composition.',
                        'video_url' => 'https://www.youtube.com/watch?v=JeznW_7DlB0',
                        'duration' => '45:00',
                    ],
                ],
            ],
            [
                'name' => 'Flask',
                'slug' => 'flask',
                'short_description' => 'Build robust microservices, RESTful APIs, and scalable web applications using the Python Flask framework.',
                'description' => "Flask is a lightweight WSGI web application framework designed to make getting started quick and easy, with the ability to scale up to complex applications. It gives developers total control over database selection, templating engines, authentication protocols, and API architecture.\n\nStudents learn routing, Jinja2 templating, SQLAlchemy ORM integration, JWT authentication, blueprint architecture, and deployment.",
                'important_points' => [
                    'Micro-framework philosophy — minimal core with powerful extension capabilities.',
                    'Built-in development server and interactive debugger.',
                    'Seamless integration with SQLAlchemy, Marshmallow, and Celery.',
                    'Jinja2 templating engine with template inheritance and filters.',
                    'RESTful API development with Flask-RESTful and Flask-Smorest.',
                ],
                'topics_covered' => [
                    'Flask Setup, Application Factory Pattern & Configuration',
                    'URL Routing, View Functions & Request/Response Objects',
                    'Jinja2 HTML Templating, Macros & Static Asset Management',
                    'Database Integration with Flask-SQLAlchemy & Migrations (Flask-Migrate)',
                    'User Authentication, Sessions & JWT Tokens',
                    'Building RESTful APIs with JSON serialization',
                    'Modular App Architecture using Flask Blueprints',
                    'Production Deployment with Gunicorn, Nginx & Docker',
                ],
                'examples_notes' => "from flask import Flask, jsonify, request\n\napp = Flask(__name__)\n\n@app.route('/api/greet', methods=['POST'])\ndef greet():\n    data = request.get_json() or {}\n    name = data.get('name', 'Student')\n    return jsonify({'message': f'Welcome to Flask, {name}!', 'status': 'success'})\n\nif __name__ == '__main__':\n    app.run(debug=True)",
                'icon_class' => 'bi-code-slash',
                'color_scheme' => 'amber',
                'rating' => 5.0,
                'sort_order' => 2,
                'is_active' => true,
                'documents' => [
                    [
                        'title' => 'Flask Framework Architecture Guide',
                        'description' => 'Complete blueprint of Flask request lifecycle, context locals, app factory patterns, and WSGI middleware.',
                        'file_path' => $docPath,
                        'file_name' => 'Flask_Architecture_Guide.pdf',
                        'file_type' => 'pdf',
                        'file_size' => 1950000,
                    ],
                    [
                        'title' => 'Flask SQLAlchemy & ORM Modeling Notes',
                        'description' => 'Step-by-step relational database modeling, one-to-many & many-to-many relationships, and query optimization.',
                        'file_path' => $docPath,
                        'file_name' => 'Flask_SQLAlchemy_Mastery.pdf',
                        'file_type' => 'pdf',
                        'file_size' => 2600000,
                    ],
                    [
                        'title' => 'Flask REST API & JWT Security Blueprint',
                        'description' => 'Production API security, token refresh cycles, role-based access control (RBAC), and CORS configuration.',
                        'file_path' => $docPath,
                        'file_name' => 'Flask_REST_API_Security.pdf',
                        'file_type' => 'pdf',
                        'file_size' => 3100000,
                    ],
                ],
                'videos' => [
                    [
                        'title' => 'Flask Fast Track: From Zero to First Route',
                        'description' => 'Understanding Flask fundamentals, routing rules, HTTP verbs, and rendering dynamic responses.',
                        'video_url' => 'https://www.youtube.com/watch?v=Z1RJmh_OPOk',
                        'duration' => '22:30',
                    ],
                    [
                        'title' => 'SQLAlchemy ORM & Database Relationships in Flask',
                        'description' => 'Connecting SQLite/MySQL to Flask, running Alembic migrations, and managing CRUD records efficiently.',
                        'video_url' => 'https://www.youtube.com/watch?v=dam0GPOAvVI',
                        'duration' => '38:40',
                    ],
                    [
                        'title' => 'Building & Securing Production REST APIs',
                        'description' => 'Creating robust JSON endpoints, token authentication, error handling middleware, and Postman testing.',
                        'video_url' => 'https://www.youtube.com/watch?v=GMppyAPbLYk',
                        'duration' => '41:15',
                    ],
                ],
            ],
            [
                'name' => 'Frontend',
                'slug' => 'frontend',
                'short_description' => 'Modern UI/UX engineering with JavaScript (ES6+), React, Vite, Tailwind/Bootstrap, and state management.',
                'description' => "Frontend web development powers the visual, interactive, and client-side experience of every modern application. This track trains students in HTML5 semantics, responsive CSS3/Bootstrap layouts, modern ECMAScript features (ES6+), React components, hooks, state management, and API integration.\n\nBuild responsive, accessible, high-performance web user interfaces with delightful micro-interactions.",
                'important_points' => [
                    'Component-driven UI architecture with declarative React & JSX.',
                    'Modern Async JavaScript (Promises, async/await, Fetch & Axios).',
                    'Single Page Application (SPA) routing with React Router 7.',
                    'State management via Hooks (useState, useEffect, useContext, useReducer).',
                    'Mobile-first responsive design, flexbox, CSS Grid & CSS variables.',
                ],
                'topics_covered' => [
                    'Modern JavaScript (ES6+): Destructuring, Spread/Rest, Modules, Arrow functions',
                    'DOM Manipulation, Event Bubbling & Custom Event Handling',
                    'React Core: Components, Props, JSX & State lifecycle',
                    'React Hooks Ecosystem: useState, useEffect, useMemo, useCallback',
                    'Client-side Routing & Protected Routes with React Router',
                    'HTTP & REST API Integration with Axios and Error Boundaries',
                    'CSS Modern Styling: Variables, Animations, Glassmorphism & Responsive Grids',
                    'Build Tools: Vite, NPM, Linting, and Webpack concepts',
                ],
                'examples_notes' => "import React, { useState, useEffect } from 'react';\n\nexport default function Counter() {\n  const [count, setCount] = useState(0);\n  \n  return (\n    <div className='card p-4 text-center'>\n      <h3>Interactive React State</h3>\n      <p className='fs-4 fw-bold text-primary'>{count}</p>\n      <div className='d-flex gap-2 justify-content-center'>\n        <button className='btn btn-primary' onClick={() => setCount(c => c + 1)}>Increment</button>\n        <button className='btn btn-outline-secondary' onClick={() => setCount(0)}>Reset</button>\n      </div>\n    </div>\n  );\n}",
                'icon_class' => 'bi-filetype-jsx',
                'color_scheme' => 'cyan',
                'rating' => 5.0,
                'sort_order' => 3,
                'is_active' => true,
                'documents' => [
                    [
                        'title' => 'Modern JavaScript (ES6+) Complete Cheatsheet',
                        'description' => 'Essential syntax guide for arrow functions, promises, async/await, array methods (map, filter, reduce), and closures.',
                        'file_path' => $docPath,
                        'file_name' => 'Modern_JS_ES6_Cheatsheet.pdf',
                        'file_type' => 'pdf',
                        'file_size' => 1780000,
                    ],
                    [
                        'title' => 'React Component & Hooks Masterclass Notes',
                        'description' => 'Deep dive into React 19 architecture, useEffect dependency rules, custom hooks, and context state trees.',
                        'file_path' => $docPath,
                        'file_name' => 'React_Hooks_Masterclass.pdf',
                        'file_type' => 'pdf',
                        'file_size' => 2890000,
                    ],
                    [
                        'title' => 'Responsive UI/UX & CSS Layout Guide',
                        'description' => 'Master CSS Flexbox, Grid systems, media queries, mobile-first design, glassmorphism, and color harmony.',
                        'file_path' => $docPath,
                        'file_name' => 'Responsive_UIUX_CSS_Guide.pdf',
                        'file_type' => 'pdf',
                        'file_size' => 3200000,
                    ],
                ],
                'videos' => [
                    [
                        'title' => 'Modern JavaScript ES6+ Crash Course',
                        'description' => 'Everything you need to know in modern JavaScript before mastering React and frontend frameworks.',
                        'video_url' => 'https://www.youtube.com/watch?v=hdI2bqOjy3c',
                        'duration' => '29:50',
                    ],
                    [
                        'title' => 'React 19 Core Concepts & Component Architecture',
                        'description' => 'Building reusable UI components, managing state, handling user interactions, and styling.',
                        'video_url' => 'https://www.youtube.com/watch?v=bMknfKXIFA8',
                        'duration' => '48:20',
                    ],
                    [
                        'title' => 'React Router & API Integration with Axios',
                        'description' => 'Single page navigation, URL parameters, query strings, and communicating with backend endpoints.',
                        'video_url' => 'https://www.youtube.com/watch?v=Law7wfdg_ls',
                        'duration' => '36:10',
                    ],
                ],
            ],
            [
                'name' => 'Machine Learning',
                'slug' => 'machine-learning',
                'short_description' => 'Supervised & unsupervised learning, deep neural networks, computer vision, and predictive AI modeling.',
                'description' => "Machine Learning and Artificial Intelligence empower modern systems to learn from empirical data, detect complex patterns, and make intelligent decisions. This curriculum covers exploratory data analysis with Pandas and NumPy, classical machine learning algorithms with Scikit-Learn, and Deep Learning with PyTorch.",
                'important_points' => [
                    'Data preprocessing, feature engineering & cross-validation.',
                    'Regression, Classification, Decision Trees, Random Forests, & XGBoost.',
                    'Unsupervised clustering with K-Means and dimensionality reduction via PCA.',
                    'Deep Neural Networks, Convolutional Neural Networks (CNNs), & Transformers.',
                    'Model deployment using FastAPI and ONNX runtime.',
                ],
                'topics_covered' => [
                    'NumPy & Pandas for High-Performance Scientific Computing',
                    'Exploratory Data Analysis (EDA) & Data Visualization (Matplotlib, Seaborn)',
                    'Linear & Logistic Regression with Gradient Descent Optimization',
                    'Tree-based Ensembles: Random Forest, Gradient Boosting, LightGBM',
                    'Neural Network Foundations & Backpropagation',
                    'Introduction to Computer Vision & Natural Language Processing (NLP)',
                    'Model Evaluation Metrics (ROC-AUC, Precision, Recall, F1-Score)',
                ],
                'examples_notes' => "import numpy as np\nfrom sklearn.ensemble import RandomForestClassifier\nfrom sklearn.model_selection import train_test_split\n\n# Train predictive classifier\nX = np.random.randn(1000, 10)\ny = (X[:, 0] + X[:, 1] > 0).astype(int)\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)\nclf = RandomForestClassifier(n_estimators=100)\nclf.fit(X_train, y_train)\nprint(f'Test Accuracy: {clf.score(X_test, y_test):.2%}')",
                'icon_class' => 'bi-cpu',
                'color_scheme' => 'purple',
                'rating' => 5.0,
                'sort_order' => 4,
                'is_active' => true,
                'documents' => [
                    [
                        'title' => 'Applied Machine Learning Handbook',
                        'description' => 'Mathematics, linear algebra, statistics, and machine learning algorithm implementations from scratch.',
                        'file_path' => $docPath,
                        'file_name' => 'Applied_ML_Handbook.pdf',
                        'file_type' => 'pdf',
                        'file_size' => 4500000,
                    ],
                    [
                        'title' => 'Deep Learning & Neural Networks Notes',
                        'description' => 'PyTorch architecture, tensor computations, autograd, forward/backward propagation, and activation functions.',
                        'file_path' => $docPath,
                        'file_name' => 'Deep_Learning_Notes.pdf',
                        'file_type' => 'pdf',
                        'file_size' => 3800000,
                    ],
                ],
                'videos' => [
                    [
                        'title' => 'Machine Learning Foundations & Python Setup',
                        'description' => 'Understanding datasets, features, target variables, and installing Jupyter / Google Colab.',
                        'video_url' => 'https://www.youtube.com/watch?v=7eh4d6sabA0',
                        'duration' => '35:00',
                    ],
                    [
                        'title' => 'Neural Networks from Scratch with PyTorch',
                        'description' => 'Building your first multi-layer perceptron, loss functions, optimizers, and training loops.',
                        'video_url' => 'https://www.youtube.com/watch?v=aircAruvnKk',
                        'duration' => '52:10',
                    ],
                ],
            ],
            [
                'name' => 'Database & SQL',
                'slug' => 'database-and-sql',
                'short_description' => 'Relational database design, ACID transactions, complex SQL queries, indexing, and performance tuning.',
                'description' => "Data is the backbone of every modern enterprise system. This module teaches relational database modeling, normalization (1NF to BCNF), writing advanced SQL queries with joins, window functions, and subqueries, index architecture (B-Trees), query plan analysis, and Redis caching.",
                'important_points' => [
                    'Relational Schema Design & Entity Relationship Modeling (ERD).',
                    'ACID Transactions, Isolation Levels, and Lock mechanisms.',
                    'Advanced SQL Queries: Aggregations, Window Functions & CTEs.',
                    'Index Optimization: B-Tree vs Hash indexes, Composite indexes, EXPLAIN plans.',
                    'NoSQL Key-Value & Document stores (Redis, MongoDB).',
                ],
                'topics_covered' => [
                    'Relational Database Fundamentals & Normalization',
                    'DDL & DML: Tables, Constraints, Foreign Keys & Cascades',
                    'Complex Joins (INNER, LEFT, RIGHT, FULL OUTER) and Subqueries',
                    'Window Functions (ROW_NUMBER, RANK, DENSE_RANK, LEAD, LAG)',
                    'Common Table Expressions (CTEs) & Recursive Queries',
                    'Database Indexing Strategies & Query Optimization',
                    'Transactions, Savepoints & Concurrency Control',
                ],
                'examples_notes' => "-- Window function query example\nSELECT \n    student_name,\n    course_title,\n    grade_score,\n    DENSE_RANK() OVER (PARTITION BY course_title ORDER BY grade_score DESC) as rank_in_class\nFROM student_grades\nWHERE academic_year = 2026;",
                'icon_class' => 'bi-database-check',
                'color_scheme' => 'emerald',
                'rating' => 5.0,
                'sort_order' => 5,
                'is_active' => true,
                'documents' => [
                    [
                        'title' => 'SQL Query Optimization & Indexing Guide',
                        'description' => 'Learn how to write blazing fast queries, analyze execution plans with EXPLAIN ANALYZE, and eliminate table scans.',
                        'file_path' => $docPath,
                        'file_name' => 'SQL_Query_Optimization_Guide.pdf',
                        'file_type' => 'pdf',
                        'file_size' => 2400000,
                    ],
                    [
                        'title' => 'Database Schema Design & Normalization Notes',
                        'description' => 'Entity-relationship modeling, normal forms, foreign keys, cardinality, and data integrity constraints.',
                        'file_path' => $docPath,
                        'file_name' => 'Database_Schema_Design.pdf',
                        'file_type' => 'pdf',
                        'file_size' => 2900000,
                    ],
                ],
                'videos' => [
                    [
                        'title' => 'SQL Masterclass: From Joins to Window Functions',
                        'description' => 'Writing professional SQL queries, understanding aggregation groups, partitions, and analytics.',
                        'video_url' => 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
                        'duration' => '42:30',
                    ],
                    [
                        'title' => 'Database Indexing & Query Execution Plans',
                        'description' => 'How MySQL and PostgreSQL read data off disk, understanding B-Tree structures, and speed tuning.',
                        'video_url' => 'https://www.youtube.com/watch?v=clhuUeA8yQ0',
                        'duration' => '31:40',
                    ],
                ],
            ],
            [
                'name' => 'Java Enterprise',
                'slug' => 'java-enterprise',
                'short_description' => 'Enterprise software engineering with Java 21, Spring Boot 3, Hibernate JPA, and microservices.',
                'description' => "Java remains the gold standard for enterprise backend systems, banking platforms, and scalable distributed microservices. This curriculum covers modern Java features (records, pattern matching, virtual threads), Spring Boot ecosystem, RESTful API development, Spring Security, and Maven/Gradle build systems.",
                'important_points' => [
                    'Robust type system, JVM memory management, and Garbage Collection.',
                    'Spring Boot auto-configuration, dependency injection, and IoC containers.',
                    'Hibernate ORM & Spring Data JPA for persistence layer.',
                    'Spring Security with OAuth2 & JWT token workflows.',
                    'Microservice architecture with Spring Cloud and Eureka discovery.',
                ],
                'topics_covered' => [
                    'Java 21 Modern Language Features (Streams, Lambdas, Records)',
                    'Spring Boot 3 Architecture & Dependency Injection',
                    'Spring Data JPA, Entity Mapping & Repository Patterns',
                    'RESTful Controller Design & Validation (Jakarta Validation)',
                    'Spring Security, Password Hashing & JWT Authentication',
                    'Unit & Integration Testing with JUnit 5 & Mockito',
                    'Building Microservices & Docker containerization',
                ],
                'examples_notes' => "@RestController\n@RequestMapping(\"/api/v1/courses\")\npublic class CourseController {\n    private final CourseService courseService;\n\n    public CourseController(CourseService courseService) {\n        this.courseService = courseService;\n    }\n\n    @GetMapping\n    public ResponseEntity<List<CourseDto>> getActiveCourses() {\n        return ResponseEntity.ok(courseService.findAllActive());\n    }\n}",
                'icon_class' => 'bi-filetype-java',
                'color_scheme' => 'indigo',
                'rating' => 5.0,
                'sort_order' => 6,
                'is_active' => true,
                'documents' => [
                    [
                        'title' => 'Spring Boot 3 Enterprise Developer Handbook',
                        'description' => 'Building production-ready Java services with Spring Boot, JPA, logging, actuators, and health metrics.',
                        'file_path' => $docPath,
                        'file_name' => 'Spring_Boot_3_Enterprise_Guide.pdf',
                        'file_type' => 'pdf',
                        'file_size' => 3700000,
                    ],
                    [
                        'title' => 'Java 21 Core Syntax & Design Patterns Notes',
                        'description' => 'Gang of Four design patterns in modern Java, virtual threads (Project Loom), and concurrent collections.',
                        'file_path' => $docPath,
                        'file_name' => 'Java_21_Design_Patterns.pdf',
                        'file_type' => 'pdf',
                        'file_size' => 2950000,
                    ],
                ],
                'videos' => [
                    [
                        'title' => 'Spring Boot 3 Full Course: Build a Real Enterprise API',
                        'description' => 'From project initialization with Spring Initializr to deploying a tested REST API with database storage.',
                        'video_url' => 'https://www.youtube.com/watch?v=9SGDpanrc8U',
                        'duration' => '58:00',
                    ],
                ],
            ],
        ];

        foreach ($concepts as $cData) {
            $docs = $cData['documents'] ?? [];
            $vids = $cData['videos'] ?? [];
            unset($cData['documents'], $cData['videos']);

            $concept = Concept::updateOrCreate(['slug' => $cData['slug']], $cData);

            // Clean previous documents & videos to re-seed cleanly
            $concept->documents()->delete();
            $concept->videos()->delete();

            foreach ($docs as $dIndex => $doc) {
                $doc['concept_id'] = $concept->id;
                $doc['sort_order'] = $dIndex + 1;
                $doc['is_active'] = true;
                ConceptDocument::create($doc);
            }

            foreach ($vids as $vIndex => $vid) {
                $vid['concept_id'] = $concept->id;
                $vid['sort_order'] = $vIndex + 1;
                $vid['is_active'] = true;
                ConceptVideo::create($vid);
            }
        }
    }
}
