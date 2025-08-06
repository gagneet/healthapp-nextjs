// app/api/patient/events/[eventId]/complete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import db from '@/src/models'

const { ScheduledEvent, AdherenceRecord } = db

interface EventParams {
  eventId: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: EventParams }
) {
  try {
    const { eventId } = params
    const body = await request.json()
    
    // Find the scheduled event
    const event = await ScheduledEvent.findByPk(eventId)
    
    if (!event) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: {
          error: {
            status: 'error',
            message: 'Scheduled event not found'
          }
        }
      }, { status: 404 })
    }

    // Update the event status
    await event.update({
      status: 'COMPLETED',
      completed_at: new Date(),
      completed_by: event.patient_id // Assuming self-completion
    })

    // Create adherence record
    await AdherenceRecord.create({
      patient_id: event.patient_id,
      scheduled_event_id: event.id,
      adherence_type: event.event_type,
      due_at: event.scheduled_for,
      recorded_at: new Date(),
      is_completed: true,
      is_partial: false,
      is_missed: false,
      response_data: {
        completed_via: 'patient_app',
        completion_time: new Date().toISOString(),
        notes: body.notes || ''
      }
    })

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          id: event.id,
          status: event.status,
          completed_at: event.completed_at
        },
        message: 'Event marked as completed successfully'
      }
    })

  } catch (error) {
    console.error('Error completing event:', error)
    
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: {
        error: {
          status: 'error',
          message: 'Failed to complete event'
        }
      }
    }, { status: 500 })
  }
}