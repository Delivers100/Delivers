import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { sql } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    
    if (decoded.accountType !== 'business') {
      return NextResponse.json(
        { error: 'Only sellers can upload documents' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'File and document type are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PDF, JPG, and PNG files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const fileName = `${decoded.userId}_${documentType}_${timestamp}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save to database
    const fileUrl = `/uploads/documents/${fileName}`;
    
    // Check if document already exists for this user and type
    const existingDoc = await sql`
      SELECT id FROM documents 
      WHERE user_id = ${decoded.userId} AND document_type = ${documentType}
    `;

    if (existingDoc.length > 0) {
      // Update existing document
      await sql`
        UPDATE documents 
        SET file_url = ${fileUrl}, file_name = ${file.name}, 
            upload_date = CURRENT_TIMESTAMP, verification_status = 'pending',
            admin_notes = NULL
        WHERE user_id = ${decoded.userId} AND document_type = ${documentType}
      `;
    } else {
      // Insert new document
      await sql`
        INSERT INTO documents (user_id, document_type, file_url, file_name, verification_status)
        VALUES (${decoded.userId}, ${documentType}, ${fileUrl}, ${file.name}, 'pending')
      `;
    }

    return NextResponse.json({
      message: 'Document uploaded successfully',
      fileName: file.name,
      documentType
    });
  } catch (error) {
    console.error('Upload document error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

// Configure Next.js to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};