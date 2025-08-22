// app/api/admin/patients/route.ts - Admin patient management API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only admins and healthcare providers can manage patients
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'HSP'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Admin or healthcare provider access required' } }
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const doctorId = searchParams.get('doctor_id');
    const offset = (page - 1) * limit;

    let whereClause: any = {};
    
    if (search) {
      whereClause.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { first_name: { contains: search, mode: 'insensitive' } },
          { last_name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    if (status) {
      whereClause.user = {
        ...whereClause.user,
        account_status: status
      };
    }

    // Role-based filtering
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctors.findFirst({
        where: { user_id: session.user.id }
      });
      if (doctor) {
        whereClause.primary_care_doctor_id = doctor.id;
      }
    } else if (doctorId && ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      whereClause.primary_care_doctor_id = doctorId;
    }

    const [patients, totalCount] = await Promise.all([
      prisma.Patient.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              first_name: true,
              last_name: true,
              phone: true,
              date_of_birth: true,
              gender: true,
              account_status: true,
              email_verified: true,
              email_verified_at: true,
              created_at: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          doctors: {
            select: {
              id: true,
              doctor_id: true,
              users_doctors_user_idTousers: {
                select: {
                  name: true,
                  first_name: true,
                  last_name: true,
                  email: true
                }
              },
              specialities: {
                select: {
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              care_plans: true,
              appointments: true,
              medications: true,
              vitals: true
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      prisma.Patient.count({ where: whereClause })
    ]);

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          patients,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        },
        message: 'Patients retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only admins and doctors can create patients
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Admin or doctor access required' } }
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      date_of_birth,
      gender,
      primary_care_doctor_id,
      organization_id,
      medical_record_number,
      height_cm,
      weight_kg,
      blood_type,
      allergies,
      medical_history,
      emergency_contacts
    } = body;

    // Validation
    if (!email || !first_name || !last_name) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Email, first name, and last name are required' } }
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.User.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({
        status: false,
        statusCode: 409,
        payload: { error: { status: 'conflict', message: 'Email already exists' } }
      }, { status: 409 });
    }

    // Hash password (if provided, otherwise generate temporary)
    const tempPassword = password || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Create user and patient in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with Auth.js v5 compatibility
      const fullName = `${first_name} ${last_name}`.trim();
      const newUser = await tx.user.create({
        data: {
          email,
          password_hash: hashedPassword,
          // Auth.js v5 fields
          name: fullName,
          email_verified_at: new Date(),
          image: null,
          // Legacy fields for backward compatibility
          first_name,
          last_name,
          full_name: fullName,
          phone,
          date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
          gender,
          role: 'PATIENT',
          account_status: 'ACTIVE',
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Generate patient ID
      const patientId = `PAT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      // Create patient profile
      const patient = await tx.patient.create({
        data: {
          id: randomUUID(),
          patient_id: patientId,
          user_id: newUser.id,
          primary_care_doctor_id,
          organization_id,
          medical_record_number: medical_record_number || `MRN-${patientId}`,
          height_cm: height_cm ? parseFloat(height_cm) : null,
          weight_kg: weight_kg ? parseFloat(weight_kg) : null,
          blood_type,
          allergies: allergies || [],
          medical_history: medical_history || [],
          emergency_contacts: emergency_contacts || [],
          created_at: new Date(),
          updated_at: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              first_name: true,
              last_name: true,
              phone: true,
              date_of_birth: true,
              gender: true
            }
          },
          doctors: {
            select: {
              id: true,
              doctor_id: true,
              users_doctors_user_idTousers: {
                select: {
                  name: true,
                  first_name: true,
                  last_name: true
                }
              }
            }
          }
        }
      });

      return { patient, temporaryPassword: !password ? tempPassword : null };
    });

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: result,
        message: 'Patient created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
