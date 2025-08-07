# Healthcare App Coding Rules & Standards

## 🛡️ **MANDATORY NULL SAFETY RULES**

### Rule 1: Always Use Null Safety Checks
**REQUIRED**: Every property access that could be `null` or `undefined` MUST use null safety.

❌ **NEVER DO:**
```typescript
const rating = profile.average_rating.toFixed(1)  // CRASHES if null
const name = doctor.basic_info.first_name         // CRASHES if basic_info is null
const count = data.adherence_summary.today.medications_taken  // CRASHES if nested null
```

✅ **ALWAYS DO:**
```typescript
const rating = profile.average_rating ? profile.average_rating.toFixed(1) : '0.0'
const name = doctor.basic_info?.first_name || 'Unknown'
const count = data?.adherence_summary?.today?.medications_taken ?? 0
```

### Rule 2: Provide User-Friendly Messages for Missing Data
**REQUIRED**: When data is missing, show helpful messages to users, not just empty fields.

❌ **NEVER DO:**
```tsx
<span>{patient.last_visit}</span>  // Shows nothing if null
<span>{formatDate(date)}</span>    // Shows "N/A" - not helpful
```

✅ **ALWAYS DO:**
```tsx
<span>
  {patient.last_visit ? formatDate(patient.last_visit) : (
    <span className="text-gray-400 italic">No previous visits</span>
  )}
</span>

<span>
  {patient.adherence_rate !== null ? `${patient.adherence_rate}%` : (
    <span className="text-gray-400 italic">No medication data</span>
  )}
</span>
```

### Rule 3: Use Early Returns/Guards for Component Protection
**REQUIRED**: Protect entire components from null data using guard clauses.

✅ **ALWAYS DO:**
```typescript
const ComponentPage = () => {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Loading guard
  if (isLoading) {
    return <LoadingSpinner />
  }

  // Null data guard with user-friendly retry
  if (!data) {
    return (
      <div className="text-center py-12">
        <p>Unable to load data</p>
        <button onClick={fetchData}>Retry</button>
      </div>
    )
  }

  // Now safe to access data properties
  return <div>{data.someProperty}</div>
}
```

---

## 🔄 **FIELD CONSISTENCY RULES**

### Rule 4: Frontend-Backend Field Mapping Must Match
**REQUIRED**: Field names between frontend interfaces and backend responses MUST be consistent.

❌ **PROBLEMATIC PATTERN:**
```typescript
// Frontend Interface
interface DoctorProfile {
  rating: number          // ❌ Mismatch
  license_number: string  // ❌ Mismatch
}

// Backend Response
{
  average_rating: 4.5,        // ❌ Different field name
  medical_license_number: "123" // ❌ Different field name
}
```

✅ **CORRECT PATTERN:**
```typescript
// Frontend Interface - Match Backend Exactly
interface DoctorProfile {
  average_rating: number | null
  medical_license_number: string
}

// Backend Response
{
  average_rating: 4.5,
  medical_license_number: "123"
}
```

### Rule 5: Database-Backend-Frontend Alignment
**REQUIRED**: Field names must be consistent across all three layers.

✅ **ALIGNMENT EXAMPLE:**
```sql
-- Database Schema
CREATE TABLE doctors (
  medical_license_number VARCHAR(50),
  average_rating DECIMAL(3,2)
);
```

```javascript
// Backend Controller
const responseData = {
  medical_license_number: doctor.medical_license_number,  // ✅ Matches DB
  average_rating: doctor.average_rating                   // ✅ Matches DB
}
```

```typescript
// Frontend Interface
interface DoctorProfile {
  medical_license_number: string      // ✅ Matches Backend & DB
  average_rating: number | null       // ✅ Matches Backend & DB
}
```

### Rule 6: Type Safety in Comparisons
**REQUIRED**: Ensure type-safe comparisons, especially with IDs.

❌ **NEVER DO:**
```typescript
const selectedId: string = '123'
const patient = patients.find(p => p.id === selectedId)  // ❌ Type mismatch if id is number
```

✅ **ALWAYS DO:**
```typescript
const selectedId: string = '123'
const patient = patients.find(p => String(p.id) === selectedId)  // ✅ Type-safe
// OR ensure consistent types from the start
```

---

## 📝 **CODE CREATION RULES**

### Rule 7: New Component Checklist
**REQUIRED**: Every new component/page MUST include:

1. **Null Safety Guards**:
   - Loading states
   - Error states  
   - Missing data handling

2. **User-Friendly Messages**:
   - "No data available" instead of empty fields
   - "Loading..." for async operations
   - "Error occurred, please retry" with retry button

3. **Type Safety**:
   - Proper TypeScript interfaces
   - Null checks before method calls (`.toFixed()`, `.toLowerCase()`, etc.)
   - Safe array access with fallbacks

### Rule 8: API Integration Requirements
**REQUIRED**: When creating new API integrations:

1. **Backend Response Structure**:
   ```javascript
   // Always include null safety in backend
   const responseData = {
     field_name: data?.field_name || fallbackValue,
     nested_object: data?.nested?.object || {}
   }
   ```

2. **Frontend API Consumption**:
   ```typescript
   // Always check response structure
   const response = await apiRequest.get('/endpoint')
   if (response.status && response.payload?.data) {
     setData(response.payload.data)
   } else {
     // Handle error state
     setError('Failed to load data')
   }
   ```

### Rule 9: Error Boundaries & Logging
**REQUIRED**: For debugging purposes:

```typescript
// Log warnings when data is unexpectedly missing
if (!expectedData) {
  console.warn(`Missing expected data: ${fieldName} for ${context}`)
}

// Use Error Boundaries for crash protection
const ComponentWithErrorBoundary = () => (
  <ErrorBoundary fallback={<ErrorFallback />}>
    <ActualComponent />
  </ErrorBoundary>
)
```

---

## 🎯 **SPECIFIC HEALTHCARE APP PATTERNS**

### Rule 10: Medical Data Safety
**REQUIRED**: Medical data has special requirements:

```typescript
// Patient medical info must always have fallbacks
const displayMedicalValue = (value: any, medicalContext: string) => {
  if (value === null || value === undefined) {
    return (
      <span className="text-gray-400 italic">
        {medicalContext} data not available
      </span>
    )
  }
  return value
}

// Usage
<span>{displayMedicalValue(patient.adherence_rate, 'Medication adherence')}</span>
<span>{displayMedicalValue(patient.last_visit, 'Last visit')}</span>
```

### Rule 11: Healthcare Entity Relationships
**REQUIRED**: Always verify relationships exist before accessing:

```typescript
// Doctor-Patient relationships
const patientDoctor = patient.primary_care_doctor
if (patientDoctor) {
  return patientDoctor.user?.first_name || 'Doctor name not available'
} else {
  return 'No assigned doctor'
}

// Patient-Medication relationships  
const medications = patient.carePlans
  ?.filter(cp => cp.status === 'active')
  ?.flatMap(cp => cp.medicationPrescriptions || [])
  ?.filter(med => med.status === 'active') || []
```

---

## ✅ **IMPLEMENTATION CHECKLIST**

### Before Creating Any New Component:
- [ ] Added TypeScript strict null checks: `strictNullChecks: true`
- [ ] Created interfaces that match backend response exactly
- [ ] Added loading and error states
- [ ] Implemented user-friendly missing data messages
- [ ] Added null safety to all property access
- [ ] Verified field names match across Database → Backend → Frontend
- [ ] Added type-safe comparisons for IDs and other mixed types
- [ ] Tested with null/undefined data scenarios

### Before API Integration:
- [ ] Backend provides all fields expected by frontend
- [ ] Backend includes null safety for all data access
- [ ] Frontend handles missing/null response data gracefully
- [ ] Field names are consistent across all layers
- [ ] Added appropriate user feedback for API failures

### Code Review Checklist:
- [ ] No direct property access without null checks
- [ ] All missing data shows user-friendly messages
- [ ] Type-safe comparisons throughout
- [ ] Field names match between frontend and backend
- [ ] Component protected with loading/error guards
- [ ] Logging added for debugging missing data issues

---

**Remember**: In healthcare applications, data integrity and user experience are critical. Always err on the side of caution with null checks and provide clear, helpful messages when data is missing.