'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export function WorkoutPlanManager({ carePlan }: { carePlan: any }) {
  const [associatedPlans, setAssociatedPlans] = useState(carePlan.workouts);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchWorkoutPlans = async () => {
      setIsFetching(true);
      try {
        const response = await fetch('/api/workout-plans');
        if (!response.ok) {
          throw new Error('Failed to fetch workout plans');
        }
        const data = await response.json();
        setAvailablePlans(data.payload);
      } catch (error) {
        toast.error('Could not fetch workout plans.');
      } finally {
        setIsFetching(false);
      }
    };
    fetchWorkoutPlans();
  }, []);

  const handleAddWorkoutPlan = async () => {
    if (!selectedPlan) return;
    setIsLoading(true);

    const promise = fetch(`/api/care-plans/${carePlan.id}/workout-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workoutPlanId: selectedPlan }),
    }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.payload?.error?.message || 'Failed to add workout plan');
        }
        return data.payload;
    });

    toast.promise(promise, {
        loading: 'Adding workout plan...',
        success: (data) => {
            const planDetails = availablePlans.find(p => p.id === data.workoutPlanId);
            setAssociatedPlans((prev: any) => [...prev, { workoutPlan: planDetails }]);
            setSelectedPlan(null);
            setIsLoading(false);
            return 'Workout plan added successfully!';
        },
        error: (err) => {
            setIsLoading(false);
            return err.message;
        },
    });
  };

  if (isFetching) {
      return <p>Loading workout plans...</p>;
  }

  return (
    <div>
      <h3 className="text-lg font-medium">Workout Plans</h3>
      <ul className="mt-4 space-y-2">
        {associatedPlans.map((plan: any) => (
          <li key={plan.workoutPlan.id} className="flex justify-between items-center p-2 border rounded-md">
            <p className="font-semibold">{plan.workoutPlan.name}</p>
            {/* Add remove button here */}
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t pt-4">
        <h4 className="font-medium">Add New Workout Plan</h4>
        <div className="mt-2 space-y-2">
          {availablePlans.map((plan) => (
            <div key={plan.id} className={`p-2 border rounded-md cursor-pointer ${selectedPlan === plan.id ? 'bg-blue-100 border-blue-500' : ''}`} onClick={() => setSelectedPlan(plan.id)}>
                <p className="font-semibold">{plan.name}</p>
                <p className="text-sm text-gray-500">{plan.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleAddWorkoutPlan} disabled={isLoading || !selectedPlan}>
            {isLoading ? 'Adding...' : 'Add Selected Plan'}
          </Button>
        </div>
      </div>
    </div>
  );
}
