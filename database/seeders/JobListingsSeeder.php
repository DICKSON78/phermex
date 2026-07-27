<?php

namespace Database\Seeders;

use App\Models\JobListing;
use App\Models\JobApplication;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;

class JobListingsSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        $departments = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'Operations', 'Customer Success', 'Finance', 'HR', 'Compliance', 'Quality Assurance', 'Data Science', 'DevOps', 'Security', 'Legal'];
        $locations = ['Dar es Salaam', 'Arusha', 'Mwanza', 'Remote', 'Dodoma', 'Nairobi', 'Lagos', 'Remote (Africa)'];
        $types = ['full_time', 'full_time', 'full_time', 'part_time', 'contract', 'internship', 'remote'];
        $statuses = ['active', 'active', 'active', 'active', 'closed', 'draft'];

        $jobTitles = [
            'Engineering' => ['Senior Full-Stack Developer', 'Backend Developer (Laravel)', 'Frontend Developer (React)', 'Mobile Developer (Flutter)', 'DevOps Engineer', 'QA Engineer', 'Security Engineer'],
            'Product' => ['Product Manager', 'Technical Product Manager', 'Product Analyst'],
            'Design' => ['UI/UX Designer', 'Product Designer', 'Graphic Designer'],
            'Sales' => ['Sales Representative', 'Enterprise Account Executive', 'Business Development Manager', 'Sales Lead - East Africa'],
            'Marketing' => ['Marketing Lead', 'Content Marketing Specialist', 'Social Media Manager', 'Growth Hacker', 'SEO Specialist'],
            'Operations' => ['Operations Manager', 'Customer Success Manager', 'Logistics Coordinator'],
            'Customer Success' => ['Customer Success Manager', 'Technical Support Specialist', 'Onboarding Specialist'],
            'Finance' => ['Financial Analyst', 'Accountant', 'Revenue Operations Manager'],
            'HR' => ['HR Manager', 'Talent Acquisition Specialist', 'People Operations Lead'],
            'Compliance' => ['Compliance Officer', 'Regulatory Affairs Specialist'],
            'Quality Assurance' => ['QA Lead', 'Software Test Engineer'],
            'Data Science' => ['Data Analyst', 'Machine Learning Engineer', 'Data Engineer'],
            'DevOps' => ['DevOps Engineer', 'Site Reliability Engineer', 'Cloud Infrastructure Engineer'],
            'Security' => ['Information Security Analyst', 'Security Architect'],
            'Legal' => ['Legal Counsel', 'Paralegal'],
        ];

        $descriptions = [
            'Senior Full-Stack Developer' => 'We are looking for a Senior Full-Stack Developer to join our engineering team. You will build and maintain our pharmacy management platform using Laravel, React, and modern web technologies. You will work closely with product and design to deliver features that impact millions of pharmacies across Africa.',
            'Backend Developer (Laravel)' => 'Join our backend team to build scalable APIs and services. You will design and implement RESTful APIs, optimize database queries, and ensure high availability of our platform.',
            'Frontend Developer (React)' => 'We need a talented React developer to build intuitive user interfaces for our pharmacy management dashboard. You will work with modern React patterns, TypeScript, and Tailwind CSS.',
            'Mobile Developer (Flutter)' => 'Help us build our cross-platform mobile app using Flutter. You will create a beautiful, performant mobile experience for pharmacy owners and customers across Africa.',
            'Product Manager' => 'Lead product strategy and execution for our pharmacy platform. You will work with stakeholders, analyze market needs, and drive product roadmap to transform pharmacy management in Africa.',
            'UI/UX Designer' => 'Design beautiful, intuitive interfaces for our platform. You will conduct user research, create wireframes and prototypes, and work closely with engineering to bring designs to life.',
            'Sales Representative' => 'Drive growth by acquiring new pharmacy customers across Tanzania and East Africa. You will manage the full sales cycle from prospecting to closing.',
            'Marketing Lead' => 'Lead our marketing efforts to build brand awareness and drive customer acquisition. You will manage digital marketing campaigns, content strategy, and brand partnerships.',
            'Customer Success Manager' => 'Ensure our pharmacy customers achieve their goals using our platform. You will onboard new customers, provide training, and drive product adoption.',
            'Financial Analyst' => 'Analyze financial data and provide insights to drive business decisions. You will build financial models, track KPIs, and support strategic planning.',
        ];

        $requirements = [
            'Senior Full-Stack Developer' => '5+ years of experience with Laravel and React. Strong understanding of RESTful APIs, database design, and cloud services. Experience with team leadership is a plus.',
            'Product Manager' => '3+ years of product management experience. Strong analytical skills and experience with agile methodologies. Healthcare/fintech experience is a plus.',
            'UI/UX Designer' => '3+ years of UI/UX design experience. Proficiency with Figma. Experience designing SaaS products is preferred.',
            'Sales Representative' => '2+ years of B2B sales experience. Excellent communication skills. Experience in healthcare or pharmaceutical industry is a plus.',
        ];

        $responsibilities = [
            'Senior Full-Stack Developer' => 'Design and implement new features. Mentor junior developers. Conduct code reviews. Ensure code quality and test coverage. Collaborate with product and design teams.',
            'Product Manager' => 'Define product roadmap. Conduct user research. Prioritize features. Work with engineering on sprint planning. Track and analyze product metrics.',
            'UI/UX Designer' => 'Conduct user research. Create wireframes and prototypes. Design UI components. Collaborate with engineers. Maintain design system.',
        ];

        // First job: Commercial Manager (real posting)
        JobListing::create([
            'title' => 'Commercial Manager',
            'department' => 'Operations',
            'location' => 'Tanzania',
            'type' => 'full_time',
            'description' => 'We are seeking an experienced Commercial Manager to lead our commercial strategy and drive business growth across Africa. This role is critical in shaping the future of pharmacy management on the continent.',
            'requirements' => "• Bachelor's degree in Business Administration, Marketing, or related field\n• 5+ years of commercial management experience\n• Strong strategic planning and analytical skills\n• Proven track record in business development and revenue growth\n• Excellent leadership and communication skills\n• Experience in healthcare or pharmaceutical industry is a plus",
            'responsibilities' => "1. Strategic Planning\nDevelop and execute commercial strategies to drive business growth and achieve company goals.\n\n2. Customer Acquisition\nIdentify new business opportunities and implement effective plans to acquire and retain customers.\n\n3. Marketing Strategy\nDesign and implement marketing strategies that strengthen brand presence and drive revenue growth.\n\n4. Revenue Management\nSet pricing strategies, manage revenue streams, and optimize commercial performance across all channels.\n\n5. Partnership Development\nBuild and maintain strategic partnerships with key stakeholders, suppliers, and industry players.",
            'salary_range' => 'Competitive',
            'status' => 'active',
            'is_hot' => true,
            'is_new' => true,
            'closes_at' => now()->addDays(30),
            'created_at' => now(),
        ]);

        $jobCount = 35;
        $jobs = [];

        for ($i = 0; $i < $jobCount; $i++) {
            $dept = $faker->randomElement($departments);
            $titles = $jobTitles[$dept];
            $title = $faker->randomElement($titles);
            $type = $faker->randomElement($types);
            $status = $faker->randomElement($statuses);

            $jobs[] = JobListing::create([
                'title' => $title,
                'department' => $dept,
                'location' => $faker->randomElement($locations),
                'type' => $type,
                'description' => $descriptions[$title] ?? $faker->paragraphs(3, true),
                'requirements' => $requirements[$title] ?? $faker->paragraphs(2, true),
                'responsibilities' => $responsibilities[$title] ?? $faker->paragraphs(2, true),
                'salary_range' => $faker->randomElement(['TZS 800,000 - 1,500,000/mo', 'TZS 1,500,000 - 3,000,000/mo', 'TZS 3,000,000 - 5,000,000/mo', 'TZS 5,000,000 - 8,000,000/mo', 'Competitive', 'Negotiable']),
                'status' => $status,
                'is_hot' => $faker->boolean(20),
                'is_new' => $faker->boolean(30),
                'closes_at' => $faker->optional(0.7)->dateTimeBetween('+1 week', '+3 months'),
                'created_at' => $faker->dateTimeBetween('-60 days', 'now'),
            ]);
        }

        $applicationStatuses = ['pending', 'reviewed', 'shortlisted', 'interviewed', 'hired', 'rejected'];
        $firstNames = ['John', 'Maria', 'Amina', 'Hassan', 'Grace', 'David', 'Fatima', 'Peter', 'Neema', 'Joseph', 'Sarah', 'Emmanuel', 'Aisha', 'Michael', 'Rebecca', 'Ibrahim', 'Catherine', 'Daniel', 'Martha', 'Samuel', 'Eva', 'Benson', 'Janet', 'Charles', 'Purity', 'Ismail', 'Agnes', 'George', 'Lilian', 'Anthony', 'Joyce', 'Richard', 'Mercy', 'Felix', 'Evelyn', 'Patrick', 'Diana', 'Stephen', 'Rose', 'Andrew', 'Alice', 'Benjamin', 'Sandra', 'Marcus', 'Helen', 'Oscar', 'Gladys', 'Vincent', 'Priscilla', 'Kevin'];
        $lastNames = ['Mwaikenda', 'Kimaro', 'Ali', 'Ochieng', 'Mushi', 'Nguyen', 'Kamau', 'Bakari', 'Mrosso', 'Onyango', 'Mkwapata', 'Juma', 'Shirima', 'Mwaipopo', 'Lugendo', 'Hassan', 'Mwamba', 'Kilonzo', 'Mwasote', 'Odhiambo', 'Mkwizu', 'Nyerere', 'Mandela', 'Kiplagat', 'Mwakasege', 'Salum', 'Mwaisanga', 'Kabongo', 'Mwaskolola', 'Chacha'];

        foreach ($jobs as $job) {
            if ($job->status !== 'active') continue;

            $appCount = $faker->numberBetween(1, 8);
            for ($a = 0; $a < $appCount; $a++) {
                $fn = $faker->randomElement($firstNames);
                $ln = $faker->randomElement($lastNames);
                JobApplication::create([
                    'job_listing_id' => $job->id,
                    'full_name' => $fn . ' ' . $ln,
                    'email' => strtolower($fn) . '.' . strtolower($ln) . '@' . $faker->freeEmailDomain(),
                    'phone' => '+255' . $faker->numerify('7## ### ###'),
                    'cover_letter' => $faker->paragraphs(2, true),
                    'portfolio_url' => $faker->optional(0.3)->url(),
                    'linkedin_url' => $faker->optional(0.4)->url(),
                    'status' => $faker->randomElement($applicationStatuses),
                    'admin_notes' => $faker->optional(0.4)->sentence(),
                    'created_at' => $faker->dateTimeBetween('-30 days', 'now'),
                ]);
            }
        }
    }
}
