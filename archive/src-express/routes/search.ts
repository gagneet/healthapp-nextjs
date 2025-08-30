// src/routes/search.js
import express from 'express';
import { Medicine, Speciality } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { Op } from 'sequelize';
import { parseQueryParamAsInt, parseQueryParam } from '../utils/queryHelpers.js';

const router = express.Router();

// GET /api/medicines?value=metformin
router.get('/medicines',
  authenticate,
  async (req, res, next): Promise<void> => {
    try {
      const value = parseQueryParam(req.query.value);
      const limitNum = parseQueryParamAsInt(req.query.limit, 10);

      if (!value) {
        res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Search value is required'
            }
          }
        });
        return;
      }

      const medicines = await Medicine.findAll({
        where: {
          name: { [Op.like]: `%${value}%` },
          public_medicine: true
        },
        limit: limitNum,
        order: [['name', 'ASC']]
      });

      const responseData = { medicines: {} };

      medicines.forEach((medicine: any) => {
        (responseData as any).medicines[medicine.id] = {
          basic_info: {
            id: medicine.id.toString(),
            name: medicine.name,
            type: medicine.type,
            strength: medicine.details?.strength || '',
            generic_name: medicine.details?.generic_name || '',
            description: medicine.description
          }
        };
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          message: 'Medicines found'
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/specialities
router.get('/specialities',
  authenticate,
  async (req, res, next) => {
    try {
      const specialities = await Speciality.findAll({
        order: [['name', 'ASC']]
      });

      const responseData = { specialities: {} };

      specialities.forEach((specialty: any) => {
        (responseData as any).specialities[specialty.id] = {
          basic_info: {
            id: specialty.id.toString(),
            name: specialty.name,
            description: specialty.description
          }
        };
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          message: 'Specialities retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
