import { db } from './index';
import { departments, users } from './schema';
import { hash } from 'bcryptjs';

async function seed() {
    console.log('Seeding database...');

    // Create Departments
    const depts = await db.insert(departments).values([
        { name: 'Engenharia', description: 'Departamento de Engenharia' },
        { name: 'RH', description: 'Recursos Humanos' },
        { name: 'Financeiro', description: 'Departamento Financeiro' },
    ]).returning();

    console.log('Departments created:', depts);

    const engDept = depts.find(d => d.name === 'Engenharia');

    if (engDept) {
        // Create Admin User
        const hashedPassword = await hash('123456', 10);

        await db.insert(users).values({
            name: 'Admin User',
            email: 'admin@flexin.com',
            passwordHash: hashedPassword,
            departmentId: engDept.id,
            isAdmin: true,
            emailVerifiedAt: new Date(),
        });

        console.log('Admin user created');
    }

    console.log('Seeding complete.');
}

seed().catch(console.error);
