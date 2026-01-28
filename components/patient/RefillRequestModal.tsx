'use client';

import React, { useState } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface RefillRequestModalProps {
  carePlanMedicationId?: string;
  medicationName: string;
  currentDosage?: string;
  onClose: () => void;
  onSubmit: () => void;
}

export function RefillRequestModal({
  carePlanMedicationId,
  medicationName,
  currentDosage,
  onClose,
  onSubmit
}: RefillRequestModalProps) {
  const [quantity, setQuantity] = useState<number>(30);
  const [reason, setReason] = useState('');
  const [urgency, setUrgency] = useState<'NORMAL' | 'URGENT' | 'EMERGENCY'>('NORMAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/patient/medications/refill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          carePlanMedicationId,
          medicineName: medicationName,
          quantity,
          reason: reason || undefined,
          urgency
        })
      });

      const result = await response.json();

      if (!response.ok || !result.status) {
        throw new Error(result.payload?.message || 'Failed to submit refill request');
      }

      setSuccess(true);
      setTimeout(() => {
        onSubmit();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit refill request');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Refill Request Submitted
          </h3>
          <p className="text-gray-600">
            Your doctor will review your request and respond soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Request Medication Refill
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {medicationName}
              {currentDosage && ` - ${currentDosage}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Quantity */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity (number of doses) *
              </label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                min="1"
                max="90"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Typically 30 days supply
              </p>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How soon do you need this? *
              </label>
              <div className="space-y-2">
                <label className="flex items-start p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="urgency"
                    value="NORMAL"
                    checked={urgency === 'NORMAL'}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Normal (5-7 days)
                    </div>
                    <div className="text-xs text-gray-500">
                      I have enough medication for at least a week
                    </div>
                  </div>
                </label>

                <label className="flex items-start p-3 border border-orange-300 rounded-md cursor-pointer hover:bg-orange-50 transition-colors">
                  <input
                    type="radio"
                    name="urgency"
                    value="URGENT"
                    checked={urgency === 'URGENT'}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="text-sm font-medium text-orange-900">
                      Urgent (2-3 days)
                    </div>
                    <div className="text-xs text-orange-700">
                      I'm running low and need it soon
                    </div>
                  </div>
                </label>

                <label className="flex items-start p-3 border border-red-300 rounded-md cursor-pointer hover:bg-red-50 transition-colors">
                  <input
                    type="radio"
                    name="urgency"
                    value="EMERGENCY"
                    checked={urgency === 'EMERGENCY'}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="text-sm font-medium text-red-900">
                      Emergency (same day)
                    </div>
                    <div className="text-xs text-red-700">
                      I'm out of medication and need it today
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason (optional)
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Let your doctor know why you need this refill (e.g., lost medication, going on a trip, etc.)"
              />
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                What happens next?
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Your doctor will review your request</li>
                <li>• You'll receive a notification once it's approved</li>
                <li>• If approved, your pharmacy will be notified</li>
                <li>• You can pick up your medication from your pharmacy</li>
              </ul>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RefillRequestModal;
