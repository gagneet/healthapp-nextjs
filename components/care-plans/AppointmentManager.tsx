'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function AppointmentManager({ carePlan }: { carePlan: any }) {
  const [appointments, setAppointments] = useState(carePlan.appointments);
  const [newAppointment, setNewAppointment] = useState({
    description: '',
    startDate: '',
    startTime: '',
    endTime: '',
  });
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div>
      <h3 className="text-lg font-medium">Appointments</h3>
      <ul className="mt-4 space-y-2">
        {appointments.map((appt: any) => (
          <li key={appt.id} className="flex justify-between items-center p-2 border rounded-md">
            <div>
              <p className="font-semibold">{format(new Date(appt.startDate), 'PPP')} at {format(new Date(appt.startTime), 'p')}</p>
              <p className="text-sm text-gray-500">{appt.description}</p>
            </div>
            <div>
              {/* Add edit/delete buttons here */}
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
