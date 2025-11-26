import { db } from './index';
import { departments, users, bookings, swapRequests, appSettings } from './schema';
import { hash } from 'bcryptjs';
import { addDays, startOfWeek, format } from 'date-fns';

async function seed() {
    console.log('Seeding database...');

    // Clear existing data (in correct order due to foreign keys)
    console.log('Clearing existing data...');
    await db.delete(swapRequests);
    await db.delete(bookings);
    await db.delete(appSettings);
    await db.delete(users);
    await db.delete(departments);
    console.log('Database cleared.');


    // Create Departments
    await db.insert(departments).values([
        { name: 'Engenharia', description: 'Departamento de Engenharia' },
        { name: 'Produto', description: 'Departamento de Produto' },
        { name: 'Design', description: 'Departamento de Design' },
        { name: 'Marketing', description: 'Departamento de Marketing' },
    ]);

    // Query back the created departments (MySQL doesn't support RETURNING)
    const depts = await db.select().from(departments);
    console.log('Departments created:', depts);

    // Find departments by name
    const engDept = depts.find(d => d.name === 'Engenharia');
    const prodDept = depts.find(d => d.name === 'Produto');
    const designDept = depts.find(d => d.name === 'Design');
    const marketingDept = depts.find(d => d.name === 'Marketing');

    // Create Users matching mock data
    const hashedPassword = await hash('123456', 10);

    await db.insert(users).values([
        {
            name: 'Ana Silva',
            email: 'ana.silva@company.com',
            passwordHash: hashedPassword,
            departmentId: engDept?.id,
            isAdmin: true,
            emailVerifiedAt: new Date(),
            avatarUrl: 'https://i.pravatar.cc/150?img=1',
        },
        {
            name: 'Carlos Santos',
            email: 'carlos.santos@company.com',
            passwordHash: hashedPassword,
            departmentId: prodDept?.id,
            isAdmin: false,
            emailVerifiedAt: new Date(),
            avatarUrl: 'https://i.pravatar.cc/150?img=12',
        },
        {
            name: 'Marina Costa',
            email: 'marina.costa@company.com',
            passwordHash: hashedPassword,
            departmentId: designDept?.id,
            isAdmin: false,
            emailVerifiedAt: new Date(),
            avatarUrl: 'https://i.pravatar.cc/150?img=5',
        },
        {
            name: 'Pedro Alves',
            email: 'pedro.alves@company.com',
            passwordHash: hashedPassword,
            departmentId: engDept?.id,
            isAdmin: false,
            emailVerifiedAt: new Date(),
            avatarUrl: 'https://i.pravatar.cc/150?img=13',
        },
        {
            name: 'Julia Ferreira',
            email: 'julia.ferreira@company.com',
            passwordHash: hashedPassword,
            departmentId: marketingDept?.id,
            isAdmin: false,
            emailVerifiedAt: new Date(),
            avatarUrl: 'https://i.pravatar.cc/150?img=9',
        },
    ]);

    // Query back the created users
    const createdUsers = await db.select().from(users);
    console.log('Users created:', createdUsers.length);

    // Find users by email
    const ana = createdUsers.find(u => u.email === 'ana.silva@company.com');
    const carlos = createdUsers.find(u => u.email === 'carlos.santos@company.com');
    const marina = createdUsers.find(u => u.email === 'marina.costa@company.com');
    const pedro = createdUsers.find(u => u.email === 'pedro.alves@company.com');
    const julia = createdUsers.find(u => u.email === 'julia.ferreira@company.com');

    // Calculate dates for bookings (matching mock data pattern)
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });

    // Create Bookings matching mock data
    await db.insert(bookings).values([
        {
            userId: ana?.id!,
            date: new Date(format(addDays(weekStart, 0), 'yyyy-MM-dd')), // Monday
            status: 'confirmed' as const,
        },
        {
            userId: carlos?.id!,
            date: new Date(format(addDays(weekStart, 0), 'yyyy-MM-dd')), // Monday
            status: 'confirmed' as const,
        },
        {
            userId: marina?.id!,
            date: new Date(format(addDays(weekStart, 2), 'yyyy-MM-dd')), // Wednesday
            status: 'confirmed' as const,
        },
        {
            userId: pedro?.id!,
            date: new Date(format(addDays(weekStart, 2), 'yyyy-MM-dd')), // Wednesday
            status: 'confirmed' as const,
        },
        {
            userId: julia?.id!,
            date: new Date(format(addDays(weekStart, 2), 'yyyy-MM-dd')), // Wednesday
            status: 'confirmed' as const,
        },
        {
            userId: ana?.id!,
            date: new Date(format(addDays(weekStart, 4), 'yyyy-MM-dd')), // Friday
            status: 'confirmed' as const,
        },
    ]);

    console.log('Bookings created: 6');

    // Create Swap Requests matching mock data
    await db.insert(swapRequests).values([
        {
            requesterId: carlos?.id!,
            targetUserId: ana?.id!,
            requesterDate: new Date(format(addDays(weekStart, 0), 'yyyy-MM-dd')), // Monday
            targetDate: new Date(format(addDays(weekStart, 4), 'yyyy-MM-dd')), // Friday
            status: 'pending' as const,
            message: 'Preciso trocar por compromisso médico',
        },
        {
            requesterId: marina?.id!,
            targetUserId: pedro?.id!,
            requesterDate: new Date(format(addDays(weekStart, 2), 'yyyy-MM-dd')), // Wednesday
            targetDate: new Date(format(addDays(weekStart, 1), 'yyyy-MM-dd')), // Tuesday
            status: 'pending' as const,
            message: 'Reunião presencial agendada',
        },
    ]);

    console.log('Swap requests created: 2');

    // Create App Settings matching mock data
    await db.insert(appSettings).values({
        maxBookingsPerDay: 3,
        maxBookingsPerWeekPerUser: 2,
        allowedDays: [1, 2, 3, 4, 5], // Monday to Friday
        requireApprovalForBookings: false,
    });

    console.log('App settings created');

    console.log('Seeding complete.');
}

seed().catch(console.error);
