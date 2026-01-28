---

# **Healthcare Management Platform — Implementation Plan**

A unified ecosystem for Patients, Doctors, and Healthcare Service Providers (HSPs), focused on adherence, remote monitoring, and chronic disease management for the Indian Subcontinent (global‑ready).

---

## 📌 Goal Overview

### **Patient Portal**
- Medication, Diet & Exercise Adherence
- Health Tracking
- Engagement & Reminders
- Messaging, Lab Results, Video Consultations, Goals, Gamification, Caregiver Access, Education

### **Doctor Portal**
- Remote Patient Monitoring (RPM)  
- Prescription Management  
- Clinical Oversight  

### **HSP Portal**
- Non‑medication Treatment Plans (Ayurveda, Physio, Nursing, etc.)  
- Service Delivery  
- Patient Monitoring  

### **Geography**
- India / Indian Subcontinent  
- Focus: Adherence & Chronic Disease Management  

---

## **⚠️ User Review Required**

### **HSP Role Definition**
HSPs (Nurses, Physiotherapists, etc.) **cannot prescribe medications**.  
They manage:
- `ServicePlan`
- `TreatmentPlan` (non‑medication)

Schema supports this; UI implementation pending.

### **Schema Expansion**
Large schema update required (details below).

### **Data Privacy**
Must comply with **HIPAA / DISHA** for cross‑role data sharing.

---

## **🗄️ Proposed Changes**

### **1. Database Schema**

**File:** `prisma/schema.prisma`

#### **Existing Patient Module**
- `MedicationLog`
- `DietPlan`
- `ExercisePlan`
- `HealthGoal`
- etc.

#### **New Doctor / HSP Additions**
- **`MonitoringAlert`** — RPM alerts (abnormal vitals, missed meds)  
- **`TreatmentSession`** — Logs for physio, ayurveda, rehab sessions  
- **`CareTeamCollaboration`** — Shared notes/chat between Doctor & HSP  

---

## **2. Phase 1 — Medication Adherence (Patient Side)**

**Focus:** Core adherence loop.

**API**
- `GET /api/patient/medications`
- `POST /api/patient/medications/log`

**UI**
- Patient Dashboard with **Today’s Meds** checklist

**Refills**
- Patient → Doctor refill request workflow

---

## **3. Phase 2 — Doctor Remote Monitoring**

**Dashboard:** `app/dashboard/doctor/monitoring`

**Features**
- Patient List filtered by **Adherence Risk** (High / Medium / Low)  
- Real‑time Alerts:
  - High BP  
  - Missed Meds > 3 days  
- Prescription UI:
  - Configure **Adherence Rules** (e.g., “Alert if 3 doses missed”)

---

## **4. Phase 3 — HSP Treatment Management**

**Dashboard:** `app/dashboard/hsp` *(new)*

**Features**
- **My Patients** — Assigned for physio/home care  
- **Service Logging** — Home Visit, Physio Session, etc.  
- **Vitals Recording** — Nurse logs vitals during visits  
- **Plan Management** — Create/Edit non‑medication `TreatmentPlan`  

---

## ✅ Patient Portal Implementation Status
- Implemented: medication adherence, diet/exercise tracking, vitals alerts, appointments, care plans, settings.
- Implemented: messaging, lab results, video consultations, goals, gamification, caregiver access, education pages + APIs.
- Pending: medication side effects/refill UI, patient alerts/notification center, video consult booking workflow polish, caregiver invite UX.

## **5. Shared Features (All Roles)**

- **Secure Messaging** — Patient ↔ Doctor ↔ HSP  
- **Profile & Settings** — Language, Timezone (IST default)  

---

# **🧪 Verification Plan**

## **Automated Tests**
Scripts validating each role’s critical path:

- `verify-patient-meds.ts` — Patient logs meds  
- `verify-doctor-alerts.ts` — Doctor receives missed‑meds alert  
- `verify-hsp-service.ts` — HSP logs service session  

## **Manual Verification**
Role‑switching scenario:
1. Log in as **Patient** → Log **High BP**  
2. Log in as **Doctor** → Dashboard shows **High BP Alert**  

---

