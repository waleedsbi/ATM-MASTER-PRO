import { getPrisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const prisma = getPrisma()
    const { searchParams } = new URL(request.url);
    
    // Get query parameters for optimization
    const includeReports = searchParams.get('includeReports') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100; // Default limit to 100 for performance
    
    // Try using workPlan model, fallback to workPlanHeaders if not available
    if (prisma.workPlan) {
      // Select only necessary fields to reduce data transfer
      // We need atmReports for status, but we'll extract only status fields
      // to avoid loading large base64 images
      // Only select atmReports if we need it (for status or images)
      // This reduces data transfer significantly
      const selectFields: any = {
        id: true,
        bankName: true,
        startDate: true,
        endDate: true,
        governorate: true,
        city: true,
        statement: true,
        representativeId: true,
        dates: true,
        atmCodes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      };
      
      // Only include atmReports if we need status or images
      // This can significantly reduce data transfer for large JSON fields
      if (includeReports) {
        selectFields.atmReports = true;
      } else {
        // For status-only, we still need atmReports but will process it
        // However, we can optimize by only fetching it if the plan has status data
        selectFields.atmReports = true; // Still needed for status extraction
      }
      
      const queryOptions: any = {
        select: selectFields,
        orderBy: {
          startDate: 'desc',
        },
        take: limit, // Always apply limit for performance
      };
      
      const workPlans = await prisma.workPlan.findMany(queryOptions);
      
      // Process atmReports to extract only status (not images) for performance
      // This allows us to show correct status without loading large base64 images
      const processedPlans = workPlans.map((plan) => {
        if (!plan.atmReports) {
          return plan;
        }
        
        try {
          const atmReports = JSON.parse(plan.atmReports);
          // Extract only status from each ATM report, exclude images
          const statusOnlyReports: Record<string, any> = {};
            Object.keys(atmReports).forEach((atmCode: string) => {
              const atmData = atmReports[atmCode] as any;
              const atmStatus = atmData?.status || 'pending';
              const isAccepted = atmStatus === 'completed';
              
              // Always include images for accepted visits, or if explicitly requested
              const shouldIncludeImages = includeReports || isAccepted;
              
              statusOnlyReports[atmCode] = {
                status: atmStatus,
                // Include images for accepted visits or if explicitly requested
                beforeImages: shouldIncludeImages ? (atmData?.beforeImages || []) : [],
                afterImages: shouldIncludeImages ? (atmData?.afterImages || []) : [],
                notes: shouldIncludeImages ? (atmData?.notes || []) : [],
              };
            });
          
          return {
            ...plan,
            atmReports: JSON.stringify(statusOnlyReports),
          };
        } catch (e) {
          console.error('Error processing atmReports:', e);
          return plan;
        }
      });
      
      return NextResponse.json(processedPlans);
    } else if (prisma.workPlanHeaders) {
      // Fallback: use WorkPlanHeaders and transform
      const workPlanHeaders = await prisma.workPlanHeaders.findMany({
        where: {
          IsDeleted: false,
          IsNotActive: false,
        },
        orderBy: {
          StartDate: 'desc',
        },
        include: {
          BankCode: true,
          CityCode: true,
          GovernorateCode: true,
        },
      });
      
      // Transform to match expected format
      const workPlans = workPlanHeaders.map(header => ({
        id: header.WorkPlanId,
        bankName: header.BankCode?.BanknameL1 || header.BankCode?.BanknameL2 || 'غير محدد',
        startDate: header.StartDate?.toISOString().split('T')[0] || '',
        endDate: header.EndDate?.toISOString().split('T')[0] || '',
        governorate: header.GovernorateCode?.GovernorateNameL1 || 'غير محدد',
        city: header.CityCode?.CityNameL1 || 'غير محدد',
        statement: header.Description || '',
        representativeId: 0, // Will need to be mapped from AspNetUsersId
        dates: '[]',
        atmCodes: '[]',
        status: 'pending',
        createdAt: header.CreateDateTime?.toISOString() || '',
        updatedAt: header.ModifiedDate?.toISOString() || '',
      }));
      
      return NextResponse.json(workPlans);
    } else {
      throw new Error('No work plan model available');
    }
  } catch (error) {
    console.error('Error fetching work plans:', error);
    return NextResponse.json({ 
      error: 'Error fetching work plans',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('=== POST /api/work-plans called ===');
  try {
    const prisma = getPrisma()
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
    console.log('Checking representative:', body.representativeId, 'Type:', typeof body.representativeId);
    let representative;
    try {
      // Try delegateData first (since that's what the UI uses)
      // DelegateId is String (UniqueIdentifier/GUID), so use string directly
      if (prisma.delegateData) {
        representative = await prisma.delegateData.findUnique({
          where: { DelegateId: String(body.representativeId) }
        });
      }
      
      // If not found in delegateData, try representative model (for backward compatibility)
      if (!representative && prisma.representative) {
        // Try parsing as number if it's a numeric string
        const numericId = typeof body.representativeId === 'string' 
          ? parseInt(body.representativeId) 
          : body.representativeId;
        if (!isNaN(numericId)) {
          representative = await prisma.representative.findUnique({
            where: { id: numericId }
          });
        }
      }
      
      console.log('Representative found:', representative ? 'Yes' : 'No', representative?.id || representative?.DelegateId);
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
    
    // Check which table has data first
    let useATMTable = false;
    if (prisma.bankATM) {
      const bankATMCount = await prisma.bankATM.count();
      console.log(`BankATM count: ${bankATMCount}`);
      if (bankATMCount === 0 && prisma.aTM) {
        const atmCount = await prisma.aTM.count();
        console.log(`ATM count: ${atmCount}`);
        if (atmCount > 0) {
          useATMTable = true;
          console.log('Using ATM table (BankATM is empty)');
        }
      }
    } else if (prisma.aTM) {
      useATMTable = true;
      console.log('Using ATM table (BankATM not available)');
    }
    
    for (const atmCode of body.atmCodes) {
      try {
        let atm = null;
        const trimmedCode = String(atmCode).trim();
        
        // Search in the correct table based on which has data
        if (useATMTable && prisma.aTM) {
          // Search in ATM table
          atm = await prisma.aTM.findFirst({
            where: { 
              atmCode: trimmedCode
            }
          });
          console.log(`ATM ${trimmedCode} in aTM table:`, atm ? 'Found' : 'Not found');
        } else if (prisma.bankATM) {
          // Search in BankATM table
          atm = await prisma.bankATM.findFirst({
            where: { 
              ATMCode: trimmedCode
            }
          });
          console.log(`ATM ${trimmedCode} in bankATM table:`, atm ? 'Found' : 'Not found');
          
          // If not found in bankATM and ATM table exists, try ATM table as fallback
          if (!atm && prisma.aTM) {
            atm = await prisma.aTM.findFirst({
              where: { 
                atmCode: trimmedCode
              }
            });
            console.log(`ATM ${trimmedCode} in aTM table (fallback):`, atm ? 'Found' : 'Not found');
          }
        }
        
        if (!atm) {
          console.error('ATM not found:', trimmedCode);
          return NextResponse.json({ 
            error: `الماكينة غير موجودة: ${trimmedCode}`,
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
      // Use workPlan model if available, otherwise use workPlanHeaders
      if (prisma.workPlan) {
        // التحقق من وجود خطة لنفس الماكينة في نفس اليوم مسبقاً
        try {
          console.log('Checking for existing work plans for same ATM and date...');
          console.log('Requested dates:', body.dates);
          console.log('Requested ATM codes:', body.atmCodes);

          // Normalize dates to YYYY-MM-DD format for comparison
          const normalizeDate = (dateStr: string): string => {
            if (!dateStr) return '';
            // Handle different date formats
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toISOString().split('T')[0];
          };

          const requestedDates = (body.dates as string[]).map(normalizeDate);
          const requestedAtmCodes = (body.atmCodes as string[]).map((code: string) => String(code).trim());

          // جلب جميع الخطط الموجودة للتحقق من التكرار
          // We check all plans because dates are stored as JSON arrays
          const existingPlans = await prisma.workPlan.findMany({
            select: {
              id: true,
              atmCodes: true,
              dates: true,
              startDate: true,
              endDate: true,
            },
          });

          console.log(`Found ${existingPlans.length} existing plans to check`);

          for (const plan of existingPlans) {
            let planDates: string[] = [];
            let planAtmCodes: string[] = [];

            try {
              const parsedDates = JSON.parse(plan.dates || '[]');
              planDates = Array.isArray(parsedDates) 
                ? parsedDates.map(normalizeDate)
                : [];
            } catch (e) {
              console.warn('Error parsing plan dates:', plan.id, e);
              planDates = [];
            }

            try {
              const parsedAtmCodes = JSON.parse(plan.atmCodes || '[]');
              planAtmCodes = Array.isArray(parsedAtmCodes)
                ? parsedAtmCodes.map((code: string) => String(code).trim())
                : [];
            } catch (e) {
              console.warn('Error parsing plan ATM codes:', plan.id, e);
              planAtmCodes = [];
            }

            // Check for conflicts: same ATM code on same date
            for (const requestedDate of requestedDates) {
              if (!planDates.includes(requestedDate)) continue;
              
              for (const requestedAtmCode of requestedAtmCodes) {
                if (planAtmCodes.includes(requestedAtmCode)) {
                  console.error('Conflict detected:', {
                    atmCode: requestedAtmCode,
                    date: requestedDate,
                    existingPlanId: plan.id,
                    existingPlanDates: planDates,
                    existingPlanAtmCodes: planAtmCodes,
                  });
                  
                  // Format date for display
                  const displayDate = new Date(requestedDate + 'T00:00:00Z');
                  const formattedDate = displayDate.toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                  
                  return NextResponse.json(
                    {
                      error: 'لا يمكن إنشاء أكثر من خطة لنفس الماكينة في نفس اليوم',
                      details: `الماكينة ${requestedAtmCode} لديها بالفعل خطة في التاريخ ${formattedDate} (خطة رقم ${plan.id})`,
                      conflictAtmCode: requestedAtmCode,
                      conflictDate: requestedDate,
                      existingPlanId: plan.id,
                    },
                    { status: 400 },
                  );
                }
              }
            }
          }

          console.log('No conflicts found, proceeding with plan creation');
        } catch (conflictError) {
          console.error('Error while checking existing work plans for conflicts:', conflictError);
          return NextResponse.json(
            {
              error: 'حدث خطأ أثناء التحقق من الخطط الموجودة',
              details: conflictError instanceof Error ? conflictError.message : 'خطأ غير معروف',
            },
            { status: 500 },
          );
        }

        // Convert representativeId properly
        // Note: DelegateId is String (GUID), but WorkPlan.representativeId is Int
        // We need to convert GUID to a number - use a simple hash function
        let representativeIdValue: number;
        if (representative?.id) {
          // If found in representative model, use id
          representativeIdValue = representative.id;
        } else if (representative?.DelegateId) {
          // Convert GUID string to number using simple hash
          // This creates a consistent numeric ID from the GUID
          const guidStr = String(representative.DelegateId);
          let hash = 0;
          for (let i = 0; i < guidStr.length; i++) {
            const char = guidStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
          }
          representativeIdValue = Math.abs(hash);
        } else {
          // Fallback: try to parse the provided ID
          const parsed = typeof body.representativeId === 'string' 
            ? parseInt(body.representativeId) 
            : body.representativeId;
          representativeIdValue = isNaN(parsed) ? 0 : parsed;
        }

        const workPlanData = {
          bankName: body.bankName,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          governorate: body.governorate,
          city: body.city,
          statement: body.statement,
          representativeId: representativeIdValue,
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
      } else {
        // Fallback: would need to use WorkPlanHeaders with complex mapping
        // For now, return error suggesting to create WorkPlan table
        return NextResponse.json({ 
          error: 'WorkPlan model not available. Please run: npx prisma db push',
          hint: 'The WorkPlan table needs to be created in the database'
        }, { status: 503 });
      }

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
    const prisma = getPrisma()
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
        if (!prisma.workPlan) {
          return NextResponse.json({ 
            error: 'WorkPlan model not available. Please run: npx prisma db push'
          }, { status: 503 });
        }
        
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
          console.log('=== UPDATING ATM-SPECIFIC DATA ===');
          console.log('ATM Code:', body.atmCode);
          console.log('WorkPlan ID:', body.id);
          
          // Parse existing atmReports
          let atmReports: any = {};
          try {
            atmReports = JSON.parse(existingPlan.atmReports || '{}');
            console.log('✅ Successfully parsed existing atmReports');
            console.log('📊 Existing ATMs:', Object.keys(atmReports));
          } catch (e) {
            console.error('❌ Error parsing atmReports:', e);
            atmReports = {};
          }
          
          // Initialize ATM report if it doesn't exist
          if (!atmReports[body.atmCode]) {
            console.log('🆕 Creating new ATM report for:', body.atmCode);
            atmReports[body.atmCode] = {
              beforeImages: [],
              afterImages: [],
              notes: [],
              status: 'pending'
            };
          } else {
            console.log('📝 Updating existing ATM report for:', body.atmCode);
            console.log('📸 Current beforeImages count:', atmReports[body.atmCode].beforeImages?.length || 0);
            console.log('📸 Current afterImages count:', atmReports[body.atmCode].afterImages?.length || 0);
          }
          
          // Update the specific ATM's data
          if (body.status !== undefined) {
            atmReports[body.atmCode].status = body.status;
            console.log('📊 Updating status for ATM:', body.atmCode, 'to:', body.status);
          }
          
          if (body.beforeImages !== undefined) {
            atmReports[body.atmCode].beforeImages = body.beforeImages;
            console.log('📸 UPDATING BEFORE IMAGES:');
            console.log('📸 ATM:', body.atmCode);
            console.log('📸 Count:', body.beforeImages.length);
            // Check if images are URLs or base64
            const firstImage = body.beforeImages[0];
            if (firstImage) {
              if (firstImage.startsWith('data:')) {
                console.log('📸 Format: base64 (legacy)');
                console.log('📸 First image size:', firstImage.length, 'characters');
              } else {
                console.log('📸 Format: URL (new)');
                console.log('📸 First image URL:', firstImage);
              }
            }
          }
          
          if (body.afterImages !== undefined) {
            atmReports[body.atmCode].afterImages = body.afterImages;
            console.log('📸 UPDATING AFTER IMAGES:');
            console.log('📸 ATM:', body.atmCode);
            console.log('📸 Count:', body.afterImages.length);
            // Check if images are URLs or base64
            const firstImage = body.afterImages[0];
            if (firstImage) {
              if (firstImage.startsWith('data:')) {
                console.log('📸 Format: base64 (legacy)');
                console.log('📸 First image size:', firstImage.length, 'characters');
              } else {
                console.log('📸 Format: URL (new)');
                console.log('📸 First image URL:', firstImage);
              }
            }
          }
          
          if (body.notes !== undefined) {
            atmReports[body.atmCode].notes = body.notes;
            console.log('📝 Updating notes for ATM:', body.atmCode, 'count:', body.notes.length);
          }
          
          const finalDataSize = JSON.stringify(atmReports).length;
          console.log('💾 Final atmReports data size:', finalDataSize, 'bytes');
          console.log('💾 Data size in KB:', Math.round(finalDataSize / 1024), 'KB');
          
          // Check data size limit
          const MAX_DATA_SIZE = 10 * 1024 * 1024; // 10MB
          if (finalDataSize > MAX_DATA_SIZE) {
            console.error('❌ DATA TOO LARGE:', finalDataSize, 'bytes');
            return NextResponse.json({ 
              error: 'حجم البيانات كبير جداً',
              details: `الحجم: ${Math.round(finalDataSize / 1024)}KB (الحد الأقصى: ${MAX_DATA_SIZE / 1024 / 1024}MB)`,
              dataSize: finalDataSize
            }, { status: 413 });
          }
          
          updateData.atmReports = JSON.stringify(atmReports);
          console.log('✅ Prepared updateData with atmReports');
        }
        // Legacy: Update global status if no atmCode provided (for backward compatibility)
        else if (body.status !== undefined && !body.atmCode) {
          updateData.status = body.status;
          console.log('Updating global status to:', body.status);
        }
        
        console.log('💾 Attempting database update...');
        console.log('💾 Update data keys:', Object.keys(updateData));
        console.log('💾 Update data size:', JSON.stringify(updateData).length, 'bytes');
        
        const workPlan = await prisma.workPlan.update({
          where: { id: body.id },
          data: updateData
        });

        console.log('✅ DATABASE UPDATE SUCCESSFUL!');
        console.log('✅ WorkPlan ID:', workPlan.id);
        console.log('✅ Updated atmReports size:', workPlan.atmReports?.length || 0, 'characters');
        console.log('✅ Updated atmReports preview:', workPlan.atmReports?.substring(0, 200) + '...');
        
        // Verify the data was actually saved
        if (body.atmCode && updateData.atmReports) {
          try {
            const savedReports = JSON.parse(workPlan.atmReports || '{}');
            const savedAtmData = savedReports[body.atmCode];
            if (savedAtmData) {
              console.log('✅ VERIFICATION SUCCESS:');
              console.log('✅ ATM Code found in saved data:', body.atmCode);
              console.log('✅ Before images count:', savedAtmData.beforeImages?.length || 0);
              console.log('✅ After images count:', savedAtmData.afterImages?.length || 0);
            } else {
              console.error('❌ VERIFICATION FAILED: ATM data not found in saved reports');
            }
          } catch (e) {
            console.error('❌ VERIFICATION ERROR: Could not parse saved atmReports:', e);
          }
        }

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
    console.log('Checking representative:', body.representativeId, 'Type:', typeof body.representativeId);
    let representative;
    try {
      // Try delegateData first (since that's what the UI uses)
      // DelegateId is String (UniqueIdentifier/GUID), so use string directly
      if (prisma.delegateData) {
        representative = await prisma.delegateData.findUnique({
          where: { DelegateId: String(body.representativeId) }
        });
      }
      
      // If not found in delegateData, try representative model (for backward compatibility)
      if (!representative && prisma.representative) {
        // Try parsing as number if it's a numeric string
        const numericId = typeof body.representativeId === 'string' 
          ? parseInt(body.representativeId) 
          : body.representativeId;
        if (!isNaN(numericId)) {
          representative = await prisma.representative.findUnique({
            where: { id: numericId }
          });
        }
      }
      
      console.log('Representative found:', representative ? 'Yes' : 'No', representative?.id || representative?.DelegateId);
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
    
    // Check which table has data first
    let useATMTable = false;
    if (prisma.bankATM) {
      const bankATMCount = await prisma.bankATM.count();
      console.log(`BankATM count: ${bankATMCount}`);
      if (bankATMCount === 0 && prisma.aTM) {
        const atmCount = await prisma.aTM.count();
        console.log(`ATM count: ${atmCount}`);
        if (atmCount > 0) {
          useATMTable = true;
          console.log('Using ATM table (BankATM is empty)');
        }
      }
    } else if (prisma.aTM) {
      useATMTable = true;
      console.log('Using ATM table (BankATM not available)');
    }
    
    for (const atmCode of body.atmCodes) {
      try {
        let atm = null;
        const trimmedCode = String(atmCode).trim();
        
        // Search in the correct table based on which has data
        if (useATMTable && prisma.aTM) {
          // Search in ATM table
          atm = await prisma.aTM.findFirst({
            where: { 
              atmCode: trimmedCode
            }
          });
          console.log(`ATM ${trimmedCode} in aTM table:`, atm ? 'Found' : 'Not found');
        } else if (prisma.bankATM) {
          // Search in BankATM table
          atm = await prisma.bankATM.findFirst({
            where: { 
              ATMCode: trimmedCode
            }
          });
          console.log(`ATM ${trimmedCode} in bankATM table:`, atm ? 'Found' : 'Not found');
          
          // If not found in bankATM and ATM table exists, try ATM table as fallback
          if (!atm && prisma.aTM) {
            atm = await prisma.aTM.findFirst({
              where: { 
                atmCode: trimmedCode
              }
            });
            console.log(`ATM ${trimmedCode} in aTM table (fallback):`, atm ? 'Found' : 'Not found');
          }
        }
        
        if (!atm) {
          console.error('ATM not found:', trimmedCode);
          return NextResponse.json({ 
            error: `الماكينة غير موجودة: ${trimmedCode}`,
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
      if (!prisma.workPlan) {
        return NextResponse.json({ 
          error: 'WorkPlan model not available. Please run: npx prisma db push',
          hint: 'The WorkPlan table needs to be created in the database'
        }, { status: 503 });
      }

      // Convert representativeId properly (same logic as POST)
      let representativeIdValue: number;
      if (representative?.id) {
        representativeIdValue = representative.id;
      } else if (representative?.DelegateId) {
        // Convert GUID string to number using simple hash
        const guidStr = String(representative.DelegateId);
        let hash = 0;
        for (let i = 0; i < guidStr.length; i++) {
          const char = guidStr.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        representativeIdValue = Math.abs(hash);
      } else {
        const parsed = typeof body.representativeId === 'string' 
          ? parseInt(body.representativeId) 
          : body.representativeId;
        representativeIdValue = isNaN(parsed) ? 0 : parsed;
      }

      const workPlanData = {
        bankName: body.bankName,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        governorate: body.governorate,
        city: body.city,
        statement: body.statement,
        representativeId: representativeIdValue,
        dates: JSON.stringify(body.dates),
        atmCodes: JSON.stringify(body.atmCodes),
        status: body.status || 'pending'
      };

      console.log('Updating work plan with data:', workPlanData);

      // التحقق من التعارضات عند التعديل (نفس المنطق المستخدم في POST)
      try {
        console.log('Checking for existing work plans for same ATM and date (on update)...');
        console.log('Requested dates:', body.dates);
        console.log('Requested ATM codes:', body.atmCodes);

        // Normalize dates to YYYY-MM-DD format for comparison
        const normalizeDate = (dateStr: string): string => {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return dateStr;
          return date.toISOString().split('T')[0];
        };

        const requestedDates = (body.dates as string[]).map(normalizeDate);
        const requestedAtmCodes = (body.atmCodes as string[]).map((code: string) => String(code).trim());

        // جلب جميع الخطط الموجودة (ما عدا الخطة الحالية) للتحقق من التكرار
        const existingPlans = await prisma.workPlan.findMany({
          where: {
            id: { not: body.id },
          },
          select: {
            id: true,
            atmCodes: true,
            dates: true,
            startDate: true,
            endDate: true,
          },
        });

        console.log(`Found ${existingPlans.length} existing plans to check (excluding plan ${body.id})`);

        for (const plan of existingPlans) {
          let planDates: string[] = [];
          let planAtmCodes: string[] = [];

          try {
            const parsedDates = JSON.parse(plan.dates || '[]');
            planDates = Array.isArray(parsedDates)
              ? parsedDates.map(normalizeDate)
              : [];
          } catch (e) {
            console.warn('Error parsing plan dates:', plan.id, e);
            planDates = [];
          }

          try {
            const parsedAtmCodes = JSON.parse(plan.atmCodes || '[]');
            planAtmCodes = Array.isArray(parsedAtmCodes)
              ? parsedAtmCodes.map((code: string) => String(code).trim())
              : [];
          } catch (e) {
            console.warn('Error parsing plan ATM codes:', plan.id, e);
            planAtmCodes = [];
          }

          // Check for conflicts: same ATM code on same date
          for (const requestedDate of requestedDates) {
            if (!planDates.includes(requestedDate)) continue;
            
            for (const requestedAtmCode of requestedAtmCodes) {
              if (planAtmCodes.includes(requestedAtmCode)) {
                console.error('Conflict detected on update:', {
                  atmCode: requestedAtmCode,
                  date: requestedDate,
                  existingPlanId: plan.id,
                  updatingPlanId: body.id,
                });
                
                // Format date for display
                const displayDate = new Date(requestedDate + 'T00:00:00Z');
                const formattedDate = displayDate.toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
                
                return NextResponse.json(
                  {
                    error: 'لا يمكن إنشاء أكثر من خطة لنفس الماكينة في نفس اليوم',
                    details: `الماكينة ${requestedAtmCode} لديها بالفعل خطة في التاريخ ${formattedDate} (خطة رقم ${plan.id})`,
                    conflictAtmCode: requestedAtmCode,
                    conflictDate: requestedDate,
                    existingPlanId: plan.id,
                  },
                  { status: 400 },
                );
              }
            }
          }
        }

        console.log('No conflicts found, proceeding with plan update');
      } catch (conflictError) {
        console.error('Error while checking existing work plans for conflicts (update):', conflictError);
        return NextResponse.json(
          {
            error: 'حدث خطأ أثناء التحقق من الخطط الموجودة',
            details: conflictError instanceof Error ? conflictError.message : 'خطأ غير معروف',
          },
          { status: 500 },
        );
      }

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
    const prisma = getPrisma()
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteAll = searchParams.get('deleteAll') === 'true';
    
    if (!prisma.workPlan) {
      return NextResponse.json({ 
        error: 'WorkPlan model not available. Please run: npx prisma db push'
      }, { status: 503 });
    }
    
    // If deleteAll is true, delete all work plans
    if (deleteAll) {
      console.log('Attempting to delete ALL work plans...');
      
      // Get all work plans first to delete associated images
      const allPlans = await prisma.workPlan.findMany({
        select: {
          id: true,
          atmReports: true,
        },
      });
      
      console.log(`Found ${allPlans.length} work plans to delete`);
      
      // Delete associated images from server
      const { unlink } = await import('fs/promises');
      const { existsSync } = await import('fs');
      const { join } = await import('path');
      
      for (const plan of allPlans) {
        try {
          if (plan.atmReports) {
            const atmReports = JSON.parse(plan.atmReports);
            const atmCodes = Object.keys(atmReports);
            
            for (const atmCode of atmCodes) {
              const report = atmReports[atmCode];
              const imageTypes = ['before', 'after'];
              
              for (const imageType of imageTypes) {
                const images = report[`${imageType}Images`] || [];
                for (const imageUrl of images) {
                  // Only delete if it's a file URL (not base64)
                  if (imageUrl && !imageUrl.startsWith('data:') && imageUrl.startsWith('/uploads')) {
                    try {
                      const relativePath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
                      const filePath = join(process.cwd(), 'public', relativePath);
                      
                      if (existsSync(filePath)) {
                        await unlink(filePath);
                        console.log(`Deleted image: ${filePath}`);
                      }
                    } catch (imageError) {
                      console.error(`Error deleting image ${imageUrl}:`, imageError);
                      // Continue with other images even if one fails
                    }
                  }
                }
              }
            }
          }
          
          // Delete upload directory for this work plan
          const uploadDir = join(process.cwd(), 'public', 'uploads', 'work-plans', String(plan.id));
          if (existsSync(uploadDir)) {
            const { rm } = await import('fs/promises');
            await rm(uploadDir, { recursive: true, force: true });
            console.log(`Deleted upload directory: ${uploadDir}`);
          }
        } catch (planError) {
          console.error(`Error processing images for work plan ${plan.id}:`, planError);
          // Continue with other plans even if one fails
        }
      }
      
      // Delete all client comments associated with work plans
      if (prisma.clientComment) {
        const deletedComments = await prisma.clientComment.deleteMany({});
        console.log(`Deleted ${deletedComments.count} client comments`);
      }
      
      // Delete all work plans
      const deletedPlans = await prisma.workPlan.deleteMany({});
      console.log(`Deleted ${deletedPlans.count} work plans`);
      
      return NextResponse.json({ 
        message: `تم حذف ${deletedPlans.count} خطة عمل بنجاح`,
        deletedCount: deletedPlans.count
      });
    }
    
    // Single work plan deletion
    if (!id) {
      console.error('Missing work plan ID');
      return NextResponse.json({ error: 'معرّف خطة العمل مطلوب' }, { status: 400 });
    }
    
    console.log('Attempting to delete work plan with ID:', id);
    
    // Verify work plan exists
    const existingPlan = await prisma.workPlan.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        atmReports: true,
      },
    });
    
    if (!existingPlan) {
      console.error('Work plan not found:', id);
      return NextResponse.json({ error: 'خطة العمل غير موجودة' }, { status: 404 });
    }
    
    console.log('Found work plan, proceeding with deletion...');
    
    // Delete associated images from server
    if (existingPlan.atmReports) {
      try {
        const { unlink } = await import('fs/promises');
        const { existsSync } = await import('fs');
        const { join } = await import('path');
        
        const atmReports = JSON.parse(existingPlan.atmReports);
        const atmCodes = Object.keys(atmReports);
        
        for (const atmCode of atmCodes) {
          const report = atmReports[atmCode];
          const imageTypes = ['before', 'after'];
          
          for (const imageType of imageTypes) {
            const images = report[`${imageType}Images`] || [];
            for (const imageUrl of images) {
              // Only delete if it's a file URL (not base64)
              if (imageUrl && !imageUrl.startsWith('data:') && imageUrl.startsWith('/uploads')) {
                try {
                  const relativePath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
                  const filePath = join(process.cwd(), 'public', relativePath);
                  
                  if (existsSync(filePath)) {
                    await unlink(filePath);
                    console.log(`Deleted image: ${filePath}`);
                  }
                } catch (imageError) {
                  console.error(`Error deleting image ${imageUrl}:`, imageError);
                }
              }
            }
          }
        }
        
        // Delete upload directory for this work plan
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'work-plans', String(existingPlan.id));
        if (existsSync(uploadDir)) {
          const { rm } = await import('fs/promises');
          await rm(uploadDir, { recursive: true, force: true });
          console.log(`Deleted upload directory: ${uploadDir}`);
        }
      } catch (imageError) {
        console.error('Error deleting images:', imageError);
        // Continue with deletion even if image deletion fails
      }
    }
    
    // Delete associated client comments
    if (prisma.clientComment) {
      await prisma.clientComment.deleteMany({
        where: { workPlanId: parseInt(id) },
      });
      console.log(`Deleted client comments for work plan ${id}`);
    }
    
    // Delete the work plan
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