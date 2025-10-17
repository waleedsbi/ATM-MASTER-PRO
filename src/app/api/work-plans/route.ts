import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const workPlans = await prisma.workPlan.findMany({
      orderBy: {
        startDate: 'desc',
      },
    });
    return NextResponse.json(workPlans);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching work plans' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('=== POST /api/work-plans called ===');
  try {
    console.log('Checking database connection...');
    // Test database connection
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json({ 
        error: 'فشل الاتصال بقاعدة البيانات',
        details: dbError instanceof Error ? dbError.message : 'خطأ غير معروف'
      }, { status: 500 });
    }

    let body;
    try {
      const rawBody = await request.text();
      console.log('Raw request body:', rawBody);
      
      body = JSON.parse(rawBody);
      console.log('Parsed request body:', body);
    } catch (e) {
      console.error('Invalid request body:', e);
      return NextResponse.json({ 
        error: 'صيغة البيانات غير صحيحة',
        details: e instanceof Error ? e.message : 'خطأ في تحليل JSON'
      }, { status: 400 });
    }
    
    // Validate required fields
    const requiredFields = ['bankName', 'startDate', 'endDate', 'governorate', 'city', 'statement', 'representativeId', 'dates', 'atmCodes'];
    console.log('Checking required fields...');
    for (const field of requiredFields) {
      if (!body[field]) {
        console.error(`Missing required field: ${field}`, { value: body[field], bodyKeys: Object.keys(body) });
        return NextResponse.json({ 
          error: `حقل ${field} مطلوب`,
          missingField: field,
          receivedFields: Object.keys(body)
        }, { status: 400 });
      }
    }
    console.log('All required fields present');

    // Parse and validate dates
    const parsedStartDate = new Date(body.startDate + 'T00:00:00Z');
    const parsedEndDate = new Date(body.endDate + 'T00:00:00Z');

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      console.error('Invalid dates:', { startDate: body.startDate, endDate: body.endDate });
      return NextResponse.json({
        error: 'تواريخ غير صالحة'
      }, { status: 400 });
    }

    if (parsedStartDate > parsedEndDate) {
      console.error('Start date is after end date');
      return NextResponse.json({
        error: 'تاريخ البداية يجب أن يكون قبل تاريخ الانتهاء'
      }, { status: 400 });
    }

    // Validate ATM codes
    console.log('Validating ATM codes:', { atmCodes: body.atmCodes, isArray: Array.isArray(body.atmCodes), length: body.atmCodes?.length });
    if (!Array.isArray(body.atmCodes) || body.atmCodes.length === 0) {
      console.error('No ATM codes provided');
      return NextResponse.json({
        error: 'يجب اختيار ماكينة واحدة على الأقل',
        receivedAtmCodes: body.atmCodes
      }, { status: 400 });
    }

    // Validate dates array
    console.log('Validating dates:', { dates: body.dates, isArray: Array.isArray(body.dates), length: body.dates?.length });
    if (!Array.isArray(body.dates) || body.dates.length === 0) {
      console.error('No dates provided');
      return NextResponse.json({
        error: 'يجب اختيار تاريخ واحد على الأقل',
        receivedDates: body.dates
      }, { status: 400 });
    }

    // التأكد من صحة المندوب
    console.log('Checking representative:', body.representativeId);
    let representative;
    try {
      representative = await prisma.representative.findUnique({
        where: { id: parseInt(body.representativeId) }
      });
      console.log('Representative found:', representative ? 'Yes' : 'No', representative?.id);
    } catch (error) {
      console.error('Error finding representative:', error);
      return NextResponse.json({ 
        error: 'خطأ في البحث عن المندوب',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
    
    if (!representative) {
      console.error('Representative not found:', body.representativeId);
      return NextResponse.json({ 
        error: `المندوب غير موجود (ID: ${body.representativeId})`,
        hint: 'تأكد من اختيار مندوب من القائمة'
      }, { status: 400 });
    }

    // التحقق من وجود ATMs
    console.log('Checking ATMs:', body.atmCodes);
    for (const atmCode of body.atmCodes) {
      try {
        const atm = await prisma.aTM.findFirst({
          where: { atmCode: atmCode }
        });
        console.log(`ATM ${atmCode}:`, atm ? 'Found' : 'Not found');
        if (!atm) {
          console.error('ATM not found:', atmCode);
          return NextResponse.json({ 
            error: `الماكينة غير موجودة: ${atmCode}`,
            hint: 'تأكد من اختيار ماكينات من الجدول'
          }, { status: 400 });
        }
      } catch (error) {
        console.error('Error checking ATM:', atmCode, error);
        return NextResponse.json({ 
          error: `خطأ في التحقق من الماكينة: ${atmCode}`,
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    console.log('Creating work plan with validated data:', {
      ...body,
      startDate: parsedStartDate,
      endDate: parsedEndDate
    });

    try {
      const workPlanData = {
        bankName: body.bankName,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        governorate: body.governorate,
        city: body.city,
        statement: body.statement,
        representativeId: parseInt(body.representativeId),
        dates: JSON.stringify(body.dates),         // Convert array to JSON string
        atmCodes: JSON.stringify(body.atmCodes),   // Convert array to JSON string
        status: 'pending'
      };

      console.log('Creating work plan with data:', workPlanData);

      const workPlan = await prisma.workPlan.create({
        data: workPlanData
      });

      console.log('Work plan created successfully:', workPlan);
      return NextResponse.json(workPlan);

    } catch (error) {
      console.error('Prisma error:', error);
      return NextResponse.json({ 
        error: 'حدث خطأ أثناء حفظ خطة العمل',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating work plan:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Check for specific Prisma errors
    if (error instanceof Error) {
      console.log('Error type:', error.constructor.name);
      console.log('Error message:', error.message);
      
      if (error.message.includes('Representative')) {
        return NextResponse.json({
          error: 'المندوب غير موجود',
          details: error.message
        }, { status: 400 });
      }
      
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({
          error: 'خطة العمل موجودة بالفعل',
          details: error.message
        }, { status: 409 });
      }

      if (error.message.includes('Invalid') || error.message.includes('Validation')) {
        return NextResponse.json({
          error: 'بيانات غير صالحة',
          details: error.message
        }, { status: 400 });
      }
    }

    // If we reach here, it's an unexpected error
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء إنشاء خطة العمل',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
      errorType: error instanceof Error ? error.constructor.name : typeof error
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  console.log('=== PUT /api/work-plans called ===');
  try {
    console.log('Checking database connection...');
    // Test database connection
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json({ 
        error: 'فشل الاتصال بقاعدة البيانات',
        details: dbError instanceof Error ? dbError.message : 'خطأ غير معروف'
      }, { status: 500 });
    }

    let body;
    try {
      const rawBody = await request.text();
      console.log('Raw request body:', rawBody);
      
      body = JSON.parse(rawBody);
      console.log('Parsed request body:', body);
    } catch (e) {
      console.error('Invalid request body:', e);
      return NextResponse.json({ 
        error: 'صيغة البيانات غير صحيحة',
        details: e instanceof Error ? e.message : 'خطأ في تحليل JSON'
      }, { status: 400 });
    }

    // Check for work plan ID
    if (!body.id) {
      return NextResponse.json({ 
        error: 'معرّف خطة العمل مطلوب',
      }, { status: 400 });
    }
    
    // Check what kind of update this is
    console.log('Body keys:', Object.keys(body), 'Count:', Object.keys(body).length);
    console.log('Body content:', body);
    
    // Partial update (status, images, or notes only)
    if (Object.keys(body).length <= 6 && !body.bankName) { // Not a full update
      console.log('Partial update detected');
      
      try {
        // Verify work plan exists first
        const existingPlan = await prisma.workPlan.findUnique({
          where: { id: body.id }
        });
        
        if (!existingPlan) {
          console.error('Work plan not found:', body.id);
          return NextResponse.json({ 
            error: 'خطة العمل غير موجودة',
          }, { status: 404 });
        }
        
        console.log('Found existing plan:', existingPlan.id);
        
        // Build update data dynamically
        const updateData: any = {};
        
        // Handle ATM-specific updates (status, images, or notes for a specific ATM)
        if (body.atmCode && (body.status !== undefined || body.beforeImages !== undefined || body.afterImages !== undefined || body.notes !== undefined)) {
          console.log('Updating ATM-specific data for:', body.atmCode);
          
          // Parse existing atmReports
          let atmReports: any = {};
          try {
            atmReports = JSON.parse(existingPlan.atmReports || '{}');
          } catch (e) {
            console.error('Error parsing atmReports:', e);
          }
          
          // Initialize ATM report if it doesn't exist
          if (!atmReports[body.atmCode]) {
            atmReports[body.atmCode] = {
              beforeImages: [],
              afterImages: [],
              notes: [],
              status: 'pending'
            };
          }
          
          // Update the specific ATM's data
          if (body.status !== undefined) {
            atmReports[body.atmCode].status = body.status;
            console.log('Updating status for ATM:', body.atmCode, 'to:', body.status);
          }
          
          if (body.beforeImages !== undefined) {
            atmReports[body.atmCode].beforeImages = body.beforeImages;
            console.log('Updating beforeImages for ATM:', body.atmCode, 'count:', body.beforeImages.length);
          }
          
          if (body.afterImages !== undefined) {
            atmReports[body.atmCode].afterImages = body.afterImages;
            console.log('Updating afterImages for ATM:', body.atmCode, 'count:', body.afterImages.length);
          }
          
          if (body.notes !== undefined) {
            atmReports[body.atmCode].notes = body.notes;
            console.log('Updating notes for ATM:', body.atmCode, 'count:', body.notes.length);
          }
          
          updateData.atmReports = JSON.stringify(atmReports);
        }
        // Legacy: Update global status if no atmCode provided (for backward compatibility)
        else if (body.status !== undefined && !body.atmCode) {
          updateData.status = body.status;
          console.log('Updating global status to:', body.status);
        }
        
        const workPlan = await prisma.workPlan.update({
          where: { id: body.id },
          data: updateData
        });

        console.log('Work plan updated successfully:', workPlan.id);
        return NextResponse.json(workPlan);
      } catch (error) {
        console.error('Prisma error:', error);
        return NextResponse.json({ 
          error: 'حدث خطأ أثناء تحديث خطة العمل',
          details: error instanceof Error ? error.message : 'خطأ غير معروف'
        }, { status: 500 });
      }
    }
    
    // Full update - validate required fields
    const requiredFields = ['bankName', 'startDate', 'endDate', 'governorate', 'city', 'statement', 'representativeId', 'dates', 'atmCodes'];
    console.log('Checking required fields...');
    for (const field of requiredFields) {
      if (!body[field]) {
        console.error(`Missing required field: ${field}`, { value: body[field], bodyKeys: Object.keys(body) });
        return NextResponse.json({ 
          error: `حقل ${field} مطلوب`,
          missingField: field,
          receivedFields: Object.keys(body)
        }, { status: 400 });
      }
    }
    console.log('All required fields present');

    // Parse and validate dates
    const parsedStartDate = new Date(body.startDate + 'T00:00:00Z');
    const parsedEndDate = new Date(body.endDate + 'T00:00:00Z');

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      console.error('Invalid dates:', { startDate: body.startDate, endDate: body.endDate });
      return NextResponse.json({
        error: 'تواريخ غير صالحة'
      }, { status: 400 });
    }

    if (parsedStartDate > parsedEndDate) {
      console.error('Start date is after end date');
      return NextResponse.json({
        error: 'تاريخ البداية يجب أن يكون قبل تاريخ الانتهاء'
      }, { status: 400 });
    }

    // Validate ATM codes
    console.log('Validating ATM codes:', { atmCodes: body.atmCodes, isArray: Array.isArray(body.atmCodes), length: body.atmCodes?.length });
    if (!Array.isArray(body.atmCodes) || body.atmCodes.length === 0) {
      console.error('No ATM codes provided');
      return NextResponse.json({
        error: 'يجب اختيار ماكينة واحدة على الأقل',
        receivedAtmCodes: body.atmCodes
      }, { status: 400 });
    }

    // Validate dates array
    console.log('Validating dates:', { dates: body.dates, isArray: Array.isArray(body.dates), length: body.dates?.length });
    if (!Array.isArray(body.dates) || body.dates.length === 0) {
      console.error('No dates provided');
      return NextResponse.json({
        error: 'يجب اختيار تاريخ واحد على الأقل',
        receivedDates: body.dates
      }, { status: 400 });
    }

    // التأكد من صحة المندوب
    console.log('Checking representative:', body.representativeId);
    let representative;
    try {
      representative = await prisma.representative.findUnique({
        where: { id: parseInt(body.representativeId) }
      });
      console.log('Representative found:', representative ? 'Yes' : 'No', representative?.id);
    } catch (error) {
      console.error('Error finding representative:', error);
      return NextResponse.json({ 
        error: 'خطأ في البحث عن المندوب',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
    
    if (!representative) {
      console.error('Representative not found:', body.representativeId);
      return NextResponse.json({ 
        error: `المندوب غير موجود (ID: ${body.representativeId})`,
        hint: 'تأكد من اختيار مندوب من القائمة'
      }, { status: 400 });
    }

    // التحقق من وجود ATMs
    console.log('Checking ATMs:', body.atmCodes);
    for (const atmCode of body.atmCodes) {
      try {
        const atm = await prisma.aTM.findFirst({
          where: { atmCode: atmCode }
        });
        console.log(`ATM ${atmCode}:`, atm ? 'Found' : 'Not found');
        if (!atm) {
          console.error('ATM not found:', atmCode);
          return NextResponse.json({ 
            error: `الماكينة غير موجودة: ${atmCode}`,
            hint: 'تأكد من اختيار ماكينات من الجدول'
          }, { status: 400 });
        }
      } catch (error) {
        console.error('Error checking ATM:', atmCode, error);
        return NextResponse.json({ 
          error: `خطأ في التحقق من الماكينة: ${atmCode}`,
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    console.log('Updating work plan with validated data:', {
      ...body,
      startDate: parsedStartDate,
      endDate: parsedEndDate
    });

    try {
      const workPlanData = {
        bankName: body.bankName,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        governorate: body.governorate,
        city: body.city,
        statement: body.statement,
        representativeId: parseInt(body.representativeId),
        dates: JSON.stringify(body.dates),
        atmCodes: JSON.stringify(body.atmCodes),
        status: body.status || 'pending'
      };

      console.log('Updating work plan with data:', workPlanData);

      const workPlan = await prisma.workPlan.update({
        where: { id: body.id },
        data: workPlanData
      });

      console.log('Work plan updated successfully:', workPlan);
      return NextResponse.json(workPlan);

    } catch (error) {
      console.error('Prisma error:', error);
      return NextResponse.json({ 
        error: 'حدث خطأ أثناء تحديث خطة العمل',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating work plan:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء تحديث خطة العمل',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
      errorType: error instanceof Error ? error.constructor.name : typeof error
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  console.log('=== DELETE /api/work-plans called ===');
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      console.error('Missing work plan ID');
      return NextResponse.json({ error: 'معرّف خطة العمل مطلوب' }, { status: 400 });
    }
    
    console.log('Attempting to delete work plan with ID:', id);
    
    // Verify work plan exists
    const existingPlan = await prisma.workPlan.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingPlan) {
      console.error('Work plan not found:', id);
      return NextResponse.json({ error: 'خطة العمل غير موجودة' }, { status: 404 });
    }
    
    console.log('Found work plan, proceeding with deletion...');
    
    await prisma.workPlan.delete({
      where: {
        id: parseInt(id),
      },
    });
    
    console.log('Work plan deleted successfully:', id);
    return NextResponse.json({ message: 'تم حذف خطة العمل بنجاح' });
  } catch (error) {
    console.error('Error deleting work plan:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء حذف خطة العمل',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}