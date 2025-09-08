'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const mockVitalTypes = [
    { id: '3c8c365b-6a84-4bb3-964a-435f35544770', name: 'Blood Pressure', unit: 'mmHg' },
    { id: 'b4c8f7d6-a8f1-4f5a-b5e2-3e3a4b9c1d2e', name: 'Heart Rate', unit: 'bpm' },
    { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', name: 'Weight', unit: 'kg' },
    { id: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210', name: 'Blood Glucose', unit: 'mg/dL' },
    { id: '98765432-10fe-dcba-9876-543210fedcba', name: 'Temperature', unit: '°C' },
];

export function VitalsManager({ carePlan }: { carePlan: any }) {
  const [requirements, setRequirements] = useState(carePlan.vitalRequirements);
  const [readings, setReadings] = useState<any[]>([]);
  const [newRequirement, setNewRequirement] = useState({
    vitalTypeId: '',
    frequency: '',
  });
  const [newReading, setNewReading] = useState({
    vitalTypeId: '',
    value: '',
    unit: '',
    readingTime: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // In a real app, you would fetch the patient's vital readings here
    // For now, we'll just use the ones from the care plan if they exist
    setReadings(carePlan.vitals || []);
  }, [carePlan.vitals]);

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const promise = fetch(`/api/care-plans/${carePlan.id}/vital-requirements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequirement),
    }).then(res => res.json().then(data => res.ok ? data : Promise.reject(data)));

    toast.promise(promise, {
        loading: 'Adding vital requirement...',
        success: (data) => {
            setRequirements((prev: any) => [...prev, data.payload]);
            setIsLoading(false);
            return 'Vital requirement added!';
        },
        error: (err) => {
            setIsLoading(false);
            return err.payload?.error?.message || 'Failed to add requirement';
        }
    });
  };

  const handleAddReading = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const promise = fetch(`/api/patients/${carePlan.patientId}/vital-readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...newReading,
            value: parseFloat(newReading.value),
            readingTime: new Date(newReading.readingTime).toISOString(),
        }),
    }).then(res => res.json().then(data => res.ok ? data : Promise.reject(data)));

    toast.promise(promise, {
        loading: 'Adding vital reading...',
        success: (data) => {
            setReadings((prev: any) => [...prev, data.payload]);
            setIsLoading(false);
            return 'Vital reading added!';
        },
        error: (err) => {
            setIsLoading(false);
            return err.payload?.error?.message || 'Failed to add reading';
        }
    });
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-medium">Vital Requirements</h3>
          <ul className="mt-4 space-y-2">
            {requirements.map((req: any) => (
              <li key={req.id} className="p-2 border rounded-md">
                <p className="font-semibold">{mockVitalTypes.find(vt => vt.id === req.vitalTypeId)?.name}</p>
                <p className="text-sm text-gray-500">{req.frequency}</p>
              </li>
            ))}
          </ul>
          <form onSubmit={handleAddRequirement} className="mt-6 border-t pt-4">
            <h4 className="font-medium">Add New Requirement</h4>
            <div className="space-y-2 mt-2">
              <Label>Vital Type</Label>
              <select onChange={(e) => setNewRequirement({...newRequirement, vitalTypeId: e.target.value})} className="w-full p-2 border rounded-md">
                  <option value="">Select a vital type</option>
                  {mockVitalTypes.map(vt => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
              </select>
              <Label>Frequency</Label>
              <Input value={newRequirement.frequency} onChange={(e) => setNewRequirement({...newRequirement, frequency: e.target.value})} placeholder="e.g., Twice daily" />
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={isLoading}>Add Requirement</Button>
            </div>
          </form>
        </div>
        <div>
          <h3 className="text-lg font-medium">Vital Readings</h3>
          <ul className="mt-4 space-y-2">
            {readings.map((reading: any) => (
              <li key={reading.id} className="p-2 border rounded-md">
                <p className="font-semibold">{mockVitalTypes.find(vt => vt.id === reading.vitalTypeId)?.name}: {reading.value} {reading.unit}</p>
                <p className="text-sm text-gray-500">Taken on {format(new Date(reading.readingTime), 'PPP p')}</p>
              </li>
            ))}
          </ul>
           <form onSubmit={handleAddReading} className="mt-6 border-t pt-4">
            <h4 className="font-medium">Add New Reading</h4>
            <div className="space-y-2 mt-2">
              <Label>Vital Type</Label>
              <select onChange={(e) => setNewReading({...newReading, vitalTypeId: e.target.value, unit: mockVitalTypes.find(vt => vt.id === e.target.value)?.unit || ''})} className="w-full p-2 border rounded-md">
                  <option value="">Select a vital type</option>
                  {requirements.map((req: any) => <option key={req.vitalTypeId} value={req.vitalTypeId}>{mockVitalTypes.find(vt => vt.id === req.vitalTypeId)?.name}</option>)}
              </select>
              <Label>Value</Label>
              <Input value={newReading.value} onChange={(e) => setNewReading({...newReading, value: e.target.value})} />
              <Label>Date and Time</Label>
              <Input type="datetime-local" value={newReading.readingTime} onChange={(e) => setNewReading({...newReading, readingTime: e.target.value})} />
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={isLoading}>Add Reading</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
