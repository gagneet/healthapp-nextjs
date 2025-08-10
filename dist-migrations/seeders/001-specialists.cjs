// src/seeders/001-specialities.js
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    up: async (queryInterface, Sequelize) => {
        console.log('🎩 Seeding medical specialities (idempotent)...');
        // Check if specialities already exist
        const existingSpecialities = await queryInterface.sequelize.query("SELECT COUNT(*) as count FROM specialities", { type: Sequelize.QueryTypes.SELECT });
        if (existingSpecialities[0].count > 0) {
            console.log(`ℹ️ Specialities already exist (${existingSpecialities[0].count} found), skipping seeding`);
            return;
        }
        await queryInterface.bulkInsert('specialities', [
            {
                id: 1,
                name: 'Cardiology',
                description: 'Heart and cardiovascular system specialist',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 2,
                name: 'Endocrinology',
                description: 'Hormonal disorders and diabetes specialist',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 3,
                name: 'General Medicine',
                description: 'General medical practice',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 4,
                name: 'Pediatrics',
                description: 'Children\'s health specialist',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 5,
                name: 'Orthopedics',
                description: 'Bone and joint specialist',
                created_at: new Date(),
                updated_at: new Date(),
            }
        ], { ignoreDuplicates: true });
        console.log('✅ Medical specialities seeded successfully');
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('specialities', null, {});
    }
};
//# sourceMappingURL=001-specialists.js.map