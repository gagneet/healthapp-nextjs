'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MedicationManager } from '@/components/care-plans/MedicationManager';
import { AppointmentManager } from '@/components/care-plans/AppointmentManager';
import { DietPlanManager } from '@/components/care-plans/DietPlanManager';
import { WorkoutPlanManager } from '@/components/care-plans/WorkoutPlanManager';
import { VitalsManager } from '@/components/care-plans/VitalsManager';
import { SymptomManager } from '@/components/care-plans/SymptomManager';
import { PrescriptionManager } from '@/components/care-plans/PrescriptionManager';
import { ReportManager } from '@/components/care-plans/ReportManager';
import ErrorBoundary from '@/components/ErrorBoundary';

// A simple tab component
function Tabs({ tabs, activeTab, setActiveTab }: { tabs: string[], activeTab: string, setActiveTab: (tab: string) => void }) {
    return (
        <div className="border-b">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`${
                            activeTab === tab
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        {tab}
                    </button>
                ))}
            </nav>
        </div>
    );
}

function TabPanel({ children, active, tabName }: { children: React.ReactNode, active: boolean, tabName: string }) {
    return (
        <div role="tabpanel" hidden={!active}>
            {active && (
                <div className="p-4">
                    {children}
                </div>
            )}
        </div>
    )
}


export default function CarePlanManagementPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const carePlanId = params.carePlanId as string;

  const [carePlan, setCarePlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    if (!carePlanId) return;

    const fetchCarePlan = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/care-plans/${carePlanId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch care plan');
        }
        const data = await response.json();
        setCarePlan(data.payload);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarePlan();
  }, [carePlanId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!carePlan) {
      return <div>No care plan found.</div>
  }

  const tabs = ['Overview', 'Medications', 'Appointments', 'Vitals', 'Symptoms', 'Diets', 'Workouts', 'Prescriptions', 'Reports'];

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Manage Care Plan: {carePlan.title}</CardTitle>
          <p className="text-sm text-gray-500">For patient: {carePlan.patient.user.name}</p>
        </CardHeader>
        <CardContent>
          <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
          <div>
            <ErrorBoundary fallback={<p>Something went wrong in this section.</p>}>
                <TabPanel active={activeTab === 'Overview'} tabName="Overview">
                <h2 className="text-lg font-medium">Overview</h2>
                <p>{carePlan.description}</p>
                </TabPanel>
                <TabPanel active={activeTab === 'Medications'} tabName="Medications">
                <MedicationManager carePlan={carePlan} />
                </TabPanel>
                <TabPanel active={activeTab === 'Appointments'} tabName="Appointments">
                <AppointmentManager carePlan={carePlan} />
                </TabPanel>
                <TabPanel active={activeTab === 'Vitals'} tabName="Vitals">
                <VitalsManager carePlan={carePlan} />
                </TabPanel>
                <TabPanel active={activeTab === 'Symptoms'} tabName="Symptoms">
                <SymptomManager carePlan={carePlan} />
                </TabPanel>
                <TabPanel active={activeTab === 'Diets'} tabName="Diets">
                <DietPlanManager carePlan={carePlan} />
                </TabPanel>
                <TabPanel active={activeTab === 'Workouts'} tabName="Workouts">
                <WorkoutPlanManager carePlan={carePlan} />
                </TabPanel>
                <TabPanel active={activeTab === 'Prescriptions'} tabName="Prescriptions">
                <PrescriptionManager patientId={carePlan.patientId} />
                </TabPanel>
                <TabPanel active={activeTab === 'Reports'} tabName="Reports">
                <ReportManager carePlan={carePlan} />
                </TabPanel>
            </ErrorBoundary>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
