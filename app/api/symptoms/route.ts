import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

interface Symptom {
  id: string
  name: string
  severity: number
  description: string
  body_part: string
  onset_time: string
  recorded_at: string
  x: number
  y: number
  z: number
  status: 'active' | 'resolved' | 'improving'
  duration?: string
  triggers?: string
  patient_id: string
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

    const symptomData: Omit<Symptom, 'id'> = await request.json()

    // TODO: Replace with actual API call to adherelive-be
    // const response = await fetch(`${process.env.ADHERELIVE_BE_URL}/api/symptoms/`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': request.headers.get('authorization')!,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(symptomData)
    // })
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to create symptom in adherelive-be')
    // }
    // 
    // const data = await response.json()
    // return NextResponse.json(data)

    // For now, simulate symptom creation
    const createdSymptom: Symptom = {
      id: `symptom_${Date.now()}`,
      ...symptomData,
      recorded_at: new Date().toISOString()
    }

    console.log('Symptom created:', createdSymptom) // For development

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: createdSymptom,
        message: 'Symptom recorded successfully'
      }
    })

  } catch (error) {
    console.error('Error creating symptom:', error)
    return NextResponse.json(
      {
        status: false,
        statusCode: 500,
        payload: {
          error: {
            status: 'error',
            message: 'Failed to record symptom'
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
    // const response = await fetch(`${process.env.ADHERELIVE_BE_URL}/api/symptoms/?patient_id=${patientId}`, {
    //   headers: {
    //     'Authorization': request.headers.get('authorization')!,
    //     'Content-Type': 'application/json'
    //   }
    // })
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to fetch symptoms from adherelive-be')
    // }
    // 
    // const data = await response.json()
    // return NextResponse.json(data)

    // Return empty array for now - should come from database
    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { symptoms: [] },
        message: 'Symptoms retrieved successfully'
      }
    })

  } catch (error) {
    console.error('Error fetching symptoms:', error)
    return NextResponse.json(
      {
        status: false,
        statusCode: 500,
        payload: {
          error: {
            status: 'error',
            message: 'Failed to retrieve symptoms'
          }
        }
      },
      { status: 500 }
    )
  }
}