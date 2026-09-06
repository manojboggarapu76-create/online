<?php

namespace Database\Seeders;

use App\Models\ContentItem;
use Illuminate\Database\Seeder;

class InterviewPrepSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (ContentItem::where('section', 'interview_prep')->count() === 0) {
            ContentItem::create([
                'section' => 'interview_prep',
                'title' => 'Top 50 Technical & Coding Interview Questions (With Solutions)',
                'description' => 'Comprehensive breakdown of core Data Structures & Algorithm patterns (Two Pointers, Sliding Window, Graph DFS/BFS, Dynamic Programming) frequently asked in Tier-1 product interviews.',
                'link' => 'https://leetcode.com',
                'sort_order' => 1,
                'is_active' => true,
            ]);

            ContentItem::create([
                'section' => 'interview_prep',
                'title' => 'System Design Mock Interview Round (Video Walkthrough)',
                'description' => 'Complete end-to-end architectural breakdown of designing a scalable URL shortener and real-time chat notification system with low latency, rate limiting, and database sharding.',
                'link' => 'https://www.youtube.com/watch?v=xpDnVSmNFX0',
                'sort_order' => 2,
                'is_active' => true,
            ]);

            ContentItem::create([
                'section' => 'interview_prep',
                'title' => 'Behavioral Interview Mastery & The STAR Method Framework',
                'description' => 'Practical blueprint for answering behavioral questions like "Tell me about a time you resolved a technical conflict" and "Describe your biggest project failure" using Situation, Task, Action, and Result.',
                'sort_order' => 3,
                'is_active' => true,
            ]);

            ContentItem::create([
                'section' => 'interview_prep',
                'title' => 'Live React & Modern Frontend Engineering Mock Interview (Recording)',
                'description' => 'In-depth video session evaluating candidate on component architecture, state management trade-offs, custom hook lifecycle, performance profiling, and browser rendering critical path.',
                'link' => 'https://www.youtube.com/watch?v=5_5oE5lgrhw',
                'sort_order' => 4,
                'is_active' => true,
            ]);

            ContentItem::create([
                'section' => 'interview_prep',
                'title' => 'Resume Formatting & HR Recruiter Screening Checklist',
                'description' => 'Key tips for passing automated Applicant Tracking Systems (ATS), bullet-point quantification metrics (XYZ formula), GitHub project showcase strategies, and negotiation tactics.',
                'sort_order' => 5,
                'is_active' => true,
            ]);
        }
    }
}
