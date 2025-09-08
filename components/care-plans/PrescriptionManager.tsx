'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';

export function PrescriptionManager({ patientId }: { patientId: string }) {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [newPrescription, setNewPrescription] = useState({
    medicationName: '',
    strength: '',
    dosageForm: 'tablet',
    doseAmount: 0,
    doseUnit: '',
    frequency: '',
    sigInstructions: '',
    quantityPrescribed: 0,
    quantityUnit: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const response = await fetch(`/api/prescriptions?patientId=${patientId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch prescriptions');
        }
        const data = await response.json();
        setPrescriptions(data.prescriptions);
      } catch (error) {
        toast.error('Could not fetch prescriptions.');
      }
    };
    fetchPrescriptions();
  }, [patientId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPrescription((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const promise = fetch('/api/prescriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          ...newPrescription,
          patientId,
          doseAmount: Number(newPrescription.doseAmount),
          quantityPrescribed: Number(newPrescription.quantityPrescribed),
      }),
    }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Failed to add prescription');
        }
        return data;
    });

    toast.promise(promise, {
        loading: 'Adding prescription...',
        success: (data) => {
            setPrescriptions((prev: any) => [...prev, data.prescription]);
            setIsLoading(false);
            return 'Prescription added successfully!';
        },
        error: (err) => {
            setIsLoading(false);
            return err.message;
        },
    });
  };

  return (
    <div>
      <h3 className="text-lg font-medium">Prescriptions</h3>
      <ul className="mt-4 space-y-2">
        {prescriptions.map((p: any) => (
          <li key={p.id} className="p-2 border rounded-md">
            <p className="font-semibold">{p.medication.name} {p.medication.strength}</p>
            <p className="text-sm text-gray-500">{p.dosing.sigInstructions}</p>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAddPrescription} className="mt-6 border-t pt-4">
        <h4 className="font-medium">Add New Prescription</h4>
        {/* Simplified form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
                <Label htmlFor="medicationName">Medication Name</Label>
                <Input id="medicationName" name="medicationName" value={newPrescription.medicationName} onChange={handleInputChange} />
            </div>
            <div>
                <Label htmlFor="strength">Strength</Label>
                <Input id="strength" name="strength" value={newPrescription.strength} onChange={handleInputChange} />
            </div>
            <div>
                <Label htmlFor="sigInstructions">Instructions (SIG)</Label>
                <Textarea id="sigInstructions" name="sigInstructions" value={newPrescription.sigInstructions} onChange={handleInputChange} />
            </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Prescription'}
          </Button>
        </div>
      </form>
    </div>
  );
}
