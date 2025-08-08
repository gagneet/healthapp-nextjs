'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if columns already exist (idempotent)
      const tableDescription = await queryInterface.describeTable('clinics');
      
      // Add geo-location columns to clinics table (idempotent)
      if (!tableDescription.latitude) {
        await queryInterface.addColumn('clinics', 'latitude', {
          type: Sequelize.DECIMAL(10, 8),
          allowNull: true,
          comment: 'Latitude coordinate for maps and location services'
        }, { transaction });
      }

      if (!tableDescription.longitude) {
        await queryInterface.addColumn('clinics', 'longitude', {
          type: Sequelize.DECIMAL(11, 8),
          allowNull: true, 
          comment: 'Longitude coordinate for maps and location services'
        }, { transaction });
      }

      if (!tableDescription.location_verified) {
        await queryInterface.addColumn('clinics', 'location_verified', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether the location has been verified via geocoding'
        }, { transaction });
      }

      if (!tableDescription.location_accuracy) {
        await queryInterface.addColumn('clinics', 'location_accuracy', {
          type: Sequelize.STRING(20),
          allowNull: true,
          comment: 'Geocoding accuracy level (ROOFTOP, RANGE_INTERPOLATED, GEOMETRIC_CENTER, APPROXIMATE)'
        }, { transaction });
      }

      // Add indexes for efficient geo-spatial queries (idempotent)
      try {
        await queryInterface.addIndex('clinics', ['latitude', 'longitude'], {
          name: 'idx_clinics_coordinates',
          transaction
        });
      } catch (indexError: any) {
        if (!indexError.message.includes('already exists')) {
          throw indexError;
        }
      }

      try {
        await queryInterface.addIndex('clinics', ['location_verified'], {
          name: 'idx_clinics_location_verified', 
          transaction
        });
      } catch (indexError: any) {
        if (!indexError.message.includes('already exists')) {
          throw indexError;
        }
      }

      await transaction.commit();
      console.log('✅ Successfully added geo-location fields to clinics table');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error adding geo-location fields:', error);
      throw error;
    }
  },

  down: async (queryInterface: any, Sequelize: any) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove indexes first
      await queryInterface.removeIndex('clinics', 'idx_clinics_coordinates', { transaction });
      await queryInterface.removeIndex('clinics', 'idx_clinics_location_verified', { transaction });
      
      // Remove columns
      await queryInterface.removeColumn('clinics', 'latitude', { transaction });
      await queryInterface.removeColumn('clinics', 'longitude', { transaction });
      await queryInterface.removeColumn('clinics', 'location_verified', { transaction });
      await queryInterface.removeColumn('clinics', 'location_accuracy', { transaction });

      await transaction.commit();
      console.log('✅ Successfully removed geo-location fields from clinics table');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing geo-location fields:', error);
      throw error;
    }
  }
};