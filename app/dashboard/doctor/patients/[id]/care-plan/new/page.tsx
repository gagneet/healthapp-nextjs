'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import toast, { Toaster } from 'react-hot-toast';

export default function NewCarePlanPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [followUpAdvise, setFollowUpAdvise] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const promise = fetch('/api/care-plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patientId,
        title,
        description,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        clinicalNotes,
        followUpAdvise,
      }),
    }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.payload?.error?.message || 'Failed to create care plan');
        }
        return data;
    });

    toast.promise(promise, {
      loading: 'Creating care plan...',
      success: (data) => {
        router.push(`/dashboard/doctor/patients/${patientId}`);
        return 'Care plan created successfully!';
      },
      error: (err) => {
          setIsLoading(false)
          setError(err.message)
          return err.message
      },
    });
  };

  return (
    <div className="container mx-auto p-4">
        <Toaster />
      <Card>
        <CardHeader>
          <CardTitle>Create New Care Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="clinicalNotes">Clinical Notes</Label>
              <Textarea id="clinicalNotes" value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} />
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="followUpAdvise">Follow-up Advice</Label>
              <Textarea id="followUpAdvise" value={followUpAdvise} onChange={(e) => setFollowUpAdvise(e.target.value)} />
            </div>
            {error && <p className="mt-4 text-red-500">{error}</p>}
            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Care Plan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
