import { z } from 'zod';

// Reusable validators
const mobileRegex = /^[6-9][0-9]{9}$/;
const nameRegex = /^[a-zA-Z\s.'-]+$/; // letters, spaces, dots, apostrophes, hyphens only

export const step1Schema = z.object({
  businessName: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be under 100 characters')
    .regex(nameRegex, 'Business name must not contain special characters'),
  businessCategory: z.string()
    .min(3, 'Business category must be at least 3 characters')
    .max(100, 'Business category must be under 100 characters'),
  productsServices: z.string()
    .min(5, 'Please list at least a few products or services')
    .max(1000, 'Products/services must be under 1000 characters'),
  businessDescription: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be under 2000 characters'),
  businessStartYear: z.string()
    .regex(/^[0-9]{4}$/, 'Must be a 4-digit year')
    .refine((val) => {
      const year = parseInt(val, 10);
      const currentYear = new Date().getFullYear();
      return year >= 1800 && year <= currentYear + 1;
    }, 'Must be a valid year (e.g. 2015)'),
  businessWorkingHours: z.string()
    .min(3, 'e.g., 9:00 AM – 9:00 PM, Mon–Sat')
    .max(200, 'Working hours must be under 200 characters'),
});

export const step2Schema = z.object({
  completeAddress: z.string()
    .min(10, 'Please provide the complete street and building address')
    .max(500, 'Address must be under 500 characters'),
  pincode: z.string()
    .regex(/^[0-9]{6}$/, 'Must be a 6-digit pincode (e.g. 600001)'),
  googleMapsLink: z.string()
    .min(1, 'Google Maps Location Link is required'),
});

export const step3Schema = z.object({
  businessMobile: z.string()
    .regex(mobileRegex, 'Must be a valid 10-digit Indian mobile number starting with 6–9'),
  whatsappNumber: z.string()
    .regex(mobileRegex, 'Must be a valid 10-digit WhatsApp number starting with 6–9'),
  whatsappSameAsMobile: z.boolean().optional(),
  alternateContact: z.string()
    .regex(/^([6-9][0-9]{9})?$/, 'Must be a valid 10-digit number or leave empty')
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
    // Gmail field validations
    if (!data.businessGmail || data.businessGmail.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Gmail address is required',
        path: ['businessGmail'],
      });
    } else {
      const gmail = data.businessGmail.trim();
      // Must be all lowercase
      if (gmail !== gmail.toLowerCase()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Gmail address must be in lowercase only',
          path: ['businessGmail'],
        });
      }
      // Must end with @gmail.com
      if (!/@gmail\.com$/.test(gmail)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Must be a valid Gmail address ending with @gmail.com',
          path: ['businessGmail'],
        });
      }
      // No spaces allowed
      if (/\s/.test(gmail)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Gmail address must not contain spaces',
          path: ['businessGmail'],
        });
      }
    }
  } else {
    // Gmail creation — needs owner details
    if (!data.ownerName || data.ownerName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Owner name is required (min 2 characters)',
        path: ['ownerName'],
      });
    } else if (!nameRegex.test(data.ownerName.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Owner name must not contain special characters',
        path: ['ownerName'],
      });
    }

    if (!data.ownerMobile || !mobileRegex.test(data.ownerMobile)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Valid 10-digit mobile number is required',
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

    if (!data.recoveryMobile || !mobileRegex.test(data.recoveryMobile)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Valid 10-digit recovery mobile number is required',
        path: ['recoveryMobile'],
      });
    } else if (data.ownerMobile && data.recoveryMobile === data.ownerMobile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Recovery mobile must be different from the owner mobile number',
        path: ['recoveryMobile'],
      });
    }
  }
});

export const step6Schema = z.object({
  gstNumber: z.string()
    .regex(
      /^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})?$/,
      'Must be a valid 15-character GSTIN (e.g. 29ABCDE1234F1Z5)'
    )
    .optional()
    .or(z.literal('')),
  websiteUrl: z.string()
    .regex(
      /^((https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\S*)?)?$/,
      'Must be a valid website URL (e.g. https://yoursite.com)'
    )
    .optional()
    .or(z.literal('')),
  facebookLink: z.string()
    .regex(
      /^((https?:\/\/)?(www\.)?facebook\.com\/\S+)?$/,
      'Must be a valid Facebook page link'
    )
    .optional()
    .or(z.literal('')),
  instagramLink: z.string()
    .regex(
      /^((https?:\/\/)?(www\.)?instagram\.com\/\S+)?$/,
      'Must be a valid Instagram profile link'
    )
    .optional()
    .or(z.literal('')),
  upiAvailable: z.boolean(),
  homeDelivery: z.boolean(),
});

// Complete backend validation schema (server-side)
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
  businessMobile: z.string().regex(mobileRegex),
  whatsappNumber: z.string().regex(mobileRegex),
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
