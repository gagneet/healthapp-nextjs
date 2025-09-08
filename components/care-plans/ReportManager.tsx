'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

export function ReportManager({ carePlan }: { carePlan: any }) {
  const [reports, setReports] = useState(carePlan.reports || []);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', carePlan.patientId);
    formData.append('carePlanId', carePlan.id);

    const promise = fetch('/api/reports', {
      method: 'POST',
      body: formData,
    }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.payload?.error?.message || 'Failed to upload report');
        }
        return data.payload;
    });

    toast.promise(promise, {
        loading: 'Uploading report...',
        success: (data) => {
            setReports((prev: any) => [...prev, data]);
            setFile(null);
            setIsLoading(false);
            return 'Report uploaded successfully!';
        },
        error: (err) => {
            setIsLoading(false);
            return err.message;
        },
    });
  };

  return (
    <div>
      <h3 className="text-lg font-medium">Reports</h3>
      <ul className="mt-4 space-y-2">
        {reports.map((report: any) => (
          <li key={report.id} className="flex justify-between items-center p-2 border rounded-md">
            <a href={report.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              {report.name}
            </a>
          </li>
        ))}
      </ul>

      <form onSubmit={handleUpload} className="mt-6 border-t pt-4">
        <h4 className="font-medium">Upload New Report</h4>
        <div className="space-y-2 mt-2">
            <Label htmlFor="file">Report File</Label>
            <Input id="file" type="file" onChange={handleFileChange} />
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={isLoading || !file}>
            {isLoading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </form>
    </div>
  );
}
