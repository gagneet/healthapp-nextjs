// Body Parts Mapping System
export const BODY_PARTS = {
  // Head and Face
  HEAD: 'head',
  LEFT_EYE: 'left_eye',
  RIGHT_EYE: 'right_eye',
  LEFT_EAR: 'left_ear',
  RIGHT_EAR: 'right_ear',
  NOSE: 'nose',
  MOUTH: 'mouth',
  
  // Neck
  NECK: 'neck',
  NECK_BACK: 'neck_back',
  
  // Torso - Front
  CHEST: 'chest',
  STOMACH: 'stomach',
  ABDOMEN: 'abdomen',
  
  // Torso - Back  
  BACK: 'back',
  LOWER_BACK: 'lower_back',
  
  // Shoulders
  LEFT_SHOULDER: 'left_shoulder',
  RIGHT_SHOULDER: 'right_shoulder',
  LEFT_SHOULDER_BACK: 'left_shoulder_back',
  RIGHT_SHOULDER_BACK: 'right_shoulder_back',
  
  // Arms
  LEFT_ARM: 'left_arm',
  RIGHT_ARM: 'right_arm',
  LEFT_TRICEP: 'left_tricep',
  RIGHT_TRICEP: 'right_tricep',
  
  // Elbows
  LEFT_ELBOW: 'left_elbow',
  RIGHT_ELBOW: 'right_elbow',
  
  // Forearms
  LEFT_FOREARM: 'left_forearm',
  RIGHT_FOREARM: 'right_forearm',
  LEFT_FOREARM_BACK: 'left_forearm_back',
  RIGHT_FOREARM_BACK: 'right_forearm_back',
  
  // Wrists
  LEFT_WRIST: 'left_wrist',
  RIGHT_WRIST: 'right_wrist',
  
  // Hands
  LEFT_HAND: 'left_hand',
  RIGHT_HAND: 'right_hand',
  LEFT_HAND_FINGER: 'left_hand_fingers',
  RIGHT_HAND_FINGER: 'right_hand_fingers',
  
  // Hips
  LEFT_HIP: 'left_hip',
  RIGHT_HIP: 'right_hip',
  
  // Thighs
  LEFT_THIGH: 'left_thigh',
  RIGHT_THIGH: 'right_thigh',
  LEFT_HAMSTRING: 'left_hamstring',
  RIGHT_HAMSTRING: 'right_hamstring',
  
  // Knees
  LEFT_KNEE: 'left_knee',
  RIGHT_KNEE: 'right_knee',
  
  // Lower Legs
  LEFT_SHIN: 'left_shin',
  RIGHT_SHIN: 'right_shin',
  LEFT_CALF: 'left_calf',
  RIGHT_CALF: 'right_calf',
  
  // Ankles
  LEFT_ANKLE: 'left_ankle',
  RIGHT_ANKLE: 'right_ankle',
  
  // Feet
  LEFT_FOOT: 'left_foot',
  RIGHT_FOOT: 'right_foot',
  LEFT_TOE: 'left_toe',
  RIGHT_TOE: 'right_toe',
  
  // Internal/Private
  RECTUM: 'rectum',
  URINARY_BLADDER: 'urinary_bladder',
  GENITALS: 'genitals',
}

export const BODY_PART_LABELS = {
  [BODY_PARTS.HEAD]: 'Head',
  [BODY_PARTS.LEFT_EYE]: 'Left Eye',
  [BODY_PARTS.RIGHT_EYE]: 'Right Eye',
  [BODY_PARTS.LEFT_EAR]: 'Left Ear',
  [BODY_PARTS.RIGHT_EAR]: 'Right Ear',
  [BODY_PARTS.NOSE]: 'Nose',
  [BODY_PARTS.MOUTH]: 'Mouth',
  [BODY_PARTS.NECK]: 'Neck',
  [BODY_PARTS.NECK_BACK]: 'Back of Neck',
  [BODY_PARTS.LEFT_SHOULDER]: 'Left Shoulder',
  [BODY_PARTS.RIGHT_SHOULDER]: 'Right Shoulder',
  [BODY_PARTS.LEFT_SHOULDER_BACK]: 'Left Shoulder (Back)',
  [BODY_PARTS.RIGHT_SHOULDER_BACK]: 'Right Shoulder (Back)',
  [BODY_PARTS.CHEST]: 'Chest',
  [BODY_PARTS.LEFT_ARM]: 'Left Arm',
  [BODY_PARTS.RIGHT_ARM]: 'Right Arm',
  [BODY_PARTS.LEFT_ELBOW]: 'Left Elbow',
  [BODY_PARTS.RIGHT_ELBOW]: 'Right Elbow',
  [BODY_PARTS.STOMACH]: 'Stomach',
  [BODY_PARTS.ABDOMEN]: 'Abdomen',
  [BODY_PARTS.LEFT_FOREARM]: 'Left Forearm',
  [BODY_PARTS.RIGHT_FOREARM]: 'Right Forearm',
  [BODY_PARTS.LEFT_FOREARM_BACK]: 'Left Forearm (Back)',
  [BODY_PARTS.RIGHT_FOREARM_BACK]: 'Right Forearm (Back)',
  [BODY_PARTS.LEFT_WRIST]: 'Left Wrist',
  [BODY_PARTS.RIGHT_WRIST]: 'Right Wrist',
  [BODY_PARTS.LEFT_HAND]: 'Left Hand',
  [BODY_PARTS.RIGHT_HAND]: 'Right Hand',
  [BODY_PARTS.LEFT_HAND_FINGER]: 'Left Hand Fingers',
  [BODY_PARTS.RIGHT_HAND_FINGER]: 'Right Hand Fingers',
  [BODY_PARTS.LEFT_HIP]: 'Left Hip',
  [BODY_PARTS.RIGHT_HIP]: 'Right Hip',
  [BODY_PARTS.LEFT_THIGH]: 'Left Thigh',
  [BODY_PARTS.RIGHT_THIGH]: 'Right Thigh',
  [BODY_PARTS.LEFT_KNEE]: 'Left Knee',
  [BODY_PARTS.RIGHT_KNEE]: 'Right Knee',
  [BODY_PARTS.LEFT_SHIN]: 'Left Shin',
  [BODY_PARTS.RIGHT_SHIN]: 'Right Shin',
  [BODY_PARTS.LEFT_ANKLE]: 'Left Ankle',
  [BODY_PARTS.RIGHT_ANKLE]: 'Right Ankle',
  [BODY_PARTS.LEFT_FOOT]: 'Left Foot',
  [BODY_PARTS.RIGHT_FOOT]: 'Right Foot',
  [BODY_PARTS.LEFT_TOE]: 'Left Toes',
  [BODY_PARTS.RIGHT_TOE]: 'Right Toes',
  [BODY_PARTS.RECTUM]: 'Rectum',
  [BODY_PARTS.URINARY_BLADDER]: 'Urinary Bladder',
  [BODY_PARTS.GENITALS]: 'Genitals',
  [BODY_PARTS.BACK]: 'Upper Back',
  [BODY_PARTS.LOWER_BACK]: 'Lower Back',
  [BODY_PARTS.LEFT_TRICEP]: 'Left Tricep',
  [BODY_PARTS.RIGHT_TRICEP]: 'Right Tricep',
  [BODY_PARTS.LEFT_HAMSTRING]: 'Left Hamstring',
  [BODY_PARTS.RIGHT_HAMSTRING]: 'Right Hamstring',
  [BODY_PARTS.LEFT_CALF]: 'Left Calf',
  [BODY_PARTS.RIGHT_CALF]: 'Right Calf',
}

// Body part categories for organized display
export const BODY_PART_CATEGORIES = {
  'Head & Face': [
    BODY_PARTS.HEAD,
    BODY_PARTS.LEFT_EYE,
    BODY_PARTS.RIGHT_EYE,
    BODY_PARTS.LEFT_EAR,
    BODY_PARTS.RIGHT_EAR,
    BODY_PARTS.NOSE,
    BODY_PARTS.MOUTH,
  ],
  'Neck': [
    BODY_PARTS.NECK,
    BODY_PARTS.NECK_BACK,
  ],
  'Torso': [
    BODY_PARTS.CHEST,
    BODY_PARTS.STOMACH,
    BODY_PARTS.ABDOMEN,
    BODY_PARTS.BACK,
    BODY_PARTS.LOWER_BACK,
  ],
  'Arms & Shoulders': [
    BODY_PARTS.LEFT_SHOULDER,
    BODY_PARTS.RIGHT_SHOULDER,
    BODY_PARTS.LEFT_ARM,
    BODY_PARTS.RIGHT_ARM,
    BODY_PARTS.LEFT_ELBOW,
    BODY_PARTS.RIGHT_ELBOW,
    BODY_PARTS.LEFT_FOREARM,
    BODY_PARTS.RIGHT_FOREARM,
    BODY_PARTS.LEFT_WRIST,
    BODY_PARTS.RIGHT_WRIST,
    BODY_PARTS.LEFT_HAND,
    BODY_PARTS.RIGHT_HAND,
    BODY_PARTS.LEFT_HAND_FINGER,
    BODY_PARTS.RIGHT_HAND_FINGER,
  ],
  'Hips & Legs': [
    BODY_PARTS.LEFT_HIP,
    BODY_PARTS.RIGHT_HIP,
    BODY_PARTS.LEFT_THIGH,
    BODY_PARTS.RIGHT_THIGH,
    BODY_PARTS.LEFT_KNEE,
    BODY_PARTS.RIGHT_KNEE,
    BODY_PARTS.LEFT_SHIN,
    BODY_PARTS.RIGHT_SHIN,
    BODY_PARTS.LEFT_ANKLE,
    BODY_PARTS.RIGHT_ANKLE,
    BODY_PARTS.LEFT_FOOT,
    BODY_PARTS.RIGHT_FOOT,
    BODY_PARTS.LEFT_TOE,
    BODY_PARTS.RIGHT_TOE,
  ],
  'Other': [
    BODY_PARTS.RECTUM,
    BODY_PARTS.URINARY_BLADDER,
    BODY_PARTS.GENITALS,
  ],
}

// Function to detect body part from coordinates
export function detectBodyPartFromCoordinates(x: number, y: number, z: number = 0): string {
  // Convert coordinates to percentages if needed
  const xPercent = x > 1 ? x : x * 100
  const yPercent = y > 1 ? y : y * 100

  // Head region (top 15% of body)
  if (yPercent <= 15) {
    return BODY_PARTS.HEAD
  }
  
  // Neck region (15-20%)
  if (yPercent <= 20) {
    return BODY_PARTS.NECK
  }
  
  // Shoulder/Chest region (20-35%)
  if (yPercent <= 35) {
    if (xPercent < 25) {
      return BODY_PARTS.LEFT_SHOULDER
    } else if (xPercent > 75) {
      return BODY_PARTS.RIGHT_SHOULDER
    } else {
      return BODY_PARTS.CHEST
    }
  }
  
  // Arms (side regions)
  if (xPercent < 20 || xPercent > 80) {
    if (yPercent <= 50) {
      return xPercent < 50 ? BODY_PARTS.LEFT_ARM : BODY_PARTS.RIGHT_ARM
    } else if (yPercent <= 65) {
      return xPercent < 50 ? BODY_PARTS.LEFT_FOREARM : BODY_PARTS.RIGHT_FOREARM
    } else {
      return xPercent < 50 ? BODY_PARTS.LEFT_HAND : BODY_PARTS.RIGHT_HAND
    }
  }
  
  // Torso region (35-60%)
  if (yPercent <= 45) {
    return BODY_PARTS.STOMACH
  }
  if (yPercent <= 60) {
    return BODY_PARTS.ABDOMEN
  }
  
  // Hip region (60-70%)
  if (yPercent <= 70) {
    if (xPercent < 40) {
      return BODY_PARTS.LEFT_HIP
    } else if (xPercent > 60) {
      return BODY_PARTS.RIGHT_HIP
    } else {
      return BODY_PARTS.ABDOMEN
    }
  }
  
  // Thigh region (70-85%)
  if (yPercent <= 85) {
    return xPercent < 50 ? BODY_PARTS.LEFT_THIGH : BODY_PARTS.RIGHT_THIGH
  }
  
  // Knee region (85-90%)
  if (yPercent <= 90) {
    return xPercent < 50 ? BODY_PARTS.LEFT_KNEE : BODY_PARTS.RIGHT_KNEE
  }
  
  // Lower leg region (90-98%)
  if (yPercent <= 98) {
    return xPercent < 50 ? BODY_PARTS.LEFT_SHIN : BODY_PARTS.RIGHT_SHIN
  }
  
  // Foot region (98-100%)
  return xPercent < 50 ? BODY_PARTS.LEFT_FOOT : BODY_PARTS.RIGHT_FOOT
}

// Get body part label
export function getBodyPartLabel(bodyPart: string): string {
  return BODY_PART_LABELS[bodyPart] || bodyPart
}