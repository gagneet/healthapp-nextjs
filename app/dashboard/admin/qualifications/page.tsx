'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { QualificationChangeRequest } from '@/types/dashboard';
import toast from 'react-hot-toast';

export default function QualificationRequestsPage() {
  const [requests, setRequests] = useState<QualificationChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, requestId: '' });

  useEffect(() => {
    fetchQualificationRequests();
  }, []);

  const fetchQualificationRequests = async () => {
    setIsLoading(true);
    // Mock API call
    const mockRequests: QualificationChangeRequest[] = [
      {
        id: 'change1',
        doctorId: 'doc1',
        requesterId: 'doc1',
        changeType: 'add',
        status: 'pending',
        requestedAt: new Date().toISOString(),
        changes: {
          degree: 'PhD in Neuroscience',
          institution: 'Brain University',
          year: '2023',
          type: 'degree',
        },
      },
      {
        id: 'change2',
        doctorId: 'doc1',
        requesterId: 'doc1',
        qualificationId: 'qual2',
        changeType: 'edit',
        status: 'pending',
        requestedAt: new Date().toISOString(),
        changes: {
          year: '2020',
        },
      },
      {
        id: 'change3',
        doctorId: 'doc1',
        requesterId: 'doc1',
        qualificationId: 'qual3',
        changeType: 'delete',
        status: 'pending',
        requestedAt: new Date().toISOString(),
        changes: {},
      },
    ];
    setRequests(mockRequests);
    setIsLoading(false);
  };

  const handleApprove = async (requestId: string) => {
    // Mock API call
    console.log('Approving request:', requestId);
    toast.success('Request approved.');
    setRequests(requests.filter(r => r.id !== requestId));
  };

  const handleReject = (requestId: string) => {
    setRejectionModal({ isOpen: true, requestId });
  };

  const RejectionModal = ({ isOpen, onClose, onSubmit }) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
      if (!reason) {
        toast.error('Please provide a reason for rejection.');
        return;
      }
      onSubmit(reason);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
          <h3 className="text-lg font-medium mb-4">Reject Qualification Request</h3>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={4}
            placeholder="Enter rejection reason..."
          />
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RejectionModal
        isOpen={rejectionModal.isOpen}
        onClose={() => setRejectionModal({ isOpen: false, requestId: '' })}
        onSubmit={(reason) => {
          console.log('Rejecting request:', rejectionModal.requestId, 'with reason:', reason);
          toast.error('Request rejected.');
          setRequests(requests.filter(r => r.id !== rejectionModal.requestId));
          setRejectionModal({ isOpen: false, requestId: '' });
        }}
      />

      <h1 className="text-2xl font-bold text-gray-900">Qualification Approval</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClockIcon className="h-5 w-5 mr-2" />
            Pending Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Changes</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.doctorId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.changeType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <ul>
                        {Object.entries(request.changes).map(([key, value]) => (
                          <li key={key}>
                            <span className="font-semibold">{key}:</span> {String(value)}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(request.requestedAt).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="text-red-600 hover:text-red-900 ml-4"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
