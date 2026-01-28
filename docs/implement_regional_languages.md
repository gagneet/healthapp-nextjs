# Multi-Language Implementation Guide
## Hindi and Regional Language Support

---

## Table of Contents

1. [Overview](#1-overview)
2. [Translation Architecture](#2-translation-architecture)
3. [Hindi Translation Mapping](#3-hindi-translation-mapping)
4. [Implementation Code](#4-implementation-code)
5. [Voice Interface Support](#5-voice-interface-support)
6. [Best Practices](#6-best-practices)

---

## 1. Overview

The platform supports multiple Indian languages with Hindi as the primary regional language. This guide covers:

- **Tier 1 (Launch)**: English, Hindi (हिंदी)
- **Tier 2 (Phase 2)**: Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam
- **Tier 3 (Phase 3)**: Gujarati, Punjabi, Odia, Assamese, Urdu

### Key Principles

1. **Patient-facing UI**: Full translation support
2. **Clinical data**: Stored in English with translated display
3. **Medical terms**: Transliteration + simple explanation
4. **Voice support**: Using Bhashini API for speech-to-text/text-to-speech

---

## 2. Translation Architecture

### Directory Structure

```
locales/
├── en/
│   ├── common.json
│   ├── patient.json
│   ├── doctor.json
│   ├── hsp.json
│   ├── medications.json
│   ├── vitals.json
│   ├── appointments.json
│   ├── ayush.json
│   └── medical-terms.json
├── hi/
│   ├── common.json
│   ├── patient.json
│   ├── doctor.json
│   ├── hsp.json
│   ├── medications.json
│   ├── vitals.json
│   ├── appointments.json
│   ├── ayush.json
│   └── medical-terms.json
├── ta/
│   └── ... (Tamil translations)
├── te/
│   └── ... (Telugu translations)
└── ...
```

### Translation Hook

```typescript
// hooks/useTranslation.ts
import { useCallback, useEffect, useState } from 'react';

type SupportedLanguage = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa';

interface TranslationContext {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

export function useTranslation(namespace: string = 'common'): TranslationContext {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get language from localStorage or user preferences
    const savedLang = localStorage.getItem('preferredLanguage') as SupportedLanguage;
    if (savedLang) {
      setLanguageState(savedLang);
    }
  }, []);

  useEffect(() => {
    loadTranslations(language, namespace);
  }, [language, namespace]);

  const loadTranslations = async (lang: SupportedLanguage, ns: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/translations/${ns}?lang=${lang}`);
      const data = await res.json();
      if (data.status) {
        setTranslations(data.payload.data);
      }
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Fallback to English
      if (lang !== 'en') {
        loadTranslations('en', ns);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('preferredLanguage', lang);
    document.documentElement.lang = lang;
    
    // Update user preference on server
    fetch('/api/user/language', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang })
    });
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = translations[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{{${k}}}`, String(v));
      });
    }
    
    return text;
  }, [translations]);

  return { language, setLanguage, t, isLoading };
}
```

---

## 3. Hindi Translation Mapping

### Based on Provided JSON Files

The following Hindi translations are based on the `web-hi.json` and `mob-hi.json` files you provided:

```json
// locales/hi/common.json
{
  "Patient_Name": "रोगी का नाम",
  "Registration": "पंजीकरण",
  "date": "तिथि",
  "time": "समय",
  "Patient": "रोगी",
  "ID": "पहचान संख्या",
  "Age": "आयु",
  "Gender": "लिंग",
  "Doctor_Name": "चिकित्सक का नाम",
  "Address": "पता",
  "Doctor_Email": "चिकित्सक का ईमेल",
  "Height": "ऊँचाई",
  "Weight": "वजन",
  "Date": "तिथि",
  "Patient_Mobile_No_": "रोगी का मोबाइल नंबर",
  "Patient_ID": "पहचान संख्या",
  "From": "तारीख से",
  "Days": "दिनों के लिए",
  "Duration": "अवधि",
  "Time": "समय",
  "Details": "विवरण",
  "Page": "पृष्ठ का",
  "Signature": "हस्ताक्षर और",
  "Stamp": "मुहर",
  "RegNo": "पंजीकरण",
  "Description": "विवरण",
  "Note": "ध्यान दें",
  "Dr_": "डॉ.",
  
  "male": "पुरुष",
  "female": "महिला",
  "other": "अन्य लिंग",
  "years": "साल",
  "day_s_": "दिन",
  "cm": "सेमीमीटर",
  "kg": "किलोग्राम"
}
```

```json
// locales/hi/patient.json
{
  "dashboard": "डैशबोर्ड",
  "my_medications": "मेरी दवाइयां",
  "my_appointments": "मेरी अपॉइंटमेंट्स",
  "my_vitals": "मेरे वाइटल्स",
  "my_diet": "मेरा आहार",
  "my_exercise": "मेरा व्यायाम",
  "my_goals": "मेरे लक्ष्य",
  "my_care_team": "मेरी देखभाल टीम",
  "messages": "संदेश",
  "settings": "सेटिंग्स",
  
  "medication_reminder": "दवाई की याद",
  "time_to_take": "लेने का समय",
  "mark_as_taken": "ली हुई के रूप में चिह्नित करें",
  "skip": "छोड़ें",
  "taken": "ली गई",
  "missed": "छूट गई",
  "late": "देर से",
  
  "today_schedule": "आज का शेड्यूल",
  "upcoming_appointments": "आने वाली अपॉइंटमेंट्स",
  "recent_vitals": "हाल के वाइटल्स",
  "adherence_score": "अनुपालन स्कोर",
  "current_streak": "वर्तमान स्ट्रीक",
  "total_points": "कुल अंक",
  
  "record_vital": "वाइटल रिकॉर्ड करें",
  "log_meal": "भोजन लॉग करें",
  "log_exercise": "व्यायाम लॉग करें",
  "report_symptom": "लक्षण रिपोर्ट करें",
  "message_care_team": "देखभाल टीम को संदेश भेजें"
}
```

```json
// locales/hi/medications.json
{
  "Name_of_Medicine": "दवा का नाम",
  "Dose": "खुराक",
  "Qty": "मात्रा",
  "Medicine_Schedule": "दवा का समय",
  "Morning": "सुबह लें",
  "Afternoon": "दोपहर में लें",
  "Night": "रात में लें",
  "Start_Date": "प्रारंभ तिथि",
  "Take_whenever_required": "आवश्यकता अनुसार लें",
  
  "before_food": "खाने से पहले",
  "after_food": "खाने के बाद",
  "with_food": "खाने के साथ",
  "empty_stomach": "खाली पेट",
  
  "once_daily": "दिन में एक बार",
  "twice_daily": "दिन में दो बार",
  "three_times_daily": "दिन में तीन बार",
  "four_times_daily": "दिन में चार बार",
  "as_needed": "आवश्यकता अनुसार",
  "at_bedtime": "सोने से पहले",
  
  "tablet": "गोली",
  "capsule": "कैप्सूल",
  "syrup": "सिरप",
  "injection": "इंजेक्शन",
  "drops": "बूँदें",
  "cream": "क्रीम",
  "ointment": "मरहम",
  
  "refill_request": "रिफिल अनुरोध",
  "request_refill": "रिफिल का अनुरोध करें",
  "refill_approved": "रिफिल स्वीकृत",
  "refill_denied": "रिफिल अस्वीकृत",
  
  "side_effects": "दुष्प्रभाव",
  "report_side_effect": "दुष्प्रभाव की रिपोर्ट करें",
  "mild": "हल्का",
  "moderate": "मध्यम",
  "severe": "गंभीर"
}
```

```json
// locales/hi/medical-history.json
{
  "Relevant_History": "रोगी का प्रासंगिक चिकित्सा इतिहास",
  "Allergies": "रोगी से एलर्जी",
  "Comorbidities": "सह-रुग्णताएं",
  "Diagnosis": "डॉक्टर द्वारा निदान",
  "Symptoms": "डॉक्टर को बताए गए लक्षण",
  "General": "सामान्य",
  "Systematic_Examination": "व्यवस्थित परीक्षा",
  "Treatment_And_Follow_up_Advice": "उपचार और अनुवर्ती सलाह",
  "Investigation": "जाँच",
  "Next_Consultation": "अगली परामर्श",
  "Purpose": "चिकित्सा परीक्षण का उद्देश्य",
  "Lifestyle": "जीवनशैली",
  "Advice": "सलाह"
}
```

```json
// locales/hi/diet.json
{
  "Diet": "रोगी का आहार अनुसूची",
  "Diet_Name": "आहार का नाम",
  "TimeDetails": "समय और विवरण",
  "Repeat_Days": "दोहराने के दिन",
  "What_Not_to_Do": "क्या नहीं करना है",
  "Total_Calories": "कुल कैलोरी",
  "Cal": "कैलोरी",
  
  "breakfast": "नाश्ता",
  "morning_snack": "सुबह का नाश्ता",
  "lunch": "दोपहर का भोजन",
  "afternoon_snack": "दोपहर का नाश्ता",
  "dinner": "रात का खाना",
  "evening_snack": "शाम का नाश्ता",
  
  "carbohydrates": "कार्बोहाइड्रेट",
  "protein": "प्रोटीन",
  "fat": "वसा",
  "fiber": "फाइबर",
  "water_intake": "पानी का सेवन",
  
  "vegetarian": "शाकाहारी",
  "non_vegetarian": "मांसाहारी",
  "vegan": "वीगन",
  "diabetic_friendly": "मधुमेह अनुकूल",
  "heart_healthy": "हृदय स्वस्थ"
}
```

```json
// locales/hi/exercise.json
{
  "Workout": "रोगी का कसरत अनुसूची",
  "Workout_Name": "कसरत का नाम",
  "repetitions": "सेट का पुनरावृत्ति",
  
  "walking": "चलना",
  "jogging": "दौड़ना",
  "cycling": "साइकिलिंग",
  "swimming": "तैराकी",
  "yoga": "योग",
  "stretching": "स्ट्रेचिंग",
  "strength_training": "शक्ति प्रशिक्षण",
  
  "low_intensity": "कम तीव्रता",
  "moderate_intensity": "मध्यम तीव्रता",
  "high_intensity": "उच्च तीव्रता",
  
  "duration_minutes": "अवधि (मिनट)",
  "calories_burned": "कैलोरी जली",
  "steps": "कदम",
  "distance": "दूरी"
}
```

```json
// locales/hi/vitals.json
{
  "blood_pressure": "रक्तचाप",
  "systolic": "सिस्टोलिक",
  "diastolic": "डायस्टोलिक",
  "blood_sugar": "रक्त शर्करा",
  "fasting": "खाली पेट",
  "post_meal": "भोजन के बाद",
  "random": "यादृच्छिक",
  "heart_rate": "हृदय गति",
  "pulse": "नाड़ी",
  "temperature": "तापमान",
  "weight": "वजन",
  "oxygen_saturation": "ऑक्सीजन संतृप्ति",
  "respiratory_rate": "श्वसन दर",
  
  "normal": "सामान्य",
  "borderline": "सीमा रेखा",
  "abnormal": "असामान्य",
  "critical": "गंभीर",
  
  "record_vital": "वाइटल रिकॉर्ड करें",
  "view_trends": "रुझान देखें",
  "set_reminder": "रिमाइंडर सेट करें",
  
  "morning_fasting": "सुबह खाली पेट",
  "after_meal": "भोजन के बाद",
  "before_meal": "भोजन से पहले",
  "after_exercise": "व्यायाम के बाद",
  "at_rest": "आराम में",
  "before_medication": "दवाई से पहले",
  "after_medication": "दवाई के बाद"
}
```

```json
// locales/hi/appointments.json
{
  "appointment": "अपॉइंटमेंट",
  "book_appointment": "अपॉइंटमेंट बुक करें",
  "upcoming_appointments": "आने वाली अपॉइंटमेंट्स",
  "past_appointments": "पिछली अपॉइंटमेंट्स",
  "reschedule": "पुनर्निर्धारित करें",
  "cancel": "रद्द करें",
  
  "video_consultation": "वीडियो परामर्श",
  "in_person": "व्यक्तिगत रूप से",
  "phone_call": "फोन कॉल",
  "home_visit": "घर पर विजिट",
  
  "scheduled": "निर्धारित",
  "confirmed": "पुष्टि",
  "completed": "पूर्ण",
  "cancelled": "रद्द",
  "no_show": "उपस्थित नहीं",
  
  "join_video_call": "वीडियो कॉल में शामिल हों",
  "waiting_room": "प्रतीक्षा कक्ष",
  "doctor_joining_soon": "डॉक्टर जल्द ही शामिल होंगे",
  
  "consultation_fee": "परामर्श शुल्क",
  "pay_now": "अभी भुगतान करें",
  "payment_successful": "भुगतान सफल"
}
```

```json
// locales/hi/ayush.json
{
  "ayurveda": "आयुर्वेद",
  "yoga": "योग",
  "unani": "यूनानी",
  "siddha": "सिद्ध",
  "homeopathy": "होम्योपैथी",
  "naturopathy": "प्राकृतिक चिकित्सा",
  
  "prakriti_assessment": "प्रकृति मूल्यांकन",
  "your_prakriti": "आपकी प्रकृति",
  "vata": "वात",
  "pitta": "पित्त",
  "kapha": "कफ",
  
  "panchakarma": "पंचकर्म",
  "vamana": "वमन",
  "virechana": "विरेचन",
  "basti": "बस्ति",
  "nasya": "नस्य",
  "raktamokshana": "रक्तमोक्षण",
  
  "poorvakarma": "पूर्वकर्म",
  "pradhanakarma": "प्रधानकर्म",
  "paschatkarma": "पश्चात्कर्म",
  
  "pathya": "पथ्य (अनुशंसित)",
  "apathya": "अपथ्य (निषेध)",
  "dinacharya": "दिनचर्या",
  "ritucharya": "ऋतुचर्या",
  
  "asana": "आसन",
  "pranayama": "प्राणायाम",
  "meditation": "ध्यान",
  "relaxation": "विश्राम",
  
  "remedy": "दवा",
  "potency": "शक्ति",
  "dosage": "खुराक"
}
```

```json
// locales/hi/notifications.json
{
  "notifications": "सूचनाएं",
  "mark_all_read": "सभी को पढ़ा हुआ चिह्नित करें",
  "no_notifications": "कोई सूचना नहीं",
  "view_all": "सभी देखें",
  
  "medication_reminder_title": "दवाई का समय",
  "medication_reminder_body": "{{medicine}} {{dosage}} लेने का समय हो गया है",
  
  "appointment_reminder_title": "अपॉइंटमेंट की याद",
  "appointment_reminder_body": "{{time}} पर {{doctor}} के साथ आपकी अपॉइंटमेंट है",
  
  "vital_reminder_title": "वाइटल रिकॉर्ड करें",
  "vital_reminder_body": "कृपया अपना {{vital}} रिकॉर्ड करें",
  
  "missed_medication_title": "दवाई छूट गई",
  "missed_medication_body": "आपने {{medicine}} नहीं ली है",
  
  "achievement_title": "बधाई!",
  "achievement_body": "आपने {{achievement}} अचीवमेंट अनलॉक किया!"
}
```

```json
// locales/hi/errors.json
{
  "error": "त्रुटि",
  "something_went_wrong": "कुछ गलत हो गया",
  "try_again": "पुनः प्रयास करें",
  "network_error": "नेटवर्क त्रुटि",
  "please_check_connection": "कृपया अपना इंटरनेट कनेक्शन जांचें",
  "session_expired": "सत्र समाप्त हो गया",
  "please_login_again": "कृपया फिर से लॉगिन करें",
  "invalid_input": "अमान्य इनपुट",
  "required_field": "यह फ़ील्ड आवश्यक है",
  "invalid_phone": "अमान्य फ़ोन नंबर",
  "invalid_email": "अमान्य ईमेल"
}
```

---

## 4. Implementation Code

### 4.1 Translation API Endpoint

```typescript
// app/api/translations/[namespace]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { formatSuccessResponse, formatErrorResponse } from '@/lib/utils/responseFormatter';

export async function GET(
  request: NextRequest,
  { params }: { params: { namespace: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';
    const namespace = params.namespace;

    // Try to get from database
    const translations = await prisma.translation.findMany({
      where: { namespace }
    });

    const result: Record<string, string> = {};
    
    translations.forEach(t => {
      // Get translation for requested language, fallback to English
      const value = t[lang as keyof typeof t] || t.en;
      if (typeof value === 'string') {
        result[t.key] = value;
      }
    });

    // If no translations found in DB, try to load from static files
    if (Object.keys(result).length === 0) {
      try {
        const staticTranslations = await import(`@/locales/${lang}/${namespace}.json`);
        return NextResponse.json(
          formatSuccessResponse(staticTranslations.default || staticTranslations, 'Translations loaded'),
          { status: 200 }
        );
      } catch {
        // Fallback to English
        const englishTranslations = await import(`@/locales/en/${namespace}.json`);
        return NextResponse.json(
          formatSuccessResponse(englishTranslations.default || englishTranslations, 'Translations loaded (fallback)'),
          { status: 200 }
        );
      }
    }

    return NextResponse.json(
      formatSuccessResponse(result, 'Translations loaded'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error loading translations:', error);
    return NextResponse.json(
      formatErrorResponse('Failed to load translations', 500),
      { status: 500 }
    );
  }
}
```

### 4.2 Medical Term Translation

```typescript
// lib/services/MedicalTermTranslation.ts
import prisma from '@/lib/prisma';

interface TranslatedMedicalTerm {
  term: string;
  termOriginal: string;
  pronunciation?: string;
  simpleExplanation?: string;
}

export async function translateMedicalTerm(
  term: string,
  type: string,
  targetLanguage: string
): Promise<TranslatedMedicalTerm> {
  const langField = `term${targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1)}`;
  
  const translation = await prisma.medicalTermTranslation.findFirst({
    where: {
      termEn: { equals: term, mode: 'insensitive' },
      termType: type as any
    }
  });

  if (!translation) {
    return {
      term: term,
      termOriginal: term
    };
  }

  const translatedTerm = translation[langField as keyof typeof translation] as string;
  const pronunciation = translation[`pronunciation${targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1)}` as keyof typeof translation] as string;
  const explanation = translation[`simpleExplanation${targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1)}` as keyof typeof translation] as string;

  return {
    term: translatedTerm || term,
    termOriginal: term,
    pronunciation: pronunciation,
    simpleExplanation: explanation || translation.simpleExplanationEn
  };
}

// Common medical terms with Hindi translations
export const COMMON_MEDICAL_TERMS_HI: Record<string, { hi: string; pronunciation: string; explanation: string }> = {
  // Conditions
  'Diabetes': {
    hi: 'मधुमेह',
    pronunciation: 'madhumeh',
    explanation: 'खून में शक्कर की मात्रा बढ़ जाना'
  },
  'Hypertension': {
    hi: 'उच्च रक्तचाप',
    pronunciation: 'ucch raktchap',
    explanation: 'खून का दबाव सामान्य से अधिक होना'
  },
  'Heart Disease': {
    hi: 'हृदय रोग',
    pronunciation: 'hriday rog',
    explanation: 'दिल से संबंधित बीमारी'
  },
  'Asthma': {
    hi: 'दमा',
    pronunciation: 'dama',
    explanation: 'सांस लेने में कठिनाई'
  },
  'Arthritis': {
    hi: 'गठिया',
    pronunciation: 'gathiya',
    explanation: 'जोड़ों में दर्द और सूजन'
  },
  'Thyroid': {
    hi: 'थायराइड',
    pronunciation: 'thyroid',
    explanation: 'गले में ग्रंथि की समस्या'
  },
  'Kidney Disease': {
    hi: 'गुर्दे की बीमारी',
    pronunciation: 'gurde ki bimari',
    explanation: 'किडनी की कार्यक्षमता में कमी'
  },
  
  // Symptoms
  'Fever': {
    hi: 'बुखार',
    pronunciation: 'bukhar',
    explanation: 'शरीर का तापमान बढ़ना'
  },
  'Headache': {
    hi: 'सिरदर्द',
    pronunciation: 'sirdard',
    explanation: 'सिर में दर्द'
  },
  'Cough': {
    hi: 'खांसी',
    pronunciation: 'khansi',
    explanation: 'गले में खराश से होने वाली खांसी'
  },
  'Nausea': {
    hi: 'मतली',
    pronunciation: 'matli',
    explanation: 'उल्टी जैसा महसूस होना'
  },
  'Fatigue': {
    hi: 'थकान',
    pronunciation: 'thakan',
    explanation: 'शरीर में कमजोरी और थकावट'
  },
  'Dizziness': {
    hi: 'चक्कर',
    pronunciation: 'chakkar',
    explanation: 'सिर घूमना'
  },
  
  // Body parts
  'Heart': {
    hi: 'हृदय',
    pronunciation: 'hriday',
    explanation: 'दिल'
  },
  'Liver': {
    hi: 'यकृत',
    pronunciation: 'yakrit',
    explanation: 'जिगर'
  },
  'Kidney': {
    hi: 'गुर्दा',
    pronunciation: 'gurda',
    explanation: 'किडनी'
  },
  'Lungs': {
    hi: 'फेफड़े',
    pronunciation: 'phephde',
    explanation: 'सांस लेने के अंग'
  },
  'Stomach': {
    hi: 'पेट',
    pronunciation: 'pet',
    explanation: 'आमाशय'
  },
  
  // Procedures
  'Blood Test': {
    hi: 'खून की जांच',
    pronunciation: 'khoon ki jaanch',
    explanation: 'खून का परीक्षण'
  },
  'X-Ray': {
    hi: 'एक्स-रे',
    pronunciation: 'x-ray',
    explanation: 'शरीर के अंदर की तस्वीर'
  },
  'ECG': {
    hi: 'ईसीजी',
    pronunciation: 'ECG',
    explanation: 'दिल की धड़कन की जांच'
  },
  'MRI': {
    hi: 'एमआरआई',
    pronunciation: 'MRI',
    explanation: 'शरीर की विस्तृत तस्वीर'
  },
  'Ultrasound': {
    hi: 'अल्ट्रासाउंड',
    pronunciation: 'ultrasound',
    explanation: 'ध्वनि तरंगों से जांच'
  }
};
```

### 4.3 WhatsApp Message Templates (Hindi)

```typescript
// lib/whatsapp/templates-hi.ts
export const WHATSAPP_TEMPLATES_HI = {
  // Medication Reminder
  medication_reminder: {
    name: 'medication_reminder_hindi',
    language: 'hi',
    components: [
      {
        type: 'BODY',
        text: '🕐 दवाई का समय\n\nप्रिय {{1}},\n\nयह आपकी {{2}} {{3}} लेने की याद है।\n\nसमय: {{4}}'
      }
    ],
    buttons: [
      { type: 'QUICK_REPLY', text: '✅ ली गई' },
      { type: 'QUICK_REPLY', text: '❌ अभी नहीं' },
      { type: 'QUICK_REPLY', text: '⏭️ छोड़ें' }
    ]
  },

  // Appointment Reminder
  appointment_reminder: {
    name: 'appointment_reminder_hindi',
    language: 'hi',
    components: [
      {
        type: 'BODY',
        text: '📅 अपॉइंटमेंट की याद\n\nप्रिय {{1}},\n\nआपकी {{2}} के साथ अपॉइंटमेंट है:\n📆 तारीख: {{3}}\n⏰ समय: {{4}}\n📍 स्थान: {{5}}\n\nकृपया समय पर पहुंचें।'
      }
    ],
    buttons: [
      { type: 'QUICK_REPLY', text: '✅ पुष्टि करें' },
      { type: 'QUICK_REPLY', text: '📅 पुनर्निर्धारित करें' }
    ]
  },

  // Lab Results Ready
  lab_results_ready: {
    name: 'lab_results_hindi',
    language: 'hi',
    components: [
      {
        type: 'BODY',
        text: '🔬 जांच रिपोर्ट तैयार\n\nप्रिय {{1}},\n\nआपकी {{2}} की रिपोर्ट तैयार है।\n\nऐप में देखने के लिए नीचे क्लिक करें।'
      }
    ],
    buttons: [
      { type: 'URL', text: 'रिपोर्ट देखें', url: '{{1}}' }
    ]
  },

  // Missed Medication Alert (to Caregiver)
  missed_medication_caregiver: {
    name: 'missed_medication_caregiver_hindi',
    language: 'hi',
    components: [
      {
        type: 'BODY',
        text: '⚠️ दवाई छूट गई\n\nप्रिय {{1}},\n\n{{2}} ने अपनी {{3}} नहीं ली है।\n\nकृपया उन्हें याद दिलाएं।'
      }
    ],
    buttons: [
      { type: 'QUICK_REPLY', text: '📞 कॉल करें' },
      { type: 'QUICK_REPLY', text: '✅ ठीक है' }
    ]
  },

  // Health Tip
  health_tip: {
    name: 'health_tip_hindi',
    language: 'hi',
    components: [
      {
        type: 'BODY',
        text: '💡 आज का स्वास्थ्य टिप\n\n{{1}}'
      }
    ]
  }
};
```

---

## 5. Voice Interface Support

### 5.1 Bhashini API Integration

```typescript
// lib/services/BhashiniService.ts
import axios from 'axios';

const BHASHINI_API_URL = process.env.BHASHINI_API_URL;
const BHASHINI_API_KEY = process.env.BHASHINI_API_KEY;
const BHASHINI_USER_ID = process.env.BHASHINI_USER_ID;

export class BhashiniService {
  // Speech to Text (ASR)
  static async speechToText(
    audioBase64: string,
    sourceLanguage: string = 'hi'
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${BHASHINI_API_URL}/asr/v1/recognize`,
        {
          audio: {
            audioContent: audioBase64
          },
          config: {
            language: {
              sourceLanguage
            },
            audioFormat: 'wav',
            samplingRate: 16000
          }
        },
        {
          headers: {
            'Authorization': BHASHINI_API_KEY,
            'userID': BHASHINI_USER_ID,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.output[0]?.source || '';
    } catch (error) {
      console.error('Bhashini ASR error:', error);
      throw new Error('Speech recognition failed');
    }
  }

  // Text to Speech (TTS)
  static async textToSpeech(
    text: string,
    targetLanguage: string = 'hi',
    gender: 'male' | 'female' = 'female'
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${BHASHINI_API_URL}/tts/v1/synthesize`,
        {
          input: {
            text
          },
          config: {
            language: {
              sourceLanguage: targetLanguage
            },
            gender
          }
        },
        {
          headers: {
            'Authorization': BHASHINI_API_KEY,
            'userID': BHASHINI_USER_ID,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.audio[0]?.audioContent || '';
    } catch (error) {
      console.error('Bhashini TTS error:', error);
      throw new Error('Text to speech failed');
    }
  }

  // Translation
  static async translate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${BHASHINI_API_URL}/nmt/v1/translate`,
        {
          input: {
            text
          },
          config: {
            language: {
              sourceLanguage,
              targetLanguage
            }
          }
        },
        {
          headers: {
            'Authorization': BHASHINI_API_KEY,
            'userID': BHASHINI_USER_ID,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.output[0]?.target || text;
    } catch (error) {
      console.error('Bhashini translation error:', error);
      return text; // Return original text on failure
    }
  }
}
```

### 5.2 Voice Command Handler

```typescript
// lib/services/VoiceCommandHandler.ts
import { BhashiniService } from './BhashiniService';

interface VoiceCommand {
  intent: string;
  entities: Record<string, string>;
  confidence: number;
}

const VOICE_COMMANDS_HI = [
  { pattern: /दवाई.*याद.*दिलाओ/i, intent: 'set_medication_reminder' },
  { pattern: /बीपी.*रिकॉर्ड.*करो/i, intent: 'record_bp' },
  { pattern: /शुगर.*रिकॉर्ड.*करो/i, intent: 'record_sugar' },
  { pattern: /डॉक्टर.*बात/i, intent: 'contact_doctor' },
  { pattern: /अपॉइंटमेंट.*बुक/i, intent: 'book_appointment' },
  { pattern: /दवाई.*ली/i, intent: 'mark_medication_taken' },
  { pattern: /लक्षण.*बताओ|symptoms/i, intent: 'report_symptom' },
  { pattern: /मदद|help/i, intent: 'get_help' },
];

export class VoiceCommandHandler {
  static async processVoiceCommand(
    audioBase64: string,
    language: string = 'hi'
  ): Promise<VoiceCommand> {
    // Convert speech to text
    const transcription = await BhashiniService.speechToText(audioBase64, language);
    
    // Parse command
    for (const cmd of VOICE_COMMANDS_HI) {
      if (cmd.pattern.test(transcription)) {
        return {
          intent: cmd.intent,
          entities: this.extractEntities(transcription, cmd.intent),
          confidence: 0.9
        };
      }
    }

    return {
      intent: 'unknown',
      entities: { rawText: transcription },
      confidence: 0.5
    };
  }

  private static extractEntities(text: string, intent: string): Record<string, string> {
    const entities: Record<string, string> = {};

    // Extract numbers (for vitals)
    const numbers = text.match(/\d+/g);
    if (numbers) {
      if (intent === 'record_bp' && numbers.length >= 2) {
        entities.systolic = numbers[0];
        entities.diastolic = numbers[1];
      } else if (intent === 'record_sugar') {
        entities.value = numbers[0];
      }
    }

    // Extract time references
    if (text.includes('सुबह')) entities.time = 'morning';
    if (text.includes('दोपहर')) entities.time = 'afternoon';
    if (text.includes('शाम')) entities.time = 'evening';
    if (text.includes('रात')) entities.time = 'night';

    return entities;
  }

  static async generateVoiceResponse(
    text: string,
    language: string = 'hi'
  ): Promise<string> {
    return BhashiniService.textToSpeech(text, language, 'female');
  }
}

// Voice response templates
export const VOICE_RESPONSES_HI = {
  medication_taken: 'बहुत अच्छे! आपकी दवाई लेना रिकॉर्ड हो गया है।',
  bp_recorded: 'आपका रक्तचाप {{systolic}} बटा {{diastolic}} रिकॉर्ड हो गया है।',
  sugar_recorded: 'आपकी रक्त शर्करा {{value}} रिकॉर्ड हो गई है।',
  appointment_booked: '{{date}} को {{time}} बजे {{doctor}} के साथ आपकी अपॉइंटमेंट बुक हो गई है।',
  help: 'आप मुझसे दवाई याद दिलाने, वाइटल रिकॉर्ड करने, या डॉक्टर से बात करने के लिए कह सकते हैं।',
  not_understood: 'माफ़ कीजिए, मैं समझ नहीं पाया। कृपया दोबारा बोलें।'
};
```

---

## 6. Best Practices

### 6.1 Translation Guidelines

1. **Medical Accuracy**: Always use medically accurate translations, preferably reviewed by healthcare professionals
2. **Cultural Sensitivity**: Consider cultural context when translating health-related content
3. **Simplicity**: Use simple, easy-to-understand language for patient-facing content
4. **Consistency**: Maintain consistent terminology across the application
5. **Fallback**: Always have English fallback for untranslated content

### 6.2 Accessibility Considerations

1. **Font Support**: Use fonts that support Devanagari and other Indian scripts
2. **RTL Support**: Prepare for Urdu (right-to-left) support
3. **Text Expansion**: Hindi text is often 20-30% longer than English
4. **Voice Interface**: Support voice commands for low-literacy users
5. **Large Text**: Support text scaling for elderly users

### 6.3 Testing Checklist

- [ ] All UI strings translated
- [ ] Medical terms have simple explanations
- [ ] Date/time formats localized (DD-MM-YYYY for India)
- [ ] Number formats correct (lakhs/crores vs millions)
- [ ] Currency display correct (₹)
- [ ] Voice commands working
- [ ] WhatsApp templates approved by Meta
- [ ] SMS templates within character limits
- [ ] Offline translations cached

---

*End of Multi-Language Implementation Guide*