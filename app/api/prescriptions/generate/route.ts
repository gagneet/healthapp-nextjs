import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { z } from 'zod';

const generatePdfSchema = z.object({
    patientId: z.string().uuid(),
});

// Extend the jsPDF interface to include autoTable
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDF;
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'DOCTOR') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = generatePdfSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { patientId } = validation.data;

    try {
        // 1. Fetch all necessary data
        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
            include: {
                user: true,
                medications: { include: { medicine: true } },
                carePlans: {
                    include: {
                        carePlanToDietPlans: { include: { dietPlan: true } },
                        carePlanToWorkoutPlans: { include: { workoutPlan: true } },
                    },
                },
                vitalReadings: { include: { vitalType: true }, orderBy: { readingTime: 'desc' }, take: 20 },
                symptoms: { orderBy: { recordedAt: 'desc' }, take: 10 },
            },
        });

        if (!patient) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        const doc = new jsPDF() as jsPDFWithAutoTable;

        // --- PDF Header ---
        doc.setFontSize(20);
        doc.text('Prescription and Health Summary', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });

        // --- Patient Details ---
        doc.setFontSize(16);
        doc.text('Patient Information', 14, 45);
        doc.setFontSize(10);
        const patientDetails = [
            ['Name', `${patient.user.firstName} ${patient.user.lastName}`],
            ['Email', patient.user.email],
            ['Phone', patient.user.phone || 'N/A'],
            ['Date of Birth', patient.user.dateOfBirth ? new Date(patient.user.dateOfBirth).toLocaleDateString() : 'N/A'],
            ['Gender', patient.user.gender || 'N/A'],
            ['Medical Record No.', patient.medicalRecordNumber || 'N/A'],
        ];
        doc.autoTable({
            startY: 50,
            body: patientDetails,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [22, 160, 133] },
        });

        let lastY = (doc as any).lastAutoTable.finalY + 15;

        // --- Medications ---
        if (patient.medications.length > 0) {
            doc.setFontSize(16);
            doc.text('Medications', 14, lastY);
            const medicationData = patient.medications.map(med => [
                med.medicine.name,
                med.description || 'N/A',
                med.startDate ? new Date(med.startDate).toLocaleDateString() : 'N/A',
                med.endDate ? new Date(med.endDate).toLocaleDateString() : 'Ongoing',
            ]);
            doc.autoTable({
                startY: lastY + 5,
                head: [['Name', 'Dosage/Frequency', 'Start Date', 'End Date']],
                body: medicationData,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] },
            });
            lastY = (doc as any).lastAutoTable.finalY + 15;
        }

        // --- Diet Plans ---
        const dietPlans = patient.carePlans.flatMap(cp => cp.carePlanToDietPlans.map(d => d.dietPlan));
        if (dietPlans.length > 0) {
            doc.setFontSize(16);
            doc.text('Diet Plans', 14, lastY);
            const dietData = dietPlans.map(plan => [
                plan.name,
                plan.description || 'N/A',
                `${plan.totalCalories || 'N/A'} kcal`,
            ]);
            doc.autoTable({
                startY: lastY + 5,
                head: [['Plan Name', 'Description', 'Total Calories']],
                body: dietData,
                theme: 'striped',
                headStyles: { fillColor: [22, 160, 133] },
            });
            lastY = (doc as any).lastAutoTable.finalY + 15;
        }

        // --- Workout Plans ---
        const workoutPlans = patient.carePlans.flatMap(cp => cp.carePlanToWorkoutPlans.map(w => w.workoutPlan));
        if (workoutPlans.length > 0) {
            doc.setFontSize(16);
            doc.text('Workout Plans', 14, lastY);
            const workoutData = workoutPlans.map(plan => [
                plan.name,
                plan.description || 'N/A',
                `${plan.caloriesBurned || 'N/A'} kcal`,
            ]);
            doc.autoTable({
                startY: lastY + 5,
                head: [['Plan Name', 'Description', 'Calories Burned']],
                body: workoutData,
                theme: 'striped',
                headStyles: { fillColor: [243, 156, 18] },
            });
            lastY = (doc as any).lastAutoTable.finalY + 15;
        }

        // --- Vitals History ---
        if (patient.vitalReadings.length > 0) {
            doc.setFontSize(16);
            doc.text('Recent Vitals History', 14, lastY);
            const vitalsData = patient.vitalReadings.map(v => [
                v.vitalType.name,
                `${v.value} ${v.unit}`,
                new Date(v.readingTime).toLocaleString(),
            ]);
            doc.autoTable({
                startY: lastY + 5,
                head: [['Vital', 'Value', 'Reading Time']],
                body: vitalsData,
                theme: 'striped',
                headStyles: { fillColor: [142, 68, 173] },
            });
            lastY = (doc as any).lastAutoTable.finalY + 15;
        }

        // --- Symptoms ---
        if (patient.symptoms.length > 0) {
            doc.setFontSize(16);
            doc.text('Recent Symptoms', 14, lastY);
            const symptomsData = patient.symptoms.map(s => [
                s.symptomName,
                s.severity || 'N/A',
                s.description || 'N/A',
                s.recordedAt ? new Date(s.recordedAt).toLocaleString() : 'N/A',
            ]);
            doc.autoTable({
                startY: lastY + 5,
                head: [['Symptom', 'Severity (1-10)', 'Description', 'Recorded At']],
                body: symptomsData,
                theme: 'striped',
                headStyles: { fillColor: [192, 57, 43] },
            });
            lastY = (doc as any).lastAutoTable.finalY + 15;
        }

        // --- Footer ---
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);
        }

        const pdfOutput = doc.output('arraybuffer');

        return new NextResponse(pdfOutput, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="prescription-${patientId}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Failed to generate PDF:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
