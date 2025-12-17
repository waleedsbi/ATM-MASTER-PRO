import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const workPlanId = formData.get('workPlanId') as string;
    const atmCode = formData.get('atmCode') as string;
    const imageType = formData.get('imageType') as 'before' | 'after';

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'لم يتم إرفاق أي ملفات' },
        { status: 400 }
      );
    }

    if (!workPlanId || !atmCode || !imageType) {
      return NextResponse.json(
        { error: 'معلومات غير مكتملة: workPlanId, atmCode, imageType مطلوبة' },
        { status: 400 }
      );
    }

    // Create uploads directory structure: public/uploads/work-plans/{workPlanId}/{atmCode}/
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'work-plans', String(workPlanId), String(atmCode));
    
    // Create directory if it doesn't exist
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const uploadedUrls: string[] = [];

    // Process each file
    for (const file of files) {
      if (!(file instanceof File)) continue;

      // Generate unique filename: timestamp-random-originalname
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const extension = originalName.split('.').pop() || 'jpg';
      const filename = `${timestamp}-${random}.${extension}`;
      
      // Determine subdirectory based on imageType
      const subDir = imageType === 'before' ? 'before' : 'after';
      const fileDir = join(uploadsDir, subDir);
      
      if (!existsSync(fileDir)) {
        await mkdir(fileDir, { recursive: true });
      }

      const filePath = join(fileDir, filename);

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      await writeFile(filePath, buffer);

      // Generate URL path (relative to public folder)
      const urlPath = `/uploads/work-plans/${workPlanId}/${atmCode}/${subDir}/${filename}`;
      uploadedUrls.push(urlPath);
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      count: uploadedUrls.length,
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      {
        error: 'حدث خطأ أثناء رفع الملفات',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete uploaded image
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL الصورة مطلوب' },
        { status: 400 }
      );
    }

    // Remove /uploads from the beginning if present
    const relativePath = imageUrl.startsWith('/uploads') 
      ? imageUrl.substring(1) 
      : imageUrl.startsWith('uploads') 
        ? imageUrl 
        : `uploads/${imageUrl}`;

    const filePath = join(process.cwd(), 'public', relativePath);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'الملف غير موجود' },
        { status: 404 }
      );
    }

    // Delete file
    const { unlink } = await import('fs/promises');
    await unlink(filePath);

    return NextResponse.json({
      success: true,
      message: 'تم حذف الصورة بنجاح',
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      {
        error: 'حدث خطأ أثناء حذف الملف',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

