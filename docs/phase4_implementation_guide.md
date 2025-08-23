# Phase 4 Implementation Guide

## 🚀 What Was Implemented & How to Use It – Audio, Chat and Video

I have successfully implemented the core features of the Video Consultation Platform by integrating the **Daily.co WebRTC** service.

### 🔑 Key Features

- **Real-time Video & Audio Calls**: Patients and doctors can join a secure video call.
- **In-Call Chat**: A real-time text chat is available during the consultation.
- **Screen Sharing**: Participants can share their screen.
- **Cloud Recording**: Doctors can record the consultation for compliance and follow-up purposes.

---

### 🧑‍⚕️ How to Use the Feature

#### Creating a Consultation (for Doctors)

> POST /api/video-consultations/room

Request Body:

```json
{
  "patientId": "string",
  "scheduledStartTime": "string"
}
```

Response:

```json
{
  "roomUrl": "string",
  "...otherDetails": "string"
}
```

- Make a `POST` request to `/api/video-consultations/room`.
- Include `patientId` and `scheduledStartTime` in the request body.
- The response will contain the `roomUrl` for the video call.

#### Joining a Consultation (for Doctors & Patients)

- Both parties use the same `roomUrl` to join.
- Integrate this URL into your UI (e.g., a "Join Call" button).
- The `VideoConsultationRoom` component handles joining with a secure, short-lived token.

---

### 🎛️ In-Call Controls

- **Video/Audio**: Toggle camera and microphone.
- **Screen Sharing**: Click "Share Screen" to share.
- **Chat**: Open the chat panel for real-time messaging.
- **Recording (Doctor only)**: Doctors can start/stop recording with a "Record" button. A visual indicator shows when recording is active.

---

## 🛠️ Environment Setup (New Variables)

Add the following to your `.env` files (`env_files/.env.development`, `env_files/.env.production`, etc.):

```env
DAILY_API_KEY=your_daily_api_key
DAILY_API_URL=https://api.daily.co/v1
```

### 🔐 How to Get Your `DAILY_API_KEY`

1. Sign up at [Daily.co](https://www.daily.co).
2. Go to the **Developers** section in your dashboard.
3. Copy your API key.

#### Environment Notes

- **Development/Testing**: You can use a dev-mode API key. A fallback is included for local testing.
- **Production**: Use a production API key for live deployments.

---

## 🔄 Migrating to Agora or Twilio in the Future

The implementation is modular to support future migration.

### Backend Changes

Update `lib/services/VideoConsultationService.ts`:

```typescript
// Replace this:
createDailyRoom()

// With:
createAgoraRoom() // or createTwilioRoom()
```

- Replace the `createDailyRoom` method with one using Agora or Twilio REST API.
- Public methods like `createConsultation` are generic—just swap the internal logic.

### Frontend Changes

Update `VideoConsultationRoom.tsx`:

```typescript
// Replace Daily.co SDK
import { DailyProvider } from '@daily-co/daily-react'

// With Agora or Twilio SDK
import { AgoraProvider } from 'agora-react-sdk' // example
```

- Replace `@daily-co/daily-react` with the appropriate SDK.
- Rewrite the component to use the new provider’s hooks and media stream logic.

### Token Generation API Route

Update `/api/video-consultations/token`:

```typescript
// Replace Daily token logic
generateDailyToken()

// With:
generateAgoraToken() // or generateTwilioToken()
```

- Implement token generation using the provider’s secure mechanism.

---

By isolating provider-specific logic in the service and component layers, migration becomes streamlined and maintainable.

---

Absolutely, Gagneet! Here's your full implementation summary beautifully formatted in **Markdown**, with proper headings, code blocks, and structure for readability and documentation clarity:

---

## 🧪 Summary of Implementation – Laboratory Integration System

Successfully implemented the core backend infrastructure for the Laboratory Integration System. Here's a breakdown of the work completed:

---

### 📡 New API Routes

- `POST /api/lab-results`: Secure webhook for external labs to push results.
- `GET, POST /api/lab-integrations`: Admin-only endpoint to manage lab provider configurations.
- `GET /api/lab-analytics/trends`: Retrieves historical lab result data for trend analysis.

---

### 🧰 Generic Lab API Client

Created:

```typescript
// lib/lab-integrations/GenericLabClient.ts
```

- Acts as a standardized wrapper for external lab APIs.
- Extensible design for adding new lab providers.

---

### 🧬 Service Layer Integration

Updated:

```typescript
// lib/services/LaboratoryService.ts
```

- Uses `GenericLabClient` for submitting lab orders.
- Added `getLabTrendAnalysis` method to fetch historical lab data.

---

### 🗃️ Database Schema Update

Modified:

```prisma
// prisma/schema.prisma
model LabOrder {
  ...other code
  external_lab_order_id String?
}
```

- Added `external_lab_order_id` to store external lab system order ID.

---

### ✅ Testing

Added:

```javascript
// tests/phase4/telemedicine-laboratory.test.js
```

- Verifies data structures of new features.
- Follows existing test style.

---

### 🐞 Bug Fix

Resolved syntax error in:

```typescript
// lib/services/VideoConsultationService.ts
```

- Fix restored test suite functionality.

---

### 🧪 How to Use the New Features

#### 1. Lab Results Webhook

- **Endpoint**: `POST /api/lab-results`
- **Purpose**: Receive lab results from external systems.
- **Security**: Requires `x-api-key` header matching `LAB_WEBHOOK_API_KEY`.

##### Payload Example

```json
{
  "orderId": "your-internal-order-uuid",
  "testResults": [
    {
      "testCode": "HBA1C",
      "testName": "Hemoglobin A1C",
      "result": "7.8",
      "unit": "%",
      "referenceRange": "4.0-5.6",
      "status": "abnormal",
      "flag": "high",
      "notes": "Patient is above the recommended threshold."
    }
  ],
  "labId": "QUEST_DIAGNOSTICS",
  "collectedAt": "2025-01-16T08:00:00Z",
  "processedAt": "2025-01-16T14:00:00Z",
  "reviewedBy": "Dr. Smith"
}
```

---

#### 2. Lab Trend Analysis

- **Endpoint**: `GET /api/lab-analytics/trends`
- **Purpose**: Retrieve historical lab results for a patient.

##### Query Parameters

- `patientId` (string, required)
- `testCode` (string, required)

##### Example

```http
GET /api/lab-analytics/trends?patientId=...&testCode=HBA1C
```

##### Response

```json
[
  { "result_date": "2025-01-10T00:00:00.000Z", "numeric_value": 7.2 },
  { "result_date": "2025-04-12T00:00:00.000Z", "numeric_value": 6.8 }
]
```

---

### ⚙️ Environment Variables

Add to `.env.local`, `.env.development`, `.env.production`:

```env
LAB_WEBHOOK_API_KEY=your_secure_webhook_key
QUEST_API_KEY=your_quest_api_key
LABCORP_API_KEY=your_labcorp_api_key
```

#### 🔄 TEST vs PROD

- **TEST**: Use sandbox API keys and URLs.
- **PROD**: Use production-grade credentials.
- **Recommendation**: Store lab integration configs in a secure database table for dynamic management.

---

### 🧩 How to Add a New Lab System

#### Step 1: Create a New Client Class

```typescript
// lib/lab-integrations/HealthLabsClient.ts
import { GenericLabClient, LabOrderPayload } from './GenericLabClient';

export class HealthLabsClient extends GenericLabClient {
  async submitOrder(payload: LabOrderPayload) {
    console.log('Submitting order using HealthLabsClient');

    const healthLabsPayload = {
      order_ref: payload.orderNumber,
      patient_details: payload.patient,
      // ... other transformations
    };

    // const response = await fetch(`${this.config.apiUrl}/orders`, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
    //   body: JSON.stringify(healthLabsPayload),
    // });

    return {
      success: true,
      externalOrderId: `HL-${payload.orderNumber}`,
    };
  }
}
```

---

#### Step 2: Use the New Client in the Service Layer

```typescript
// lib/services/LaboratoryService.ts
import { HealthLabsClient } from '@/lib/lab-integrations/HealthLabsClient';

private async submitOrderToLab(order: any) {
  try {
    const labConfig = getLabConfiguration(); // Implement this logic

    let labClient;

    if (labConfig.id === 'healthlabs') {
      labClient = new HealthLabsClient(labConfig);
    } else {
      labClient = new GenericLabClient(labConfig);
    }

    const payload = { /* ... */ };
    const result = await labClient.submitOrder(payload);

    // ...
  } catch (error) {
    // ...
  }
}
```

---

Let me know if you'd like this bundled into a README or internal wiki format. I can also help you scaffold a migration checklist or CI validation script for new lab clients.
