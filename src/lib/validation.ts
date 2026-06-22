import { z } from 'zod';

export const step1Schema = z.object({
  businessName: z.string().min(2, 'Business Name must be at least 2 characters'),
  businessCategory: z.string().min(3, 'Business Category must be at least 3 characters'),
  productsServices: z.string().min(5, 'Please detail at least a few products or services'),
  businessDescription: z.string().min(10, 'Description must be at least 10 characters'),
  businessStartYear: z.string()
    .regex(/^[0-9]{4}$/, 'Must be a 4-digit year')
    .refine((val) => {
      const year = parseInt(val, 10);
      const currentYear = new Date().getFullYear();
      return year >= 1800 && year <= currentYear + 1;
    }, 'Must be a valid year'),
  businessWorkingHours: z.string().min(3, 'e.g., 9:00 AM - 9:00 PM, Mon-Sat'),
});

export const step2Schema = z.object({
  completeAddress: z.string().min(10, 'Please provide the complete street and building address'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Must be a 6-digit pincode (e.g. 600001)'),
  googleMapsLink: z.string().min(1, 'Google Maps Location Link is required'),
});

export const step3Schema = z.object({
  businessMobile: z.string().regex(/^[6-9][0-9]{9}$/, 'Must be a valid 10-digit mobile number'),
  whatsappNumber: z.string().regex(/^[6-9][0-9]{9}$/, 'Must be a valid 10-digit WhatsApp number'),
  whatsappSameAsMobile: z.boolean().optional(),
  alternateContact: z.string()
    .regex(/^([6-9][0-9]{9})?$/, 'Must be a valid 10-digit number')
    .optional()
    .or(z.literal('')),
});

export const step4Schema = z.object({
  hasBusinessGmail: z.boolean(),
  businessGmail: z.string().optional(),
  ownerName: z.string().optional(),
  ownerMobile: z.string().optional(),
  ownerDOB: z.string().optional(),
  recoveryMobile: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.hasBusinessGmail) {
    if (!data.businessGmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Gmail address is required',
        path: ['businessGmail'],
      });
    } else if (!/@gmail\.com$/.test(data.businessGmail)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Must end with @gmail.com',
        path: ['businessGmail'],
      });
    }
  } else {
    if (!data.ownerName || data.ownerName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Owner name is required',
        path: ['ownerName'],
      });
    }
    if (!data.ownerMobile || !/^[6-9][0-9]{9}$/.test(data.ownerMobile)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Valid 10-digit mobile is required',
        path: ['ownerMobile'],
      });
    }
    if (!data.ownerDOB) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Date of birth is required',
        path: ['ownerDOB'],
      });
    }
    if (!data.recoveryMobile || !/^[6-9][0-9]{9}$/.test(data.recoveryMobile)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Valid 10-digit recovery mobile is required',
        path: ['recoveryMobile'],
      });
    }
  }
});

export const step6Schema = z.object({
  gstNumber: z.string()
    .regex(/^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})?$/, 'Must match valid GSTIN format')
    .optional()
    .or(z.literal('')),
  websiteUrl: z.string()
    .regex(/^((https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\S*)?)?$/, 'Must be a valid URL')
    .optional()
    .or(z.literal('')),
  facebookLink: z.string()
    .regex(/^((https?:\/\/)?(www\.)?facebook\.com\/\S+)?$/, 'Must be a valid Facebook link')
    .optional()
    .or(z.literal('')),
  instagramLink: z.string()
    .regex(/^((https?:\/\/)?(www\.)?instagram\.com\/\S+)?$/, 'Must be a valid Instagram link')
    .optional()
    .or(z.literal('')),
  upiAvailable: z.boolean(),
  homeDelivery: z.boolean(),
});

// Complete backend validation schema
export const submissionSchema = z.object({
  businessName: z.string().min(2),
  businessCategory: z.string().min(3),
  productsServices: z.string().min(5),
  businessDescription: z.string().min(10),
  businessStartYear: z.string(),
  businessWorkingHours: z.string().min(3),
  completeAddress: z.string().min(10),
  pincode: z.string().regex(/^[0-9]{6}$/),
  googleMapsLink: z.string().min(1),
  businessMobile: z.string().regex(/^[6-9][0-9]{9}$/),
  whatsappNumber: z.string().regex(/^[6-9][0-9]{9}$/),
  whatsappSameAsMobile: z.boolean().optional(),
  alternateContact: z.string().optional().or(z.literal('')),
  hasBusinessGmail: z.boolean(),
  businessGmail: z.string().optional(),
  ownerName: z.string().optional(),
  ownerMobile: z.string().optional(),
  ownerDOB: z.string().optional(),
  recoveryMobile: z.string().optional(),
  gstNumber: z.string().optional().or(z.literal('')),
  websiteUrl: z.string().optional().or(z.literal('')),
  facebookLink: z.string().optional().or(z.literal('')),
  instagramLink: z.string().optional().or(z.literal('')),
  upiAvailable: z.boolean(),
  homeDelivery: z.boolean(),
  businessType: z.enum(['physical', 'service']),
  images: z.any().optional(),
});
