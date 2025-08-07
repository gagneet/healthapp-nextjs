// src/utils/responseFormatter.js
class ResponseFormatter {
  static success(data, message = 'Operation completed successfully', statusCode = 200) {
    return {
      status: true,
      statusCode,
      payload: {
        data,
        message
      }
    };
  }

  static error(message, statusCode = 400, errorStatus = 'ERROR') {
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

  static paginated(data, pagination, message = 'Data retrieved successfully') {
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

  static formatPatientResponse(patient) {
    return {
      [patient.id]: {
        basic_info: {
          id: patient.id.toString(),
          user_id: patient.user_id.toString(),
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

  static formatDoctorResponse(doctor) {
    return {
      [doctor.id]: {
        basic_info: {
          id: doctor.id.toString(),
          user_id: doctor.user_id.toString(),
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
