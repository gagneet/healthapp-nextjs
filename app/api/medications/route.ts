import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  start_date: string
  end_date?: string
  status: 'active' | 'paused' | 'completed'
  is_critical: boolean
  adherence_rate?: number
  last_taken?: string
  next_due?: string
  instructions?: string
  patient_id: string
  care_plan_id?: string
  doctor_id: string
  created_at: string
}

function verifyToken(request: NextRequest): { userId: string } | null {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    return { userId: decoded.id || decoded.userId }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const auth = verifyToken(request)
    if (!auth) {
      return NextResponse.json(
        { 
          status: false, 
          statusCode: 401, 
          payload: { 
            error: { 
              status: 'error', 
              message: 'Unauthorized access' 
            } 
          } 
        },
        { status: 401 }
      )
    }

    const medicationData: Omit<Medication, 'id' | 'created_at'> = await request.json()

    // TODO: Replace with actual API call to adherelive-be
    // const response = await fetch(`${process.env.ADHERELIVE_BE_URL}/api/medications/`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': request.headers.get('authorization')!,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(medicationData)
    // })
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to create medication in adherelive-be')
    // }
    // 
    // const data = await response.json()
    // return NextResponse.json(data)

    // For now, simulate medication creation
    const createdMedication: Medication = {
      id: `medication_${Date.now()}`,
      ...medicationData,
      created_at: new Date().toISOString()
    }

    console.log('Medication created:', createdMedication) // For development

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: createdMedication,
        message: 'Medication added successfully'
      }
    })

  } catch (error) {
    console.error('Error creating medication:', error)
    return NextResponse.json(
      {
        status: false,
        statusCode: 500,
        payload: {
          error: {
            status: 'error',
            message: 'Failed to add medication'
          }
        }
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const auth = verifyToken(request)
    if (!auth) {
      return NextResponse.json(
        { 
          status: false, 
          statusCode: 401, 
          payload: { 
            error: { 
              status: 'error', 
              message: 'Unauthorized access' 
            } 
          } 
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')

    // TODO: Replace with actual API call to adherelive-be
    // const response = await fetch(`${process.env.ADHERELIVE_BE_URL}/api/medications/?patient_id=${patientId}`, {
    //   headers: {
    //     'Authorization': request.headers.get('authorization')!,
    //     'Content-Type': 'application/json'
    //   }
    // })
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to fetch medications from adherelive-be')
    // }
    // 
    // const data = await response.json()
    // return NextResponse.json(data)

    // Return empty array for now - should come from database
    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { medications: [] },
        message: 'Medications retrieved successfully'
      }
    })

  } catch (error) {
    console.error('Error fetching medications:', error)
    return NextResponse.json(
      {
        status: false,
        statusCode: 500,
        payload: {
          error: {
            status: 'error',
            message: 'Failed to retrieve medications'
          }
        }
      },
      { status: 500 }
    )
  }
}