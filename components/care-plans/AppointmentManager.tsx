'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function EditAppointmentModal({ appointment, carePlanId, onUpdate, onClose }: { appointment: any, carePlanId: string, onUpdate: (updatedAppt: any) => void, onClose: () => void }) {
    const [updatedAppt, setUpdatedAppt] = useState(appointment);
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUpdatedAppt((prev: any) => ({ ...prev, [name]: value }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const promise = fetch(`/api/care-plans/${carePlanId}/appointments/${appointment.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description: updatedAppt.description,
                startDate: new Date(updatedAppt.startDate).toISOString(),
                startTime: updatedAppt.startTime,
                endTime: updatedAppt.endTime,
            }),
        }).then(res => res.json().then(data => res.ok ? data : Promise.reject(data)));

        toast.promise(promise, {
            loading: 'Updating appointment...',
            success: (data) => {
                onUpdate(data.payload);
                setIsLoading(false);
                onClose();
                return 'Appointment updated successfully!';
            },
            error: (err) => {
                setIsLoading(false);
                return err.payload?.error?.message || 'Failed to update appointment';
            }
        });
    }

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-medium mb-4">Edit Appointment</h3>
                <form onSubmit={handleSubmit}>
                    {/* A more complete form would be here */}
                     <div className="space-y-1">
                        <Label htmlFor="description">Description</Label>
                        <Input
                        id="description"
                        name="description"
                        value={updatedAppt.description}
                        onChange={handleInputChange}
                        />
                    </div>
                    <div className="mt-4 flex justify-end space-x-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? 'Updating...' : 'Update'}</Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export function AppointmentManager({ carePlan }: { carePlan: any }) {
  const [appointments, setAppointments] = useState(carePlan.appointments);
  const [newAppointment, setNewAppointment] = useState({
    description: '',
    startDate: '',
    startTime: '',
    endTime: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAppointment((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const promise = fetch(`/api/care-plans/${carePlan.id}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...newAppointment,
        startDate: new Date(newAppointment.startDate).toISOString(),
      }),
    }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.payload?.error?.message || 'Failed to add appointment');
        }
        return data.payload;
    });

    toast.promise(promise, {
        loading: 'Adding appointment...',
        success: (data) => {
            setAppointments((prev: any) => [...prev, data]);
            setNewAppointment({
                description: '',
                startDate: '',
                startTime: '',
                endTime: '',
            });
            setIsLoading(false);
            return 'Appointment added successfully!';
        },
        error: (err) => {
            setIsLoading(false);
            return err.message;
        },
    });
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
      if (!confirm('Are you sure you want to delete this appointment?')) {
          return;
      }

      const promise = fetch(`/api/care-plans/${carePlan.id}/appointments/${appointmentId}`, {
          method: 'DELETE',
      }).then(res => {
          if (res.status !== 204) {
              return res.json().then(data => Promise.reject(data));
          }
          return res;
      });

      toast.promise(promise, {
          loading: 'Deleting appointment...',
          success: () => {
              setAppointments((prev: any) => prev.filter((a: any) => a.id !== appointmentId));
              return 'Appointment deleted successfully!';
          },
          error: (err) => {
              return err.payload?.error?.message || 'Failed to delete appointment';
          }
      });
  }

  const handleUpdateAppointment = (updatedAppt: any) => {
      setAppointments((prev: any) => prev.map((a: any) => a.id === updatedAppt.id ? updatedAppt : a));
  }

  return (
    <div>
        {editingAppointment && (
            <EditAppointmentModal
                appointment={editingAppointment}
                carePlanId={carePlan.id}
                onUpdate={handleUpdateAppointment}
                onClose={() => setEditingAppointment(null)}
            />
        )}
      <h3 className="text-lg font-medium">Appointments</h3>
      <ul className="mt-4 space-y-2">
        {appointments.map((appt: any) => (
          <li key={appt.id} className="flex justify-between items-center p-2 border rounded-md">
            <div>
              <p className="font-semibold">{format(new Date(appt.startDate), 'PPP')} at {format(new Date(appt.startTime), 'p')}</p>
              <p className="text-sm text-gray-500">{appt.description}</p>
            </div>
            <div className="space-x-2">
                <Button size="sm" variant="outline" onClick={() => setEditingAppointment(appt)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteAppointment(appt.id)}>Delete</Button>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAddAppointment} className="mt-6 border-t pt-4">
        <h4 className="font-medium">Add New Appointment</h4>
        <div className="grid grid-cols-1 gap-4 mt-2 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={newAppointment.description}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="startDate">Date</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={newAppointment.startDate}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              name="startTime"
              type="time"
              value={newAppointment.startTime}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              name="endTime"
              type="time"
              value={newAppointment.endTime}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Appointment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
