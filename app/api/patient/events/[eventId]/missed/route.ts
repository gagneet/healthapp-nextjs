// app/api/patient/events/[eventId]/missed/route.ts
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
      status: 'MISSED'
    })

    // Create adherence record
    await AdherenceRecord.create({
      patient_id: event.patient_id,
      scheduled_event_id: event.id,
      adherence_type: event.event_type,
      due_at: event.scheduled_for,
      recorded_at: null,
      is_completed: false,
      is_partial: false,
      is_missed: true,
      response_data: {
        marked_missed_via: 'patient_app',
        marked_at: new Date().toISOString(),
        reason: body.reason || 'Patient reported missed',
        notes: body.notes || ''
      }
    })

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          id: event.id,
          status: event.status
        },
        message: 'Event marked as missed successfully'
      }
    })

  } catch (error) {
    console.error('Error marking event as missed:', error)
    
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: {
        error: {
          status: 'error',
          message: 'Failed to mark event as missed'
        }
      }
    }, { status: 500 })
  }
}