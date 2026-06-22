import { NextRequest, NextResponse } from 'next/server';
import { saveSubmission } from '@/lib/db';
import { submissionSchema } from '@/lib/validation';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Configure Cloudinary server-side
    const isCloudinaryConfigured = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET;

    if (isCloudinaryConfigured) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });
    }

    // 1. Reconstruct the images object from uploaded files
    const images: Record<string, any> = {};

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        const file = value;
        let secureUrl = '[Local Image]';

        if (isCloudinaryConfigured) {
          try {
            // Read file buffer in memory and convert to data URI
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Data = buffer.toString('base64');
            const dataUrl = `data:${file.type};base64,${base64Data}`;
            
            // Upload to Cloudinary
            const uploadResponse = await cloudinary.uploader.upload(dataUrl, {
              folder: process.env.CLOUDINARY_FOLDER || 'google_business_form'
            });
            secureUrl = uploadResponse.secure_url;
          } catch (cloudinaryError) {
            console.error(`Cloudinary upload failed for ${key}:`, cloudinaryError);
            secureUrl = '[Upload Failed]';
          }
        }

        // Parse key structure (e.g. 'file_logo' or 'file_interior_0')
        const parts = key.replace('file_', '').split('_');
        const labelKey = parts[0];
        
        if (parts.length > 1 && !isNaN(Number(parts[1]))) {
          // It's a multiple image list array
          if (!images[labelKey]) {
            images[labelKey] = [];
          }
          const index = Number(parts[1]);
          images[labelKey][index] = secureUrl;
        } else {
          // It's a single image field
          images[labelKey] = secureUrl;
        }
      }
    }

    // Clean up empty index items in multiple image lists
    Object.keys(images).forEach(labelKey => {
      if (Array.isArray(images[labelKey])) {
        images[labelKey] = images[labelKey].filter(item => item !== undefined);
      }
    });

    // 2. Parse and structure the text fields
    const parsedPayload = {
      businessName: formData.get('businessName') as string,
      businessCategory: formData.get('businessCategory') as string,
      productsServices: formData.get('productsServices') as string,
      businessDescription: formData.get('businessDescription') as string,
      businessStartYear: formData.get('businessStartYear') as string,
      businessWorkingHours: formData.get('businessWorkingHours') as string,
      completeAddress: formData.get('completeAddress') as string,
      pincode: formData.get('pincode') as string,
      googleMapsLink: formData.get('googleMapsLink') as string,
      businessMobile: formData.get('businessMobile') as string,
      whatsappNumber: formData.get('whatsappNumber') as string,
      whatsappSameAsMobile: formData.get('whatsappSameAsMobile') === 'true',
      alternateContact: (formData.get('alternateContact') as string) || '',
      hasBusinessGmail: formData.get('hasBusinessGmail') === 'true',
      businessGmail: (formData.get('businessGmail') as string) || '',
      ownerName: (formData.get('ownerName') as string) || '',
      ownerMobile: (formData.get('ownerMobile') as string) || '',
      ownerDOB: (formData.get('ownerDOB') as string) || '',
      recoveryMobile: (formData.get('recoveryMobile') as string) || '',
      gstNumber: (formData.get('gstNumber') as string) || '',
      websiteUrl: (formData.get('websiteUrl') as string) || '',
      facebookLink: (formData.get('facebookLink') as string) || '',
      instagramLink: (formData.get('instagramLink') as string) || '',
      upiAvailable: formData.get('upiAvailable') === 'true',
      homeDelivery: formData.get('homeDelivery') === 'true',
      businessType: formData.get('businessType') as 'physical' | 'service',
      images,
    };

    // 3. Server-side Zod validation
    const validationResult = submissionSchema.safeParse(parsedPayload);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }

    // Attach current time as submission timestamp
    const submissionData = {
      ...validationResult.data,
      submittedAt: new Date().toISOString()
    };

    // 4. Save to MongoDB, PostgreSQL, or local JSON fallback
    const result = await saveSubmission(submissionData);

    return NextResponse.json({
      success: true,
      message: 'Submission successfully recorded',
      id: result.id,
      database: result.dbType
    });

  } catch (error: any) {
    console.error('Error handling form submission:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred while saving the form.'
      },
      { status: 500 }
    );
  }
}
