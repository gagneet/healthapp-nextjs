'use client';

import React, { useState } from 'react';
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface SideEffect {
  symptom: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  description?: string;
  startedAt?: string;
}

interface SideEffectReporterProps {
  medicationLogId: string;
  medicationName: string;
  onClose: () => void;
  onSubmit: () => void;
}

export function SideEffectReporter({
  medicationLogId,
  medicationName,
  onClose,
  onSubmit
}: SideEffectReporterProps) {
  const [sideEffects, setSideEffects] = useState<SideEffect[]>([{
    symptom: '',
    severity: 'MILD',
    description: ''
  }]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const commonSymptoms = [
    'Nausea',
    'Dizziness',
    'Headache',
    'Drowsiness',
    'Upset stomach',
    'Diarrhea',
    'Constipation',
    'Dry mouth',
    'Rash',
    'Fatigue',
    'Insomnia',
    'Anxiety',
    'Other'
  ];

  const addSideEffect = () => {
    setSideEffects([...sideEffects, { symptom: '', severity: 'MILD', description: '' }]);
  };

  const removeSideEffect = (index: number) => {
    if (sideEffects.length > 1) {
      setSideEffects(sideEffects.filter((_, i) => i !== index));
    }
  };

  const updateSideEffect = (index: number, field: keyof SideEffect, value: string) => {
    const updated = [...sideEffects];
    updated[index] = { ...updated[index], [field]: value };
    setSideEffects(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validSideEffects = sideEffects.filter(se => se.symptom.trim() !== '');
    if (validSideEffects.length === 0) {
      setError('Please add at least one side effect');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/patient/medications/side-effects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicationLogId,
          sideEffects: validSideEffects.map(se => ({
            ...se,
            startedAt: se.startedAt || new Date().toISOString()
          })),
          notes
        })
      });

      const result = await response.json();

      if (!response.ok || !result.status) {
        throw new Error(result.payload?.message || 'Failed to report side effects');
      }

      setSuccess(true);
      setTimeout(() => {
        onSubmit();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to report side effects');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'MILD':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'MODERATE':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'SEVERE':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Side Effects Reported
          </h3>
          <p className="text-gray-600">
            Your healthcare provider will be notified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Report Side Effects
            </h2>
            <p className="text-sm text-gray-500 mt-1">{medicationName}</p>
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
            {sideEffects.map((sideEffect, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    Side Effect #{index + 1}
                  </h3>
                  {sideEffects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSideEffect(index)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Symptom */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Symptom *
                    </label>
                    <select
                      value={sideEffect.symptom}
                      onChange={(e) => updateSideEffect(index, 'symptom', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a symptom</option>
                      {commonSymptoms.map(symptom => (
                        <option key={symptom} value={symptom}>{symptom}</option>
                      ))}
                    </select>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severity *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['MILD', 'MODERATE', 'SEVERE'] as const).map(severity => (
                        <button
                          key={severity}
                          type="button"
                          onClick={() => updateSideEffect(index, 'severity', severity)}
                          className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                            sideEffect.severity === severity
                              ? getSeverityColor(severity)
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {severity}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      value={sideEffect.description || ''}
                      onChange={(e) => updateSideEffect(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe what you're experiencing..."
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addSideEffect}
              className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              + Add Another Side Effect
            </button>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any other information your doctor should know..."
              />
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
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Reporting...' : 'Report Side Effects'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SideEffectReporter;
