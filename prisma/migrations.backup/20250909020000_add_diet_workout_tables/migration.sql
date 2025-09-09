-- CreateTable
CREATE TABLE "public"."DietPlan" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(1000) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(100),
    "total_calories" DECIMAL(10,2),
    "start_date" DATE,
    "end_date" DATE,
    "details" JSONB,
    "expired_on" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "DietPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkoutPlan" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(100),
    "total_calories" DECIMAL(10,2),
    "start_date" DATE,
    "end_date" DATE,
    "time" TIMESTAMP(3),
    "details" JSONB,
    "expired_on" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "WorkoutPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CarePlanToDietPlan" (
    "carePlanId" UUID NOT NULL,
    "dietPlanId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "CarePlanToDietPlan_pkey" PRIMARY KEY ("carePlanId","dietPlanId")
);

-- CreateTable
CREATE TABLE "public"."CarePlanToWorkoutPlan" (
    "carePlanId" UUID NOT NULL,
    "workoutPlanId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "CarePlanToWorkoutPlan_pkey" PRIMARY KEY ("carePlanId","workoutPlanId")
);

-- CreateIndex
CREATE UNIQUE INDEX "DietPlan_name_key" ON "public"."DietPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutPlan_name_key" ON "public"."WorkoutPlan"("name");

-- AddForeignKey
ALTER TABLE "public"."CarePlanToDietPlan" ADD CONSTRAINT "CarePlanToDietPlan_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."carePlans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CarePlanToDietPlan" ADD CONSTRAINT "CarePlanToDietPlan_dietPlanId_fkey" FOREIGN KEY ("dietPlanId") REFERENCES "public"."DietPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CarePlanToWorkoutPlan" ADD CONSTRAINT "CarePlanToWorkoutPlan_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."carePlans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CarePlanToWorkoutPlan" ADD CONSTRAINT "CarePlanToWorkoutPlan_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "public"."WorkoutPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;