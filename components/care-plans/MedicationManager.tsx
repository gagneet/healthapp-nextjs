'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function EditMedicationModal({ medication, carePlanId, onUpdate, onClose }: { medication: any, carePlanId: string, onUpdate: (updatedMed: any) => void, onClose: () => void }) {
    const [updatedMed, setUpdatedMed] = useState(medication);
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setUpdatedMed((prev: any) => ({ ...prev, [name]: value }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const promise = fetch(`/api/care-plans/${carePlanId}/medications/${medication.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description: updatedMed.description,
                startDate: new Date(updatedMed.startDate).toISOString(),
                endDate: updatedMed.endDate ? new Date(updatedMed.endDate).toISOString() : null,
            }),
        }).then(res => res.json().then(data => res.ok ? data : Promise.reject(data)));

        toast.promise(promise, {
            loading: 'Updating medication...',
            success: (data) => {
                onUpdate(data.payload);
                setIsLoading(false);
                onClose();
                return 'Medication updated successfully!';
            },
            error: (err) => {
                setIsLoading(false);
                return err.payload?.error?.message || 'Failed to update medication';
            }
        });
    }

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-medium mb-4">Edit Medication</h3>
                <form onSubmit={handleSubmit}>
                    {/* A more complete form would be here */}
                    <div className="space-y-1">
                        <Label htmlFor="description">Description (e.g., dosage)</Label>
                        <Input
                        id="description"
                        name="description"
                        value={updatedMed.description}
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


export function MedicationManager({ carePlan }: { carePlan: any }) {
  const [medications, setMedications] = useState(carePlan.prescribedMedications);
  const [availableMedicines, setAvailableMedicines] = useState<any[]>([]);
  const [newMedication, setNewMedication] = useState({
    medicineId: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [editingMedication, setEditingMedication] = useState<any>(null);

  useEffect(() => {
      const fetchMedicines = async () => {
          setIsFetching(true);
          try {
              const res = await fetch('/api/medicines'); // Assuming an endpoint to get all medicines
              if(!res.ok) throw new Error("Failed to fetch medicines");
              const data = await res.json();
              setAvailableMedicines(data.payload);
          } catch (error) {
              toast.error("Could not fetch medicines");
          } finally {
              setIsFetching(false);
          }
      }
      fetchMedicines();
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
            // We need to get the medicine details to display the name
            const medicineDetails = availableMedicines.find(m => m.id === data.medicineId);
            setMedications((prev: any) => [...prev, {...data, medicine: medicineDetails}]);
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

  const handleDeleteMedication = async (medicationId: string) => {
      if (!confirm('Are you sure you want to delete this medication?')) {
          return;
      }

      const promise = fetch(`/api/care-plans/${carePlan.id}/medications/${medicationId}`, {
          method: 'DELETE',
      }).then(res => {
          if (res.status !== 204) {
              return res.json().then(data => Promise.reject(data));
          }
          return res;
      });

      toast.promise(promise, {
          loading: 'Deleting medication...',
          success: () => {
              setMedications((prev: any) => prev.filter((m: any) => m.id !== medicationId));
              return 'Medication deleted successfully!';
          },
          error: (err) => {
              return err.payload?.error?.message || 'Failed to delete medication';
          }
      });
  }

  const handleUpdateMedication = (updatedMed: any) => {
      setMedications((prev: any) => prev.map((m: any) => m.id === updatedMed.id ? updatedMed : m));
  }


  return (
    <div>
        {editingMedication && (
            <EditMedicationModal
                medication={editingMedication}
                carePlanId={carePlan.id}
                onUpdate={handleUpdateMedication}
                onClose={() => setEditingMedication(null)}
            />
        )}
      <h3 className="text-lg font-medium">Medications</h3>
      <ul className="mt-4 space-y-2">
        {medications.map((med: any) => (
          <li key={med.id} className="flex justify-between items-center p-2 border rounded-md">
            <div>
              <p className="font-semibold">{med.medicine.name}</p>
              <p className="text-sm text-gray-500">{med.description}</p>
            </div>
            <div className="space-x-2">
              <Button size="sm" variant="outline" onClick={() => setEditingMedication(med)}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => handleDeleteMedication(med.id)}>Delete</Button>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAddMedication} className="mt-6 border-t pt-4">
        <h4 className="font-medium">Add New Medication</h4>
        <div className="grid grid-cols-1 gap-4 mt-2 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="medicineId">Medicine</Label>
            <select
              id="medicineId"
              name="medicineId"
              value={newMedication.medicineId}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            >
                <option value="">Select a medicine</option>
                {availableMedicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
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
