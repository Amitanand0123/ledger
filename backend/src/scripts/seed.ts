import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding process...');

    // --- Seed Job Platforms ---
    console.log('Seeding job platforms...');
    await prisma.jobPlatform.createMany({
        data: [
            { name: 'LinkedIn' },
            { name: 'Indeed' },
            { name: 'Wellfound (AngelList)' },
            { name: 'Glassdoor' },
            { name: 'Company Website' },
            { name: 'Referral' },
            { name: 'Other' },
        ],
        skipDuplicates: true, // Don't throw an error if a platform already exists
    });
    console.log('Platforms seeded successfully.');

    // --- Seed a Test User ---
    console.log('Seeding test user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const testUser = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            name: 'Test User',
            password: hashedPassword,
        },
    });
    console.log(`Test user "${testUser.name}" seeded with id: ${testUser.id}`);

    // --- Seed a Personal Job Board for the Test User ---
    console.log(`Seeding job applications for ${testUser.name}...`);
    const linkedInPlatform = await prisma.jobPlatform.findUnique({
        where: { name: 'LinkedIn' },
    });
    const indeedPlatform = await prisma.jobPlatform.findUnique({
        where: { name: 'Indeed' },
    });

    await prisma.jobApplication.create({
        data: {
            company: 'Tech Innovators Inc.',
            position: 'Senior Frontend Developer',
            location: 'Remote',
            status: 'INTERVIEW_1',
            order: 0,
            userId: testUser.id,
            salary: '$140,000 - $160,000 per year',
            salaryMin: 140000,
            salaryMax: 160000,
            platformId: linkedInPlatform?.id,
            description:
                'Seeking an experienced frontend developer proficient in React and Next.js to lead our new design system implementation.',
            statusHistory: {
                create: [
                    { status: 'PENDING' },
                    { status: 'SHORTLISTED' },
                    { status: 'INTERVIEW_1' },
                ],
            },
        },
    });

    await prisma.jobApplication.create({
        data: {
            company: 'Data Analytics Corp',
            position: 'Data Scientist',
            location: 'New York, NY',
            status: 'OA',
            order: 1,
            userId: testUser.id,
            salary: '$125,000/year',
            salaryMin: 125000,
            salaryMax: 125000,
            platformId: indeedPlatform?.id,
            description:
                'Entry-level Data Scientist position. Requires knowledge of Python, Pandas, and SQL.',
            statusHistory: {
                create: [{ status: 'PENDING' }, { status: 'OA' }],
            },
        },
    });

    await prisma.jobApplication.create({
        data: {
            company: 'CloudNet Solutions',
            position: 'DevOps Engineer',
            location: 'Austin, TX',
            status: 'PENDING',
            order: 2,
            userId: testUser.id,
            salary: '130k',
            salaryMin: 130000,
            salaryMax: 130000,
            description:
                'Manage and scale our cloud infrastructure on AWS. Experience with Kubernetes and Terraform is a must.',
            statusHistory: {
                create: [{ status: 'PENDING' }],
            },
        },
    });
    console.log('Job applications seeded successfully.');

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error('An error occurred during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
