import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

export async function GET(request: Request, context: { params: Promise<{ filename: string }> }) {
    const params = await context.params;
    const { filename } = params;
    const filePath = path.join(process.cwd(), 'uploads', filename);

    if (!existsSync(filePath)) {
        return new NextResponse('Not found', { status: 404 });
    }

    const buffer = readFileSync(filePath);

    return new NextResponse(buffer, {
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `inline; filename="${filename}"`,
        },
    });
}
