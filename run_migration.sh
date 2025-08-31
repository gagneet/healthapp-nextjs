#!/bin/bash
set -a # automatically export all variables
source env_files/.env.development
set +a
npx prisma migrate dev --name add_doctor_bio
