// src/utils/responseFormatter.ts
class ResponseFormatter {
  static success(data: any, message: string = 'Operation completed successfully', statusCode: number = 200) {
    return {
      status: true,
      statusCode,
      payload: {
        data,
        message
      }
    };
  }

  static error(message: string, statusCode: number = 400, errorStatus: string = 'ERROR') {
    return {
      status: false,
      statusCode,
      payload: {
        error: {
          status: errorStatus,
          message
        }
      }
    };
  }

  static paginated(data: any, pagination: any, message: string = 'Data retrieved successfully') {
    return {
      status: true,
      statusCode: 200,
      payload: {
        data,
        pagination,
        message
      }
    };
  }

  static formatPatientResponse(patient: any) {
    return {
      [patient.id]: {
        basic_info: {
          id: patient.id.toString(),
          userId: patient.userId.toString(),
          gender: patient.gender,
          height: patient.height,
          weight: patient.weight,
          height_cm: patient.height_cm,
          weight_kg: patient.weight_kg,
          current_age: patient.current_age,
          age: `${patient.current_age} years`,
          first_name: patient.first_name,
          middle_name: patient.middle_name,
          last_name: patient.last_name,
          full_name: `${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}`.trim(),
          address: `${patient.street || ''} ${patient.city || ''} ${patient.state || ''}`.trim(),
          uid: patient.uid,
          mobile_number: patient.user?.mobile_number
        },
        payment_terms_accepted: !!patient.payment_terms_accepted,
        activated_on: patient.activated_on,
        details: {
          profile_pic: patient.details?.profile_pic || null,
          comorbidities: patient.details?.comorbidities || null,
          allergies: patient.details?.allergies || null
        },
        dob: patient.dob,
        created_at: patient.created_at,
        care_plan_id: null,
        user_role_id: null,
        feedId: Buffer.from(`patient_${patient.id}`).toString('base64'),
        notificationToken: 'getstream_token'
      }
    };
  }

  static formatDoctorResponse(doctor: any) {
    return {
      [doctor.id]: {
        basic_info: {
          id: doctor.id.toString(),
          userId: doctor.userId.toString(),
          gender: doctor.gender,
          first_name: doctor.first_name,
          middle_name: doctor.middle_name,
          last_name: doctor.last_name,
          full_name: `${doctor.first_name} ${doctor.middle_name || ''} ${doctor.last_name}`.trim(),
          city: doctor.city,
          place_id: doctor.place_id,
          latitude: doctor.latitude,
          longitude: doctor.longitude,
          speciality_id: doctor.speciality_id?.toString(),
          profile_pic: doctor.profile_pic,
          signature_pic: doctor.signature_pic
        },
        qualifications: [],
        activated_on: doctor.activated_on,
        razorpay_account_id: null,
        watchlist_patient_ids: []
      }
    };
  }
}

export default ResponseFormatter;
