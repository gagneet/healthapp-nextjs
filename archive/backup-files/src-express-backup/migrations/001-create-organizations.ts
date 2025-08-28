// src/migrations/001-create-organizations.ts
'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    // Check if organizations table already exists
    const tableExists = await queryInterface.tableExists('organizations');
    if (tableExists) {
      console.log('ℹ️ Table "organizations" already exists, skipping creation');
      return;
    }

    // Create organizations table
    await queryInterface.createTable('organizations', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING(100),
        defaultValue: 'clinic',
      },
      license_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      contact_info: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      address: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes (with idempotent checks)
    try {
      await queryInterface.addIndex('organizations', ['name'], { name: 'idx_organizations_name' });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }
    
    try {
      await queryInterface.addIndex('organizations', ['type'], { name: 'idx_organizations_type' });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }
    
    try {
      await queryInterface.addIndex('organizations', ['isActive'], { name: 'idx_organizations_is_active' });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }
  },

  down: async (queryInterface: any, Sequelize: any) => {
    await queryInterface.dropTable('organizations');
  }
};