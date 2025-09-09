import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const uploadSchema = z.object({
    patientId: z.string().uuid(),
    name: z.string().min(1, 'Report name is required'),
});

const s3Client = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
    },
});

async function uploadToS3(file: File, fileName: string): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());

    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `reports/${fileName}`,
        Body: buffer,
        ContentType: file.type,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/reports/${fileName}`;
}

async function uploadToLocal(file: File, fileName: string): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), 'public/uploads/reports');

    // Ensure the upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    return `/uploads/reports/${fileName}`;
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'DOCTOR') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const patientId = formData.get('patientId') as string;
        const name = formData.get('name') as string;

        if (!file) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 });
        }

        const validation = uploadSchema.safeParse({ patientId, name });
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid data', details: validation.error.flatten() }, { status: 400 });
        }

        const fileName = `${Date.now()}-${file.name}`;
        let fileUrl: string;

        if (process.env.AWS_S3_BUCKET_NAME && process.env.AWS_S3_REGION && process.env.AWS_S3_ACCESS_KEY_ID && process.env.AWS_S3_SECRET_ACCESS_KEY) {
            fileUrl = await uploadToS3(file, fileName);
        } else {
            console.log('S3 credentials not found, falling back to local upload.');
            fileUrl = await uploadToLocal(file, fileName);
        }

        const report = await prisma.report.create({
            data: {
                patientId,
                name,
                url: fileUrl,
            },
        });

        return NextResponse.json({ message: 'Report uploaded successfully', report }, { status: 201 });
    } catch (error) {
        console.error('Failed to upload report:', error);
        return NextResponse.json({ error: 'Failed to upload report' }, { status: 500 });
    }
}
