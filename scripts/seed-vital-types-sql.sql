-- Seed VitalTypes table with standard vital signs
-- Run: PGPASSWORD='secure_pg_password' psql -h /var/run/postgresql -U healthapp_user -d healthapp_prod -f scripts/seed-vital-types-sql.sql

-- Check if table exists and has data
SELECT 'Current VitalTypes count:' as info, COUNT(*) FROM "vitalTypes";

-- Insert vital types (with UUID generation)
INSERT INTO "vitalTypes" (id, name, unit, "normalRangeMin", "normalRangeMax", description, "validationRules", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Blood Pressure', 'mmHg', 90, 140, 'Systolic blood pressure measurement', '{"type": "compound", "fields": ["systolic", "diastolic"], "systolicRange": [70, 200], "diastolicRange": [40, 130]}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'Heart Rate', 'bpm', 60, 100, 'Resting heart rate', '{"type": "single", "min": 40, "max": 200}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'Body Temperature', '°F', 97.0, 99.0, 'Body temperature in Fahrenheit', '{"type": "single", "min": 95.0, "max": 106.0}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'Weight', 'lbs', NULL, NULL, 'Body weight in pounds', '{"type": "single", "min": 50, "max": 600}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'Blood Glucose', 'mg/dL', 70, 140, 'Blood glucose level', '{"type": "single", "min": 40, "max": 600, "fasting": {"min": 70, "max": 100}, "postMeal": {"min": 70, "max": 140}}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'Oxygen Saturation', '%', 95, 100, 'Blood oxygen saturation level (SpO2)', '{"type": "single", "min": 70, "max": 100}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'Respiratory Rate', 'breaths/min', 12, 20, 'Number of breaths per minute', '{"type": "single", "min": 8, "max": 40}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'Height', 'inches', NULL, NULL, 'Height in inches', '{"type": "single", "min": 36, "max": 96}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'BMI', 'kg/m²', 18.5, 24.9, 'Body Mass Index', '{"type": "calculated", "formula": "weight(kg) / (height(m))^2", "min": 10, "max": 60}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'Pulse', 'bpm', 60, 100, 'Pulse rate', '{"type": "single", "min": 40, "max": 200}'::jsonb, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
  unit = EXCLUDED.unit,
  "normalRangeMin" = EXCLUDED."normalRangeMin",
  "normalRangeMax" = EXCLUDED."normalRangeMax",
  description = EXCLUDED.description,
  "validationRules" = EXCLUDED."validationRules",
  "updatedAt" = NOW();

-- Display inserted vital types
SELECT 'Vital types after seeding:' as info;
SELECT id, name, unit, "normalRangeMin", "normalRangeMax" FROM "vitalTypes" ORDER BY name;
