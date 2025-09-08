'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';

export function MedicationManager({ carePlan }: { carePlan: any }) {
  const [medications, setMedications] = useState(carePlan.prescribedMedications);
  const [newMedication, setNewMedication] = useState({
    medicineId: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewMedication((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const promise = fetch(`/api/care-plans/${carePlan.id}/medications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          ...newMedication,
          startDate: new Date(newMedication.startDate).toISOString(),
          endDate: newMedication.endDate ? new Date(newMedication.endDate).toISOString() : undefined,
      }),
    }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.payload?.error?.message || 'Failed to add medication');
        }
        return data.payload;
    });

    toast.promise(promise, {
        loading: 'Adding medication...',
        success: (data) => {
            setMedications((prev: any) => [...prev, data]);
            setNewMedication({
                medicineId: '',
                description: '',
                startDate: '',
                endDate: '',
            });
            setIsLoading(false);
            return 'Medication added successfully!';
        },
        error: (err) => {
            setIsLoading(false);
            return err.message;
        },
    });
  };

  return (
    <div>
      <h3 className="text-lg font-medium">Medications</h3>
      <ul className="mt-4 space-y-2">
        {medications.map((med: any) => (
          <li key={med.id} className="flex justify-between items-center p-2 border rounded-md">
            <div>
              <p className="font-semibold">{med.medicineId}</p> {/* Replace with medicine name later */}
              <p className="text-sm text-gray-500">{med.description}</p>
            </div>
            <div>
              {/* Add edit/delete buttons here */}
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAddMedication} className="mt-6 border-t pt-4">
        <h4 className="font-medium">Add New Medication</h4>
        <div className="grid grid-cols-1 gap-4 mt-2 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="medicineId">Medicine ID</Label>
            <Input
              id="medicineId"
              name="medicineId"
              value={newMedication.medicineId}
              onChange={handleInputChange}
              placeholder="Enter Medicine ID"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description (e.g., dosage)</Label>
            <Input
              id="description"
              name="description"
              value={newMedication.description}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={newMedication.startDate}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={newMedication.endDate}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Medication'}
          </Button>
        </div>
      </form>
    </div>
  );
}
