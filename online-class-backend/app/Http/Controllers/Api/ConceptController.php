<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminSetting;
use App\Models\Concept;
use App\Models\ConceptDocument;
use App\Models\ConceptVideo;
use App\Models\Payment;
use App\Models\UserSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class ConceptController extends Controller
{
    private function defaultConcepts(): array
    {
        return [
            [
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
                'topics_covered' => ['Data Structures & Collections', 'OOP & Magic Methods', 'Context Managers', 'Generators & Iterators', 'Type Hinting & Pydantic'],
                'color_scheme' => 'blue',
                'rating' => 5.0,
                'price' => 499,
                'sort_order' => 1,
                'is_active' => true,
                'documents' => [
                    [
                        'title' => 'Python 3.12 Core Architecture & Syntax Handbook',
                        'description' => 'Complete guide covering data structures, OOP patterns, and modern syntax features.',
                        'file_type' => 'PDF',
                        'file_path' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                        'file_size' => 2516582,
                        'sort_order' => 1,
                    ],
                    [
                        'title' => 'Generators, Iterators & Memory Profiling Reference',
                        'description' => 'Detailed notes and code snippets on memory-efficient streams and lazy evaluation.',
                        'file_type' => 'PDF',
                        'file_path' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                        'file_size' => 1887436,
                        'sort_order' => 2,
                    ]
                ],
                'videos' => [
                    [
                        'title' => 'Python OOP & Memory Architecture Explained',
                        'description' => 'Lecture walkthrough of Python object model, dunder methods, and decorators.',
                        'duration' => '42:15',
                        'video_url' => 'https://www.youtube.com/watch?v=rfscVS0vtbw',
                        'thumbnail_url' => 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=60',
                        'sort_order' => 1,
                    ],
                    [
                        'title' => 'Decorators, Metaclasses & Pythonic Design Patterns',
                        'description' => 'Hands-on live coding session creating reusable production-grade decorators.',
                        'duration' => '38:50',
                        'video_url' => 'https://www.youtube.com/watch?v=FsAPt_9Bf3U',
                        'thumbnail_url' => 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&auto=format&fit=crop&q=60',
                        'sort_order' => 2,
                    ]
                ]
            ],
            [
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
                'topics_covered' => ['Application Factory Pattern', 'SQLAlchemy Relationships', 'Marshmallow Schemas', 'JWT Tokens & RBAC', 'Database Migrations with Alembic'],
                'color_scheme' => 'amber',
                'rating' => 5.0,
                'price' => 499,
                'sort_order' => 2,
                'is_active' => true,
                'documents' => [
                    [
                        'title' => 'Flask Production Architecture & ORM Blueprint',
                        'description' => 'Architecture manual for building production-ready scalable REST APIs.',
                        'file_type' => 'PDF',
                        'file_path' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                        'file_size' => 3250585,
                        'sort_order' => 1,
                    ]
                ],
                'videos' => [
                    [
                        'title' => 'Building Scalable Flask REST APIs from Scratch',
                        'description' => 'Complete walkthrough building modular Flask API with SQLAlchemy ORM.',
                        'duration' => '45:30',
                        'video_url' => 'https://www.youtube.com/watch?v=GMppyAPbLYk',
                        'thumbnail_url' => 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=60',
                        'sort_order' => 1,
                    ]
                ]
            ],
            [
                'name' => 'Modern Frontend & UI/UX Engineering',
                'slug' => 'frontend-react',
                'short_description' => 'Build reactive web applications with JavaScript (ES6+), React 19, Vite, and modern CSS.',
                'description' => "Master modern web development. Learn React 19 hooks ecosystem, custom hooks, global state with Context API, CSS Grid, Flexbox, keyframe animations, and client-side routing.",
                'important_points' => [
                    'Component lifecycle and reconciliation with Virtual DOM.',
                    'Building reusable custom hooks to encapsulate domain state logic.',
                    'Optimizing re-renders with memoization and shallow equality comparisons.',
                    'Declarative routing and navigation with React Router.'
                ],
                'examples_notes' => "import { useState, useEffect } from 'react';\n\nexport function useDebounce(value, delay = 300) {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const handler = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(handler);\n  }, [value, delay]);\n  return debounced;\n}",
                'topics_covered' => ['React Hooks Ecosystem', 'Context API & Reducers', 'React Router v7', 'Vite Bundler & Performance', 'Glassmorphism Aesthetics'],
                'color_scheme' => 'cyan',
                'rating' => 5.0,
                'price' => 499,
                'sort_order' => 3,
                'is_active' => true,
                'documents' => [
                    [
                        'title' => 'React 19 Architecture & State Patterns Handbook',
                        'description' => 'Complete manual on hooks, performance optimizations, and Context architecture.',
                        'file_type' => 'PDF',
                        'file_path' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                        'file_size' => 3670016,
                        'sort_order' => 1,
                    ]
                ],
                'videos' => [
                    [
                        'title' => 'React 19 Masterclass & State Architecture',
                        'description' => 'Building production web applications with React 19, hooks, and Context.',
                        'duration' => '54:20',
                        'video_url' => 'https://www.youtube.com/watch?v=w7ejDZ8SWv8',
                        'thumbnail_url' => 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=60',
                        'sort_order' => 1,
                    ]
                ]
            ],
            [
                'name' => 'Machine Learning & Applied AI',
                'slug' => 'machine-learning-ai',
                'short_description' => 'From mathematics & NumPy to PyTorch neural networks, computer vision, NLP, and model deployment.',
                'description' => "Understand core machine learning theory and PyTorch deep learning. Implement linear/logistic regression, decision trees, random forests, CNNs for computer vision, and Transformer architectures.",
                'important_points' => [
                    'Vectorized array computation with NumPy and Pandas DataFrame pipelines.',
                    'Bias-Variance tradeoff, cross-validation, and hyperparameter tuning.',
                    'PyTorch tensor calculus, autograd, and neural network training loops.',
                    'Transfer learning and fine-tuning state-of-the-art vision models.'
                ],
                'examples_notes' => "import torch\nimport torch.nn as nn\n\nclass DeepClassifier(nn.Module):\n    def __init__(self, in_features, num_classes):\n        super().__init__()\n        self.network = nn.Sequential(\n            nn.Linear(in_features, 128),\n            nn.ReLU(),\n            nn.Dropout(0.2),\n            nn.Linear(128, num_classes)\n        )\n    def forward(self, x):\n        return self.network(x)",
                'topics_covered' => ['NumPy & Pandas Pipelines', 'Scikit-Learn Classifiers', 'PyTorch Tensors & Autograd', 'CNNs & Vision Models', 'Transformers & Attention'],
                'color_scheme' => 'purple',
                'rating' => 5.0,
                'price' => 599,
                'sort_order' => 4,
                'is_active' => true,
                'documents' => [
                    [
                        'title' => 'PyTorch Deep Learning & Transformer Architecture Guide',
                        'description' => 'Tensor calculus, neural layer designs, and attention mechanisms.',
                        'file_type' => 'PDF',
                        'file_path' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                        'file_size' => 4404019,
                        'sort_order' => 1,
                    ]
                ],
                'videos' => [
                    [
                        'title' => 'Deep Learning in PyTorch from Tensors to Transformers',
                        'description' => 'Complete neural network training and validation loop.',
                        'duration' => '58:30',
                        'video_url' => 'https://www.youtube.com/watch?v=V_xro1bcAuA',
                        'thumbnail_url' => 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=60',
                        'sort_order' => 1,
                    ]
                ]
            ],
            [
                'name' => 'Database Engineering & SQL Mastery',
                'slug' => 'database-sql',
                'short_description' => 'Relational database schema modeling, ACID transactions, indexing strategies, and Redis caching.',
                'description' => "Write enterprise-grade SQL queries. Master window functions (ROW_NUMBER, RANK, LEAD, LAG), recursive CTEs, query optimization with EXPLAIN, ACID transactions, and high-speed Redis caching layers.",
                'important_points' => [
                    'Window analytical functions across partitions and ordering frames.',
                    'Hierarchical data traversal with recursive CTEs.',
                    'ACID transaction guarantees and row locking concurrency.',
                    'Cache-aside and rate limiting architectures using Redis.'
                ],
                'examples_notes' => "WITH RankedEnrollments AS (\n  SELECT \n    user_id,\n    purpose,\n    amount,\n    created_at,\n    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn\n  FROM payments\n  WHERE status = 'paid'\n)\nSELECT user_id, purpose, amount, created_at\nFROM RankedEnrollments\nWHERE rn = 1;",
                'topics_covered' => ['Window Functions (ROW_NUMBER, RANK)', 'Recursive CTEs', 'EXPLAIN Query Plans', '3NF Schema Normalization', 'Redis In-Memory Caching'],
                'color_scheme' => 'emerald',
                'rating' => 5.0,
                'price' => 399,
                'sort_order' => 5,
                'is_active' => true,
                'documents' => [
                    [
                        'title' => 'Advanced SQL & Query Optimization Cheat Sheet',
                        'description' => 'Window functions, CTE templates, and EXPLAIN command analysis.',
                        'file_type' => 'PDF',
                        'file_path' => 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
                        'file_size' => 2097152,
                        'sort_order' => 1,
                    ]
                ],
                'videos' => [
                    [
                        'title' => 'Advanced SQL Window Functions & Performance Tuning',
                        'description' => 'Deep dive into analytical SQL queries and indexing strategies.',
                        'duration' => '40:15',
                        'video_url' => 'https://www.youtube.com/watch?v=HXV3zeRR3h4',
                        'thumbnail_url' => 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=60',
                        'sort_order' => 1,
                    ]
                ]
            ],
        ];
    }

    private function ensureSeeded(): void
    {
        if (Concept::count() === 0) {
            foreach ($this->defaultConcepts() as $cData) {
                $docs = $cData['documents'] ?? [];
                $vids = $cData['videos'] ?? [];
                unset($cData['documents'], $cData['videos']);

                $concept = Concept::create($cData);

                foreach ($docs as $doc) {
                    $doc['concept_id'] = $concept->id;
                    ConceptDocument::create($doc);
                }

                foreach ($vids as $vid) {
                    $vid['concept_id'] = $concept->id;
                    ConceptVideo::create($vid);
                }
            }
        }
    }

    public function publicIndex(Request $request)
    {
        $this->ensureSeeded();

        $query = Concept::active()->withCount([
            'documents' => fn ($q) => $q->where('is_active', true),
            'videos' => fn ($q) => $q->where('is_active', true),
        ]);

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('short_description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category') && $request->category !== 'all') {
            $cat = $request->query('category');
            $query->where('color_scheme', $cat);
        }

        $concepts = $query->orderBy('sort_order')->orderBy('id')->get();

        return response()->json(['data' => $concepts]);
    }

    public function publicShow(Request $request, $identifier)
    {
        $this->ensureSeeded();

        $query = is_numeric($identifier)
            ? Concept::where('id', $identifier)
            : Concept::where('slug', $identifier);

        $concept = $query->with([
            'documents' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')->orderBy('id'),
            'videos' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')->orderBy('id'),
        ])->first();

        if (!$concept) {
            abort(404, 'Concept not found.');
        }

        return response()->json(['data' => $this->publicConceptPayload($request, $concept)]);
    }

    /**
     * GET /api/concepts-access/status (auth:user)
     * Returns the list of unlocked concept slugs/ids for the authenticated student.
     */
    public function myAccess(Request $request)
    {
        $user = $request->attributes->get('auth_user');

        if (!$user) {
            return response()->json(['data' => []]);
        }

        $paymentRequiredSetting = AdminSetting::where('key', 'payment_required')->value('value');
        $paymentRequired = ($paymentRequiredSetting !== '0');

        // If global payment is OFF, all concepts are freely unlocked
        if (!$paymentRequired) {
            $allSlugsAndIds = Concept::all()->flatMap(function ($c) {
                return array_filter([$c->slug, (string) $c->id]);
            })->unique()->values();
            return response()->json(['data' => $allSlugsAndIds]);
        }

        $unlockedSlugs = Payment::where('user_id', $user->id)
            ->where('status', 'paid')
            ->where('purpose', 'like', 'concept_%')
            ->pluck('purpose')
            ->map(fn ($p) => substr($p, strlen('concept_')))
            ->toArray();

        // Also, any concept where is_locked is false is freely unlocked for everyone
        $unlockedConcepts = Concept::where('is_locked', false)->get();
        foreach ($unlockedConcepts as $c) {
            if ($c->slug) {
                $unlockedSlugs[] = $c->slug;
            }
            $unlockedSlugs[] = (string) $c->id;
        }

        return response()->json(['data' => array_values(array_unique($unlockedSlugs))]);
    }

    /**
     * POST /api/concepts/{identifier}/create-order (auth:user)
     * Creates a Razorpay order for this specific concept subject at its price.
     */
    public function createOrder(Request $request, $identifier)
    {
        $user = $request->attributes->get('auth_user');
        $this->ensureSeeded();

        $concept = is_numeric($identifier)
            ? Concept::where('id', $identifier)->first()
            : Concept::where('slug', $identifier)->first();

        if (!$concept) {
            return response()->json(['message' => 'Subject module not found.'], 404);
        }

        $paymentRequiredSetting = AdminSetting::where('key', 'payment_required')->value('value');
        if ($paymentRequiredSetting === '0' || $concept->is_locked === false) {
            return response()->json([
                'already_paid' => true,
                'message' => 'This subject curriculum is completely free. No payment required.',
            ]);
        }

        $purpose = 'concept_' . ($concept->slug ?: $concept->id);

        // Check if already paid
        $alreadyPaid = Payment::where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->where('status', 'paid')
            ->exists();

        if ($alreadyPaid) {
            return response()->json([
                'already_paid' => true,
                'message' => 'You already have unlocked access to this subject curriculum.',
            ]);
        }

        $keyId = env('RAZORPAY_KEY_ID');
        $keySecret = env('RAZORPAY_KEY_SECRET');

        if (!$keyId || !$keySecret) {
            return response()->json([
                'message' => 'Payment gateway keys are not configured in backend .env.',
            ], 500);
        }

        $price = $concept->price ?: 499;
        $amountInPaise = $price * 100;
        $currency = env('RAZORPAY_CURRENCY', 'INR');
        $receipt = 'cp_' . substr(($concept->slug ?: $concept->id), 0, 10) . '_' . $user->id . '_' . time();

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
                'description' => 'Unlock ' . $concept->name,
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
                    'concept_id' => (string) $concept->id,
                    'concept_name' => $concept->name,
                ],
            ]);

        if ($response->failed()) {
            Log::error('Razorpay concept order creation failed', ['body' => $response->body()]);
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
                'concept_id' => $concept->id,
                'concept_name' => $concept->name,
            ],
        ]);

        return response()->json([
            'key' => $keyId,
            'order_id' => $payment->razorpay_order_id,
            'amount' => $payment->amount,
            'currency' => $payment->currency,
            'name' => 'Online Class',
            'description' => 'Unlock ' . $concept->name,
            'prefill' => ['name' => $user->name, 'email' => $user->email],
        ], 201);
    }

    /**
     * POST /api/concepts/{identifier}/verify-payment (auth:user)
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
            return response()->json(['status' => 'paid', 'message' => 'Subject module already unlocked.']);
        }

        $keySecret = env('RAZORPAY_KEY_SECRET');
        $expected = hash_hmac(
            'sha256',
            $validated['razorpay_order_id'] . '|' . $validated['razorpay_payment_id'],
            $keySecret
        );

        if (!hash_equals($expected, $validated['razorpay_signature'])) {
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
            'message' => 'Subject unlocked successfully! Full curriculum materials are now available.',
        ]);
    }

    /**
     * Produces the public shape of a concept without disclosing backing file
     * paths or permanent media URLs. Access to each protected resource is
     * represented by a short-lived signed route minted only after the same
     * entitlement checks used by checkout.
     */
    private function publicConceptPayload(Request $request, Concept $concept): array
    {
        $user = $this->resolveRequestUser($request);
        $conceptUnlocked = $this->canAccessConcept($user, $concept);
        $payload = $concept->toArray();

        $payload['documents'] = $concept->documents->map(function (ConceptDocument $document) use ($conceptUnlocked) {
            $item = $document->toArray();
            $allowed = $conceptUnlocked || $document->is_locked === false;
            unset($item['file_path'], $item['download_url']);

            if (!$allowed) {
                $item['file_url'] = null;
                return $item;
            }

            if ($document->file_path && (str_starts_with($document->file_path, 'http://') || str_starts_with($document->file_path, 'https://'))) {
                $item['file_url'] = $document->file_path;
            } elseif ($document->file_path) {
                $item['file_url'] = URL::temporarySignedRoute('concept.document.stream', now()->addMinutes(60), ['document' => $document->id]);
            } else {
                $item['file_url'] = null;
            }

            return $item;
        })->values()->all();

        $payload['videos'] = $concept->videos->map(function (ConceptVideo $video) use ($conceptUnlocked) {
            $item = $video->toArray();
            $allowed = $conceptUnlocked || $video->is_locked === false;
            unset($item['file_path'], $item['stream_url']);

            if (!$allowed) {
                $item['video_url'] = null;
                $item['is_direct_stream'] = false;
                return $item;
            }

            // If an external video link (YouTube, Vimeo, Google Drive, direct MP4) is provided:
            if ($video->video_url) {
                $item['video_url'] = $video->video_url;
                $item['is_direct_stream'] = false;
            } elseif ($video->file_path) {
                // If a video file was uploaded, stream it through the secure broker route:
                $item['video_url'] = URL::temporarySignedRoute('concept.video.stream', now()->addMinutes(60), ['video' => $video->id]);
                $item['is_direct_stream'] = true;
            } else {
                $item['video_url'] = null;
                $item['is_direct_stream'] = false;
            }

            return $item;
        })->values()->all();

        return $payload;
    }

    private function resolveRequestUser(Request $request)
    {
        $token = $request->bearerToken();
        if (! $token) {
            return null;
        }

        return UserSession::with('user')
            ->where('token', $token)
            ->where('expires_at', '>', now())
            ->first()?->user;
    }

    private function canAccessConcept($user, Concept $concept): bool
    {
        $paymentRequired = AdminSetting::where('key', 'payment_required')->value('value') !== '0';
        if (! $paymentRequired || $concept->is_locked === false) {
            return true;
        }
        if (! $user) {
            return false;
        }

        $purpose = 'concept_' . ($concept->slug ?: $concept->id);
        return Payment::where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->where('status', 'paid')
            ->exists();
    }

    private function protectedResourceDisk(?string $path)
    {
        if (! $path || str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return null;
        }

        // Existing public-disk files keep working during migration; all new
        // documents and video files are placed on Laravel's private disk.
        return Storage::disk('local')->exists($path) ? Storage::disk('local') : Storage::disk('public');
    }

    private function deleteProtectedResource(?string $path): void
    {
        $disk = $this->protectedResourceDisk($path);
        if ($disk && $disk->exists($path)) {
            $disk->delete($path);
        }
    }

    public function streamDocument(Request $request, ConceptDocument $document)
    {
        if (! $request->hasValidSignature()) {
            abort(403, 'Protected document access has expired or is invalid.');
        }

        if (str_starts_with((string) $document->file_path, 'http://') || str_starts_with((string) $document->file_path, 'https://')) {
            return redirect($document->file_path);
        }

        $disk = $this->protectedResourceDisk($document->file_path);
        if (!$document->file_path || !$disk || !$disk->exists($document->file_path)) {
            abort(404, 'Document file not found.');
        }

        $path = $disk->path($document->file_path);

        $extension = strtolower(pathinfo($document->file_name ?: $document->file_path, PATHINFO_EXTENSION));
        $mimeTypes = [
            'pdf' => 'application/pdf',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'txt' => 'text/plain',
            'text' => 'text/plain',
            'md' => 'text/markdown',
            'markdown' => 'text/markdown',
            'html' => 'text/html',
            'htm' => 'text/html',
            'csv' => 'text/csv',
            'tsv' => 'text/tab-separated-values',
            'json' => 'application/json',
            'xml' => 'application/xml',
            'css' => 'text/css',
            'js' => 'text/javascript',
            'jsx' => 'text/plain',
            'ts' => 'text/plain',
            'tsx' => 'text/plain',
            'php' => 'text/plain',
            'py' => 'text/plain',
            'java' => 'text/plain',
            'c' => 'text/plain',
            'cpp' => 'text/plain',
            'h' => 'text/plain',
            'hpp' => 'text/plain',
            'sql' => 'text/plain',
            'yml' => 'text/plain',
            'yaml' => 'text/plain',
            'ini' => 'text/plain',
            'conf' => 'text/plain',
            'log' => 'text/plain',
            'srt' => 'text/plain',
            'vtt' => 'text/vtt',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'ppt' => 'application/vnd.ms-powerpoint',
            'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'zip' => 'application/zip',
        ];
        $mimeType = $mimeTypes[$extension] ?? (@mime_content_type($path) ?: 'application/pdf');

        // Text-like resources need an explicit charset, otherwise the browser
        // can mis-render non-ASCII bytes inside the protected iframe viewer.
        $textLikeTypes = [
            'text/plain', 'text/markdown', 'text/csv', 'text/tab-separated-values',
            'application/json', 'application/xml', 'text/html', 'text/css',
            'text/javascript', 'text/vtt',
        ];
        if (in_array($mimeType, $textLikeTypes, true)) {
            $mimeType .= '; charset=UTF-8';
        }

        return response()->file($path, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . ($document->file_name ?: basename($path)) . '"',
            'Access-Control-Allow-Origin' => '*',
            'Cross-Origin-Resource-Policy' => 'cross-origin',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function downloadDocument(ConceptDocument $document)
    {
        abort(403, 'Protected documents are view-only and cannot be downloaded.');
    }

    public function streamVideo(Request $request, ConceptVideo $video)
    {
        if (! $request->hasValidSignature()) {
            abort(403, 'Protected video access has expired or is invalid.');
        }

        if ($video->video_url) {
            return redirect()->away($video->video_url);
        }

        if (str_starts_with((string) $video->file_path, 'http://') || str_starts_with((string) $video->file_path, 'https://')) {
            return redirect($video->file_path);
        }

        $disk = $this->protectedResourceDisk($video->file_path);
        if (!$video->file_path || !$disk || !$disk->exists($video->file_path)) {
            abort(404, 'Video file not found.');
        }

        $path = $disk->path($video->file_path);
        $fileSize = filesize($path);

        $extension = strtolower(pathinfo($video->file_name ?: $video->file_path, PATHINFO_EXTENSION));
        $videoMimes = [
            'mp4' => 'video/mp4',
            'webm' => 'video/webm',
            'ogg' => 'video/ogg',
            'ogv' => 'video/ogg',
            'mov' => 'video/quicktime',
            'mkv' => 'video/x-matroska',
            'm4v' => 'video/mp4',
            'avi' => 'video/x-msvideo',
        ];
        $mimeType = $videoMimes[$extension] ?? (@mime_content_type($path) ?: 'video/mp4');

        $range = request()->header('Range');
        if (!$range) {
            return response()->file($path, [
                'Content-Type' => $mimeType,
                'Content-Length' => $fileSize,
                'Accept-Ranges' => 'bytes',
                'Access-Control-Allow-Origin' => '*',
                'Cross-Origin-Resource-Policy' => 'cross-origin',
            ]);
        }

        if (!preg_match('/bytes=(\d+)-(\d+)?/', $range, $matches)) {
            return response('', 416, ['Content-Range' => "bytes */$fileSize"]);
        }

        $start = (int) $matches[1];
        $end = isset($matches[2]) && $matches[2] !== '' ? (int) $matches[2] : $fileSize - 1;

        if ($start > $end || $start >= $fileSize) {
            return response('', 416, ['Content-Range' => "bytes */$fileSize"]);
        }

        $end = min($end, $fileSize - 1);
        $length = $end - $start + 1;

        $headers = [
            'Content-Type' => $mimeType,
            'Content-Length' => $length,
            'Content-Range' => "bytes $start-$end/$fileSize",
            'Accept-Ranges' => 'bytes',
            'Access-Control-Allow-Origin' => '*',
            'Cross-Origin-Resource-Policy' => 'cross-origin',
        ];

        return response()->stream(function () use ($path, $start, $length) {
            $handle = fopen($path, 'rb');
            if ($handle === false) return;
            fseek($handle, $start);
            $bufferSize = 1024 * 128;
            $remaining = $length;
            while ($remaining > 0 && !feof($handle)) {
                $readLength = min($bufferSize, $remaining);
                $buffer = fread($handle, $readLength);
                if ($buffer === false) break;
                echo $buffer;
                flush();
                $remaining -= strlen($buffer);
            }
            fclose($handle);
        }, 206, $headers);
    }

    public function adminStats()
    {
        return response()->json([
            'total_concepts' => Concept::count(),
            'active_concepts' => Concept::where('is_active', true)->count(),
            'total_documents' => ConceptDocument::count(),
            'total_videos' => ConceptVideo::count(),
        ]);
    }

    public function adminConceptsIndex(Request $request)
    {
        $query = Concept::withCount(['documents', 'videos']);

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $isActive = $request->query('status') === 'active';
            $query->where('is_active', $isActive);
        }

        $concepts = $query->orderBy('sort_order')->orderBy('id')->get();

        return response()->json(['data' => $concepts]);
    }

    public function adminConceptStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:concepts,slug',
            'short_description' => 'nullable|string',
            'description' => 'nullable|string',
            'important_points' => 'nullable',
            'topics_covered' => 'nullable',
            'examples_notes' => 'nullable|string',
            'icon_class' => 'nullable|string|max:100',
            'color_scheme' => 'nullable|string|max:50',
            'rating' => 'nullable|numeric|between:1,5',
            'price' => 'nullable|numeric|min:0',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'is_locked' => 'nullable|boolean',
            'image' => 'nullable|image|max:10240',
        ]);

        if (empty($validated['slug'])) {
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;
            $counter = 1;
            while (Concept::where('slug', $slug)->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }
            $validated['slug'] = $slug;
        }

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('concepts', 'public');
        }

        if (isset($validated['important_points']) && is_string($validated['important_points'])) {
            $validated['important_points'] = json_decode($validated['important_points'], true) 
                ?: array_filter(array_map('trim', explode("\n", $validated['important_points'])));
        }

        if (isset($validated['topics_covered']) && is_string($validated['topics_covered'])) {
            $validated['topics_covered'] = json_decode($validated['topics_covered'], true) 
                ?: array_filter(array_map('trim', explode("\n", $validated['topics_covered'])));
        }

        if (isset($validated['price'])) {
            $validated['price'] = (int) $validated['price'];
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['is_locked'] = $request->boolean('is_locked', true);
        unset($validated['image']);

        $concept = Concept::create($validated);

        return response()->json(['data' => $concept->fresh(['documents', 'videos'])], 201);
    }

    public function adminConceptShow($id)
    {
        $concept = is_numeric($id)
            ? Concept::findOrFail($id)
            : Concept::where('slug', $id)->firstOrFail();

        $concept->load(['documents', 'videos']);
        return response()->json(['data' => $concept]);
    }

    public function adminConceptUpdate(Request $request, $id)
    {
        $concept = is_numeric($id)
            ? Concept::findOrFail($id)
            : Concept::where('slug', $id)->firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:concepts,slug,' . $concept->id,
            'short_description' => 'nullable|string',
            'description' => 'nullable|string',
            'important_points' => 'nullable',
            'topics_covered' => 'nullable',
            'examples_notes' => 'nullable|string',
            'icon_class' => 'nullable|string|max:100',
            'color_scheme' => 'nullable|string|max:50',
            'rating' => 'nullable|numeric|between:1,5',
            'price' => 'nullable|numeric|min:0',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable',
            'is_locked' => 'nullable',
            'image' => 'nullable|image|max:10240',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = $concept->slug ?: Str::slug($validated['name']);
        }

        if ($request->hasFile('image')) {
            if ($concept->image_path && Storage::disk('public')->exists($concept->image_path)) {
                Storage::disk('public')->delete($concept->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('concepts', 'public');
        }

        if (isset($validated['important_points']) && is_string($validated['important_points'])) {
            $validated['important_points'] = json_decode($validated['important_points'], true) 
                ?: array_filter(array_map('trim', explode("\n", $validated['important_points'])));
        }

        if (isset($validated['topics_covered']) && is_string($validated['topics_covered'])) {
            $validated['topics_covered'] = json_decode($validated['topics_covered'], true) 
                ?: array_filter(array_map('trim', explode("\n", $validated['topics_covered'])));
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

        unset($validated['image']);

        $concept->update($validated);

        return response()->json(['data' => $concept->fresh(['documents', 'videos'])]);
    }

    public function adminToggleLock(Request $request, $id)
    {
        $concept = is_numeric($id)
            ? Concept::findOrFail($id)
            : Concept::where('slug', $id)->firstOrFail();

        $validated = $request->validate([
            'is_locked' => 'required|boolean',
        ]);

        $concept->update([
            'is_locked' => (bool) $validated['is_locked'],
        ]);

        $statusStr = $concept->is_locked ? 'locked (payment required)' : 'unlocked (free access)';

        return response()->json([
            'data' => $concept->fresh(['documents', 'videos']),
            'message' => "Subject module {$concept->name} is now {$statusStr}.",
        ]);
    }

    public function adminUpdatePrice(Request $request, $id)
    {
        $concept = is_numeric($id)
            ? Concept::findOrFail($id)
            : Concept::where('slug', $id)->firstOrFail();

        $validated = $request->validate([
            'price' => 'required|numeric|min:0',
        ]);

        $concept->update([
            'price' => (int) $validated['price'],
        ]);

        return response()->json([
            'data' => $concept->fresh(['documents', 'videos']),
            'message' => "Unlock price for {$concept->name} updated to ₹{$concept->price} successfully.",
        ]);
    }

    public function adminConceptDestroy($id)
    {
        $concept = is_numeric($id)
            ? Concept::findOrFail($id)
            : Concept::where('slug', $id)->firstOrFail();

        if ($concept->image_path && Storage::disk('public')->exists($concept->image_path)) {
            Storage::disk('public')->delete($concept->image_path);
        }

        foreach ($concept->documents as $doc) {
            $this->deleteProtectedResource($doc->file_path);
        }
        foreach ($concept->videos as $vid) {
            $this->deleteProtectedResource($vid->file_path);
            if ($vid->thumbnail_path && Storage::disk('public')->exists($vid->thumbnail_path)) {
                Storage::disk('public')->delete($vid->thumbnail_path);
            }
        }

        $concept->delete();

        return response()->json(['message' => 'Concept deleted successfully.']);
    }

    public function adminDocumentsIndex(Request $request)
    {
        $query = ConceptDocument::with('concept:id,name,color_scheme');

        if ($request->filled('concept_id')) {
            $query->where('concept_id', $request->concept_id);
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where('title', 'like', "%{$search}%");
        }

        $documents = $query->orderBy('concept_id')->orderBy('sort_order')->orderBy('id')->get();

        return response()->json(['data' => $documents]);
    }

    public function adminDocumentStore(Request $request)
    {
        $validated = $request->validate([
            'concept_id' => 'required|exists:concepts,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'required|file|max:524288',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'is_locked' => 'nullable|boolean',
        ]);

        $file = $request->file('file');
        $validated['file_path'] = $file->store('protected-content/concept-documents', 'local');
        $validated['file_name'] = $file->getClientOriginalName();
        $validated['file_type'] = strtolower($file->getClientOriginalExtension());
        $validated['file_size'] = $file->getSize();
        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['is_locked'] = $request->boolean('is_locked', true);
        unset($validated['file']);

        $doc = ConceptDocument::create($validated);

        return response()->json(['data' => $doc->fresh('concept')], 201);
    }

    public function adminDocumentUpdate(Request $request, ConceptDocument $document)
    {
        $validated = $request->validate([
            'concept_id' => 'required|exists:concepts,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'nullable|file|max:524288',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'is_locked' => 'nullable|boolean',
        ]);

        if ($request->hasFile('file')) {
            $this->deleteProtectedResource($document->file_path);
            $file = $request->file('file');
            $validated['file_path'] = $file->store('protected-content/concept-documents', 'local');
            $validated['file_name'] = $file->getClientOriginalName();
            $validated['file_type'] = strtolower($file->getClientOriginalExtension());
            $validated['file_size'] = $file->getSize();
        }

        if ($request->has('is_active')) {
            $validated['is_active'] = $request->boolean('is_active');
        }

        if ($request->has('is_locked')) {
            $validated['is_locked'] = $request->boolean('is_locked');
        }

        unset($validated['file']);

        $document->update($validated);

        return response()->json(['data' => $document->fresh('concept')]);
    }

    public function adminToggleDocumentLock(Request $request, $id)
    {
        $document = ConceptDocument::findOrFail($id);

        $validated = $request->validate([
            'is_locked' => 'required|boolean',
        ]);

        $document->update([
            'is_locked' => (bool) $validated['is_locked'],
        ]);

        $statusStr = $document->is_locked ? 'locked (payment required)' : 'unlocked (free access)';

        return response()->json([
            'data' => $document->fresh('concept'),
            'message' => "Document {$document->title} is now {$statusStr}.",
        ]);
    }

    public function adminDocumentDestroy(ConceptDocument $document)
    {
        $this->deleteProtectedResource($document->file_path);

        $document->delete();

        return response()->json(['message' => 'Document deleted.']);
    }

    public function adminVideosIndex(Request $request)
    {
        $query = ConceptVideo::with('concept:id,name,color_scheme');

        if ($request->filled('concept_id')) {
            $query->where('concept_id', $request->concept_id);
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where('title', 'like', "%{$search}%");
        }

        $videos = $query->orderBy('concept_id')->orderBy('sort_order')->orderBy('id')->get();

        return response()->json(['data' => $videos]);
    }

    public function adminVideoStore(Request $request)
    {
        $validated = $request->validate([
            'concept_id' => 'required|exists:concepts,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'video_url' => 'nullable|string|max:2048',
            'video_file' => 'nullable|file|max:5242880',
            'thumbnail' => 'nullable|image|max:10240',
            'duration' => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'is_locked' => 'nullable|boolean',
        ]);

        if ($request->hasFile('video_file')) {
            $validated['file_path'] = $request->file('video_file')->store('protected-content/concept-videos', 'local');
        }

        if ($request->hasFile('thumbnail')) {
            $validated['thumbnail_path'] = $request->file('thumbnail')->store('concept-thumbnails', 'public');
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['is_locked'] = $request->boolean('is_locked', true);
        unset($validated['video_file'], $validated['thumbnail']);

        $video = ConceptVideo::create($validated);

        return response()->json(['data' => $video->fresh('concept')], 201);
    }

    public function adminVideoUpdate(Request $request, ConceptVideo $video)
    {
        $validated = $request->validate([
            'concept_id' => 'required|exists:concepts,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'video_url' => 'nullable|string|max:2048',
            'video_file' => 'nullable|file|max:5242880',
            'thumbnail' => 'nullable|image|max:10240',
            'duration' => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'is_locked' => 'nullable|boolean',
        ]);

        if ($request->hasFile('video_file')) {
            $this->deleteProtectedResource($video->file_path);
            $validated['file_path'] = $request->file('video_file')->store('protected-content/concept-videos', 'local');
        }

        if ($request->hasFile('thumbnail')) {
            if ($video->thumbnail_path && Storage::disk('public')->exists($video->thumbnail_path)) {
                Storage::disk('public')->delete($video->thumbnail_path);
            }
            $validated['thumbnail_path'] = $request->file('thumbnail')->store('concept-thumbnails', 'public');
        }

        if ($request->has('is_active')) {
            $validated['is_active'] = $request->boolean('is_active');
        }

        if ($request->has('is_locked')) {
            $validated['is_locked'] = $request->boolean('is_locked');
        }

        unset($validated['video_file'], $validated['thumbnail']);

        $video->update($validated);

        return response()->json(['data' => $video->fresh('concept')]);
    }

    public function adminToggleVideoLock(Request $request, $id)
    {
        $video = ConceptVideo::findOrFail($id);

        $validated = $request->validate([
            'is_locked' => 'required|boolean',
        ]);

        $video->update([
            'is_locked' => (bool) $validated['is_locked'],
        ]);

        $statusStr = $video->is_locked ? 'locked (payment required)' : 'unlocked (free access)';

        return response()->json([
            'data' => $video->fresh('concept'),
            'message' => "Video {$video->title} is now {$statusStr}.",
        ]);
    }

    public function adminVideoDestroy(ConceptVideo $video)
    {
        $this->deleteProtectedResource($video->file_path);
        if ($video->thumbnail_path && Storage::disk('public')->exists($video->thumbnail_path)) {
            Storage::disk('public')->delete($video->thumbnail_path);
        }

        $video->delete();

        return response()->json(['message' => 'Video deleted.']);
    }
}
