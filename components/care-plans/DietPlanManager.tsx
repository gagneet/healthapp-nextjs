'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export function DietPlanManager({ carePlan }: { carePlan: any }) {
  const [associatedPlans, setAssociatedPlans] = useState(carePlan.diets);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchDietPlans = async () => {
      setIsFetching(true);
      try {
        const response = await fetch('/api/diet-plans');
        if (!response.ok) {
          throw new Error('Failed to fetch diet plans');
        }
        const data = await response.json();
        setAvailablePlans(data.payload);
      } catch (error) {
        toast.error('Could not fetch diet plans.');
      } finally {
        setIsFetching(false);
      }
    };
    fetchDietPlans();
  }, []);

  const handleAddDietPlan = async () => {
    if (!selectedPlan) return;
    setIsLoading(true);

    const promise = fetch(`/api/care-plans/${carePlan.id}/diet-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dietPlanId: selectedPlan }),
    }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.payload?.error?.message || 'Failed to add diet plan');
        }
        return data.payload;
    });

    toast.promise(promise, {
        loading: 'Adding diet plan...',
        success: (data) => {
            const planDetails = availablePlans.find(p => p.id === data.dietPlanId);
            setAssociatedPlans((prev: any) => [...prev, { dietPlan: planDetails }]);
            setSelectedPlan(null);
            setIsLoading(false);
            return 'Diet plan added successfully!';
        },
        error: (err) => {
            setIsLoading(false);
            return err.message;
        },
    });
  };

  const handleRemoveDietPlan = async (dietPlanId: string) => {
      if(!confirm('Are you sure you want to remove this diet plan?')) return;

      const promise = fetch(`/api/care-plans/${carePlan.id}/diet-plans/${dietPlanId}`, {
          method: 'DELETE',
      }).then(res => {
          if (res.status !== 204) {
              return res.json().then(data => Promise.reject(data));
          }
          return res;
      });

      toast.promise(promise, {
          loading: 'Removing diet plan...',
          success: () => {
              setAssociatedPlans((prev: any) => prev.filter((p: any) => p.dietPlan.id !== dietPlanId));
              return 'Diet plan removed successfully!';
          },
          error: (err) => {
              return err.payload?.error?.message || 'Failed to remove diet plan';
          }
      });
  }

  if (isFetching) {
      return <p>Loading diet plans...</p>;
  }

  return (
    <div>
      <h3 className="text-lg font-medium">Diet Plans</h3>
      <ul className="mt-4 space-y-2">
        {associatedPlans.map((plan: any) => (
          <li key={plan.dietPlan.id} className="flex justify-between items-center p-2 border rounded-md">
            <p className="font-semibold">{plan.dietPlan.name}</p>
            <Button size="sm" variant="destructive" onClick={() => handleRemoveDietPlan(plan.dietPlan.id)}>Remove</Button>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t pt-4">
        <h4 className="font-medium">Add New Diet Plan</h4>
        <div className="mt-2 space-y-2">
          {availablePlans.map((plan) => (
            <div key={plan.id} className={`p-2 border rounded-md cursor-pointer ${selectedPlan === plan.id ? 'bg-blue-100 border-blue-500' : ''}`} onClick={() => setSelectedPlan(plan.id)}>
                <p className="font-semibold">{plan.name}</p>
                <p className="text-sm text-gray-500">{plan.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleAddDietPlan} disabled={isLoading || !selectedPlan}>
            {isLoading ? 'Adding...' : 'Add Selected Plan'}
          </Button>
        </div>
      </div>
    </div>
  );
}
