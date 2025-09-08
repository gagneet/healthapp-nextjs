'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function AssignDoctorModal({ patientId, onAssign, onClose }: { patientId: string, onAssign: () => void, onClose: () => void }) {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await fetch('/api/doctors');
                if (!res.ok) throw new Error("Failed to fetch doctors");
                const data = await res.json();
                setDoctors(data.payload);
            } catch (error) {
                toast.error("Could not fetch doctors");
            }
        }
        fetchDoctors();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoctor) return;
        setIsLoading(true);
        const promise = fetch('/api/patient-doctor-assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientId, doctorId: selectedDoctor }),
        }).then(res => res.json().then(data => res.ok ? data : Promise.reject(data)));

        toast.promise(promise, {
            loading: 'Assigning doctor...',
            success: (data) => {
                onAssign();
                setIsLoading(false);
                onClose();
                return 'Doctor assigned successfully!';
            },
            error: (err) => {
                setIsLoading(false);
                return err.payload?.error?.message || 'Failed to assign doctor';
            }
        });
    }

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-medium mb-4">Assign Doctor</h3>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label>Select Doctor</Label>
                        <select onChange={(e) => setSelectedDoctor(e.target.value)} className="w-full p-2 border rounded-md">
                            <option value="">Select a doctor</option>
                            {doctors.map(d => <option key={d.id} value={d.id}>{d.user.name}</option>)}
                        </select>
                    </div>
                    <div className="mt-4 flex justify-end space-x-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isLoading || !selectedDoctor}>{isLoading ? 'Assigning...' : 'Assign'}</Button>
                    </div>
                </form>
            </div>
        </div>
    )
}


export function SymptomManager({ carePlan }: { carePlan: any }) {
  const [symptoms, setSymptoms] = useState(carePlan.symptoms);
  const [newSymptom, setNewSymptom] = useState({
    symptomName: '',
    severity: 5,
    description: '',
    onsetTime: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewSymptom((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSymptom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const promise = fetch(`/api/care-plans/${carePlan.id}/symptoms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          ...newSymptom,
          severity: Number(newSymptom.severity),
          onsetTime: new Date(newSymptom.onsetTime).toISOString(),
      }),
    }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.payload?.error?.message || 'Failed to add symptom');
        }
        return data.payload;
    });

    toast.promise(promise, {
        loading: 'Adding symptom...',
        success: (data) => {
            setSymptoms((prev: any) => [...prev, data]);
            setNewSymptom({
                symptomName: '',
                severity: 5,
                description: '',
                onsetTime: '',
            });
            setIsLoading(false);
            return 'Symptom added successfully!';
        },
        error: (err) => {
            setIsLoading(false);
            return err.message;
        },
    });
  };

  return (
    <div>
        {isAssigning && (
            <AssignDoctorModal
                patientId={carePlan.patientId}
                onAssign={() => toast.success("Doctor assigned successfully!")}
                onClose={() => setIsAssigning(false)}
            />
        )}
      <h3 className="text-lg font-medium">Symptoms</h3>
      <ul className="mt-4 space-y-2">
        {symptoms.map((symptom: any) => (
          <li key={symptom.id} className="flex justify-between items-center p-2 border rounded-md">
            <div>
              <p className="font-semibold">{symptom.symptomName} (Severity: {symptom.severity}/10)</p>
              <p className="text-sm text-gray-500">{symptom.description}</p>
              <p className="text-xs text-gray-400">Onset: {format(new Date(symptom.onsetTime), 'PPP')}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setIsAssigning(true)}>Assign to Doctor</Button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAddSymptom} className="mt-6 border-t pt-4">
        <h4 className="font-medium">Add New Symptom</h4>
        <div className="grid grid-cols-1 gap-4 mt-2 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="symptomName">Symptom</Label>
            <Input
              id="symptomName"
              name="symptomName"
              value={newSymptom.symptomName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="severity">Severity (1-10)</Label>
            <Input
              id="severity"
              name="severity"
              type="range"
              min="1"
              max="10"
              value={newSymptom.severity}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={newSymptom.description}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="onsetTime">Onset Date</Label>
            <Input
              id="onsetTime"
              name="onsetTime"
              type="datetime-local"
              value={newSymptom.onsetTime}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Symptom'}
          </Button>
        </div>
      </form>
    </div>
  );
}
