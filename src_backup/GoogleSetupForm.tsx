import React, { useState } from 'react';
import { useFormik } from 'formik';
import { z } from 'zod';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Camera, 
  Plus, 
  Trash2, 
  Globe, 
  FileText, 
  Check, 
  ArrowRight, 
  Upload, 
  X, 
  AlertCircle, 
  DollarSign, 
  Truck,
  Layers,
  Clock,
  Calendar,
  CheckCircle2,
  Lock,
  Loader2
} from 'lucide-react';
import Stepper, { Step } from './Stepper';

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================

const step1Schema = z.object({
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

const step2Schema = z.object({
  completeAddress: z.string().min(10, 'Please provide the complete street and building address'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Must be a 6-digit pincode (e.g. 600001)'),
  googleMapsLink: z.string().min(1, 'Google Maps Location Link is required'),
});

const step3Schema = z.object({
  businessMobile: z.string().regex(/^[6-9][0-9]{9}$/, 'Must be a valid 10-digit mobile number'),
  whatsappNumber: z.string().regex(/^[6-9][0-9]{9}$/, 'Must be a valid 10-digit WhatsApp number'),
  alternateContact: z.string()
    .regex(/^([6-9][0-9]{9})?$/, 'Must be a valid 10-digit number')
    .optional()
    .or(z.literal('')),
});

const step4Schema = z.object({
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

const step6Schema = z.object({
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

interface ImageData {
  file: File;
  preview: string;
  cloudinaryUrl?: string;
  isUploading: boolean;
}

// ==========================================
// COMPONENT DECLARATION
// ==========================================

export default function GoogleSetupForm() {
  const [activeStep, setActiveStep] = useState(1);
  const [businessType, setBusinessType] = useState<'physical' | 'service'>('physical');
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [isCopyNotice, setIsCopyNotice] = useState(false);
  const [whatsAppLink, setWhatsAppLink] = useState('');

  // Local state for single images
  const [images, setImages] = useState<Record<string, ImageData>>({});
  // Local state for multiple images
  const [multipleImages, setMultipleImages] = useState<Record<string, ImageData[]>>({
    interior: [],
    productDisplay: [],
    serviceWork: [],
    teamWorking: [],
    beforeAfter: [],
    equipmentTools: [],
    workspace: [],
    customerService: []
  });

  const isCloudinaryConfigured = (): boolean => {
    const cloudName = typeof process !== 'undefined' ? process.env.VITE_CLOUDINARY_CLOUD_NAME : undefined;
    return !!(
      cloudName &&
      cloudName !== 'your_cloud_name'
    );
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = typeof process !== 'undefined' ? process.env.VITE_CLOUDINARY_CLOUD_NAME : undefined;
    const folder = typeof process !== 'undefined' ? process.env.VITE_CLOUDINARY_FOLDER : undefined;

    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const formik = useFormik({
    initialValues: {
      businessName: '',
      businessCategory: '',
      productsServices: '',
      businessDescription: '',
      businessStartYear: '',
      businessWorkingHours: '',
      
      completeAddress: '',
      pincode: '',
      googleMapsLink: '',
      
      businessMobile: '',
      whatsappNumber: '',
      whatsappSameAsMobile: false,
      alternateContact: '',
      
      hasBusinessGmail: true,
      businessGmail: '',
      ownerName: '',
      ownerMobile: '',
      ownerDOB: '',
      recoveryMobile: '',
      
      gstNumber: '',
      websiteUrl: '',
      facebookLink: '',
      instagramLink: '',
      upiAvailable: false,
      homeDelivery: false,
    },
    validate: (values) => {
      // Live validation depending on active step
      const errors: Record<string, string> = {};
      let result;

      if (activeStep === 1) {
        result = step1Schema.safeParse(values);
      } else if (activeStep === 2) {
        result = step2Schema.safeParse(values);
      } else if (activeStep === 3) {
        result = step3Schema.safeParse(values);
      } else if (activeStep === 4) {
        result = step4Schema.safeParse(values);
      } else if (activeStep === 6) {
        result = step6Schema.safeParse(values);
      }

      if (result && !result.success) {
        result.error.issues.forEach((err) => {
          if (err.path.length > 0) {
            errors[err.path[0].toString()] = err.message;
          }
        });
      }
      return errors;
    },
    onSubmit: (values) => {
      handleFinalSubmission(values);
    },
  });

  // Handle single photo uploads
  const handleSingleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      
      // Save local preview first
      setImages(prev => ({
        ...prev,
        [key]: { file, preview, isUploading: isCloudinaryConfigured() }
      }));

      // Upload if configured
      if (isCloudinaryConfigured()) {
        try {
          const url = await uploadToCloudinary(file);
          setImages(prev => ({
            ...prev,
            [key]: { ...prev[key], cloudinaryUrl: url, isUploading: false }
          }));
        } catch (error) {
          console.error('Cloudinary upload error', error);
          setImages(prev => ({
            ...prev,
            [key]: { ...prev[key], isUploading: false }
          }));
        }
      }
    }
  };

  const removeSingleImage = (key: string) => {
    if (images[key]) {
      URL.revokeObjectURL(images[key].preview);
      setImages(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  // Handle multiple photo uploads
  const handleMultipleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      const newItems: ImageData[] = newFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        isUploading: isCloudinaryConfigured()
      }));

      const startIndex = multipleImages[key]?.length || 0;

      setMultipleImages(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), ...newItems]
      }));

      // Upload files if configured
      if (isCloudinaryConfigured()) {
        newItems.forEach(async (item, idx) => {
          try {
            const url = await uploadToCloudinary(item.file);
            setMultipleImages(prev => {
              const currentList = [...(prev[key] || [])];
              const targetIdx = startIndex + idx;
              if (currentList[targetIdx]) {
                currentList[targetIdx] = {
                  ...currentList[targetIdx],
                  cloudinaryUrl: url,
                  isUploading: false
                };
              }
              return { ...prev, [key]: currentList };
            });
          } catch (error) {
            console.error('Cloudinary upload error', error);
            setMultipleImages(prev => {
              const currentList = [...(prev[key] || [])];
              const targetIdx = startIndex + idx;
              if (currentList[targetIdx]) {
                currentList[targetIdx] = {
                  ...currentList[targetIdx],
                  isUploading: false
                };
              }
              return { ...prev, [key]: currentList };
            });
          }
        });
      }
    }
  };

  const removeMultipleImage = (key: string, index: number) => {
    const list = multipleImages[key] || [];
    const item = list[index];
    if (item) {
      URL.revokeObjectURL(item.preview);
      const updated = list.filter((_, idx) => idx !== index);
      setMultipleImages(prev => ({
        ...prev,
        [key]: updated
      }));
    }
  };

  // Step check before stepping forward
  const beforeStepChange = (from: number, to: number): boolean => {
    // Helper to validate a specific step
    const validateSingleStep = (stepNumber: number) => {
      if (stepNumber === 1) return step1Schema.safeParse(formik.values);
      if (stepNumber === 2) return step2Schema.safeParse(formik.values);
      if (stepNumber === 3) return step3Schema.safeParse(formik.values);
      if (stepNumber === 4) return step4Schema.safeParse(formik.values);
      if (stepNumber === 6) return step6Schema.safeParse(formik.values);
      return { success: true, error: null };
    };

    // If completing the form (to === 7)
    if (to > 6) {
      // Validate all steps from 1 to 6
      for (let s = 1; s <= 6; s++) {
        const res = validateSingleStep(s);
        if (!res.success && res.error) {
          // Touch fields and set errors
          const errors: Record<string, string> = {};
          const touched: Record<string, boolean> = {};
          res.error.issues.forEach((err: z.ZodIssue) => {
            if (err.path.length > 0) {
              const fieldName = err.path[0].toString();
              errors[fieldName] = err.message;
              touched[fieldName] = true;
            }
          });
          formik.setErrors(errors);
          formik.setTouched(touched);
          formik.validateForm();

          // Scroll to the first error
          setTimeout(() => {
            const firstErrorEl = document.querySelector('[data-error="true"]');
            if (firstErrorEl) {
              firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);

          // Force step change to the invalid step
          setActiveStep(s);
          return false; // block completion
        }
      }
      // If all valid, complete
      return true;
    }

    // If navigating normally between steps (to <= 6)
    // We validate the current step 'from' to show errors, but do NOT block them!
    if (to > from) {
      const res = validateSingleStep(from);
      if (!res.success && res.error) {
        const touched: Record<string, boolean> = {};
        res.error.issues.forEach((err: z.ZodIssue) => {
          if (err.path.length > 0) {
            touched[err.path[0].toString()] = true;
          }
        });
        formik.setTouched({ ...formik.touched, ...touched });
        formik.validateForm();
      }
    }

    // Always allow normal browsing transitions between steps
    setActiveStep(to);
    return true;
  };

  // Build plaintext report
  const buildReviewText = (values: typeof formik.initialValues) => {
    let message = `-----------------------------------\n`;
    message += `GOOGLE BUSINESS PROFILE SETUP FORM\n`;
    message += `-----------------------------------\n\n`;

    message += `1. BUSINESS DETAILS\n`;
    message += `- Business Name: ${values.businessName}\n`;
    message += `- Category: ${values.businessCategory}\n`;
    message += `- Products/Services: ${values.productsServices}\n`;
    message += `- Description: ${values.businessDescription}\n`;
    message += `- Start Year: ${values.businessStartYear}\n`;
    message += `- Working Hours: ${values.businessWorkingHours}\n\n`;

    message += `2. LOCATION DETAILS\n`;
    message += `- Address: ${values.completeAddress}\n`;
    message += `- Pincode: ${values.pincode}\n`;
    message += `- Google Maps Link: ${values.googleMapsLink}\n\n`;

    message += `3. CONTACT DETAILS\n`;
    message += `- Mobile Number: ${values.businessMobile}\n`;
    message += `- WhatsApp Number: ${values.whatsappNumber}\n`;
    if (values.alternateContact) {
      message += `- Alternate Contact: ${values.alternateContact}\n`;
    }
    message += `\n`;

    message += `4. EMAIL & ACCOUNT DETAILS\n`;
    if (values.hasBusinessGmail) {
      message += `- Has Business Gmail: Yes\n`;
      message += `- Gmail ID: ${values.businessGmail}\n\n`;
    } else {
      message += `- Has Business Gmail: No (Create New Account)\n`;
      message += `- Owner Name: ${values.ownerName}\n`;
      message += `- Mobile Number: ${values.ownerMobile}\n`;
      message += `- Date of Birth: ${values.ownerDOB}\n`;
      message += `- Recovery Mobile: ${values.recoveryMobile}\n\n`;
    }

    message += `5. UPLOADED PHOTOS SUMMARY (${businessType.toUpperCase()} BUSINESS)\n`;
    
    // Check single image fields
    if (images.logo) {
      message += `- Logo: ${images.logo.cloudinaryUrl || '[Attached Locally]'}\n`;
    }
    if (images.visitingCard) {
      message += `- Visiting Card: ${images.visitingCard.cloudinaryUrl || '[Attached Locally]'}\n`;
    }
    
    if (businessType === 'physical') {
      if (images.shopFront) {
        message += `- Shop Front Photo: ${images.shopFront.cloudinaryUrl || '[Attached Locally]'}\n`;
      }
      if (images.nameBoard) {
        message += `- Shop Name Board Photo: ${images.nameBoard.cloudinaryUrl || '[Attached Locally]'}\n`;
      }
      if (images.billingCounter) {
        message += `- Billing Counter Photo: ${images.billingCounter.cloudinaryUrl || '[Attached Locally]'}\n`;
      }
      if (multipleImages.interior?.length > 0) {
        message += `- Interior Photos:\n`;
        multipleImages.interior.forEach((img, index) => {
          message += `  ${index + 1}. ${img.cloudinaryUrl || '[Attached Locally]'}\n`;
        });
      }
      if (multipleImages.productDisplay?.length > 0) {
        message += `- Product Display Photos:\n`;
        multipleImages.productDisplay.forEach((img, index) => {
          message += `  ${index + 1}. ${img.cloudinaryUrl || '[Attached Locally]'}\n`;
        });
      }
    } else {
      const keys = ['serviceWork', 'teamWorking', 'beforeAfter', 'equipmentTools', 'workspace', 'customerService'];
      keys.forEach(k => {
        if (multipleImages[k]?.length > 0) {
          const readable = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          message += `- ${readable}:\n`;
          multipleImages[k].forEach((img, index) => {
            message += `  ${index + 1}. ${img.cloudinaryUrl || '[Attached Locally]'}\n`;
          });
        }
      });
    }
    message += `\n`;

    message += `6. ADDITIONAL DETAILS & CONFIGS\n`;
    message += `- GST Number: ${values.gstNumber || 'Not Provided'}\n`;
    message += `- Website URL: ${values.websiteUrl || 'Not Provided'}\n`;
    message += `- Facebook Link: ${values.facebookLink || 'Not Provided'}\n`;
    message += `- Instagram Link: ${values.instagramLink || 'Not Provided'}\n`;
    message += `- UPI Payment Available: ${values.upiAvailable ? 'Yes' : 'No'}\n`;
    message += `- Home Delivery Available: ${values.homeDelivery ? 'Yes' : 'No'}\n\n`;

    message += `Note to Setup Team: Please review the details above. If images are marked as [Attached Locally], ask the user to attach them directly in this chat.`;
    return message;
  };

  const handleFinalSubmission = (values: typeof formik.initialValues) => {
    const message = buildReviewText(values);
    const envMobile = typeof process !== 'undefined' ? process.env.VITE_WHATSAPP_NUMBER : undefined;
    const targetMobile = envMobile ? envMobile.replace(/\D/g, '') : '918940210209';
    const encodedText = encodeURIComponent(message);
    const link = `https://api.whatsapp.com/send?phone=${targetMobile}&text=${encodedText}`;
    
    setWhatsAppLink(link);
    setIsSubmitSuccess(true);
    
    // Automatically open WhatsApp in new tab
    window.open(link, '_blank');
  };

  const copyToClipboard = () => {
    const message = buildReviewText(formik.values);
    navigator.clipboard.writeText(message);
    setIsCopyNotice(true);
    setTimeout(() => setIsCopyNotice(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-4 px-2 md:px-0">
      {/* HEADER SECTION */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-extrabold font-display text-white tracking-tight">
          Google Business Profile Setup Form
        </h1>
        <p className="text-slate-400 text-sm md:text-base mt-2 max-w-xl mx-auto">
          Provide your business details, coordinates, and images to create and optimize your Google search listing.
        </p>
      </div>

      {!isSubmitSuccess ? (
        <div className="w-full">
          {/* Progress Indicator for Step count */}
          <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl mb-4 max-w-[180px] mx-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</span>
            <span className="text-xs font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">Step {activeStep} of 6</span>
          </div>

          <form onSubmit={formik.handleSubmit} className="w-full">
            <Stepper
              activeStep={activeStep}
              initialStep={1}
              onStepChange={(step) => {
                setActiveStep(step);
              }}
              beforeStepChange={beforeStepChange}
              onFinalStepCompleted={() => {
                formik.handleSubmit();
              }}
              backButtonText="Previous"
              nextButtonText="Continue"
              disableStepIndicators={false}
              stepCircleContainerClassName="border border-slate-800 shadow-xl bg-slate-900/60 rounded-3xl"
            >
              {/* STEP 1: BUSINESS DETAILS */}
              <Step>
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-display text-white">Business Details</h3>
                      <p className="text-xs text-slate-400">Provide the fundamental identity details of your business.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Business Name */}
                    <div className="space-y-1.5" data-error={!!(formik.touched.businessName && formik.errors.businessName)}>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Business Name *</label>
                      <input
                        name="businessName"
                        type="text"
                        placeholder="Business Name"
                        value={formik.values.businessName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                      />
                      {formik.touched.businessName && formik.errors.businessName && (
                        <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>{formik.errors.businessName}</span>
                        </p>
                      )}
                    </div>

                    {/* Business Category */}
                    <div className="space-y-1.5" data-error={!!(formik.touched.businessCategory && formik.errors.businessCategory)}>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Business Category *</label>
                      <input
                        name="businessCategory"
                        type="text"
                        placeholder="e.g. Car Repair, Boutique, Grocery Store"
                        value={formik.values.businessCategory}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                      />
                      {formik.touched.businessCategory && formik.errors.businessCategory && (
                        <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>{formik.errors.businessCategory}</span>
                        </p>
                      )}
                    </div>

                    {/* Products / Services Offered */}
                    <div className="md:col-span-2 space-y-1.5" data-error={!!(formik.touched.productsServices && formik.errors.productsServices)}>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Products / Services Offered *</label>
                      <textarea
                        name="productsServices"
                        rows={2}
                        placeholder="Describe what you sell or do (comma-separated list, e.g. Wheel alignment, Engine tuning)"
                        value={formik.values.productsServices}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full resize-none"
                      />
                      {formik.touched.productsServices && formik.errors.productsServices && (
                        <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>{formik.errors.productsServices}</span>
                        </p>
                      )}
                    </div>

                    {/* Business Description */}
                    <div className="md:col-span-2 space-y-1.5" data-error={!!(formik.touched.businessDescription && formik.errors.businessDescription)}>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Business Description *</label>
                      <textarea
                        name="businessDescription"
                        rows={3}
                        placeholder="Describe your business to show Google searchers..."
                        value={formik.values.businessDescription}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                      />
                      {formik.touched.businessDescription && formik.errors.businessDescription && (
                        <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>{formik.errors.businessDescription}</span>
                        </p>
                      )}
                    </div>

                    {/* Business Start Year */}
                    <div className="space-y-1.5" data-error={!!(formik.touched.businessStartYear && formik.errors.businessStartYear)}>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Start Year *</span>
                      </label>
                      <input
                        name="businessStartYear"
                        type="text"
                        maxLength={4}
                        placeholder="e.g. 2018"
                        value={formik.values.businessStartYear}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                      />
                      {formik.touched.businessStartYear && formik.errors.businessStartYear && (
                        <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>{formik.errors.businessStartYear}</span>
                        </p>
                      )}
                    </div>

                    {/* Working Hours */}
                    <div className="space-y-1.5" data-error={!!(formik.touched.businessWorkingHours && formik.errors.businessWorkingHours)}>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Working Hours *</span>
                      </label>
                      <input
                        name="businessWorkingHours"
                        type="text"
                        placeholder="e.g. 9:00 AM - 8:00 PM, Mon-Sat"
                        value={formik.values.businessWorkingHours}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                      />
                      {formik.touched.businessWorkingHours && formik.errors.businessWorkingHours && (
                        <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>{formik.errors.businessWorkingHours}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Step>

              {/* STEP 2: LOCATION DETAILS */}
              <Step>
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-display text-white">Location Details</h3>
                      <p className="text-xs text-slate-400">Google requires precise mapping location configurations.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Complete Address */}
                    <div className="space-y-1.5" data-error={!!(formik.touched.completeAddress && formik.errors.completeAddress)}>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Complete Business Address *</label>
                      <textarea
                        name="completeAddress"
                        rows={3}
                        placeholder="Shop No, Building Name, Street Name, Landmark, City, State"
                        value={formik.values.completeAddress}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                      />
                      {formik.touched.completeAddress && formik.errors.completeAddress && (
                        <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>{formik.errors.completeAddress}</span>
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Pincode */}
                      <div className="space-y-1.5" data-error={!!(formik.touched.pincode && formik.errors.pincode)}>
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Pincode *</label>
                        <input
                          name="pincode"
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 600018"
                          value={formik.values.pincode}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                        />
                        {formik.touched.pincode && formik.errors.pincode && (
                          <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            <span>{formik.errors.pincode}</span>
                          </p>
                        )}
                      </div>

                      {/* Google Maps Location Link */}
                      <div className="md:col-span-2 space-y-1.5" data-error={!!(formik.touched.googleMapsLink && formik.errors.googleMapsLink)}>
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Google Maps Link *</label>
                        <input
                          name="googleMapsLink"
                          type="text"
                          placeholder="Link to your Google Maps location coordinates"
                          value={formik.values.googleMapsLink}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                        />
                        {formik.touched.googleMapsLink && formik.errors.googleMapsLink && (
                          <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            <span>{formik.errors.googleMapsLink}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Step>

              {/* STEP 3: CONTACT DETAILS */}
              <Step>
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-display text-white">Contact Details</h3>
                      <p className="text-xs text-slate-400">How clients and search engines reach your company.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Business Mobile Number */}
                    <div className="space-y-1.5" data-error={!!(formik.touched.businessMobile && formik.errors.businessMobile)}>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Business Mobile *</label>
                      <input
                        name="businessMobile"
                        type="text"
                        maxLength={10}
                        placeholder="e.g. 9876543210"
                        value={formik.values.businessMobile}
                        onChange={(e) => {
                          const val = e.target.value;
                          formik.setFieldValue('businessMobile', val);
                          if (formik.values.whatsappSameAsMobile) {
                            formik.setFieldValue('whatsappNumber', val);
                          }
                        }}
                        onBlur={formik.handleBlur}
                        className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                      />
                      {formik.touched.businessMobile && formik.errors.businessMobile && (
                        <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>{formik.errors.businessMobile}</span>
                        </p>
                      )}
                    </div>

                    {/* WhatsApp Number */}
                    <div className="space-y-1.5" data-error={!!(formik.touched.whatsappNumber && formik.errors.whatsappNumber)}>
                      <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">WhatsApp Number *</label>
                        
                        {/* Same as Mobile Checkbox */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            name="whatsappSameAsMobile"
                            id="whatsappSameAsMobile"
                            checked={formik.values.whatsappSameAsMobile}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              formik.setFieldValue('whatsappSameAsMobile', checked);
                              if (checked) {
                                formik.setFieldValue('whatsappNumber', formik.values.businessMobile);
                              }
                            }}
                            className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                          />
                          <label htmlFor="whatsappSameAsMobile" className="text-[10px] text-slate-400 font-semibold cursor-pointer select-none">
                            Same as Mobile
                          </label>
                        </div>
                      </div>
                      
                      <input
                        name="whatsappNumber"
                        type="text"
                        maxLength={10}
                        placeholder="e.g. 9876543210"
                        value={formik.values.whatsappNumber}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        disabled={formik.values.whatsappSameAsMobile}
                        className={`bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full ${
                          formik.values.whatsappSameAsMobile ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''
                        }`}
                      />
                      {formik.touched.whatsappNumber && formik.errors.whatsappNumber && (
                        <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>{formik.errors.whatsappNumber}</span>
                        </p>
                      )}
                    </div>

                    {/* Alternate Contact Number */}
                    <div className="space-y-1.5" data-error={!!(formik.touched.alternateContact && formik.errors.alternateContact)}>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Alternate Number (Optional)</label>
                      <input
                        name="alternateContact"
                        type="text"
                        maxLength={10}
                        placeholder="Landline or mobile"
                        value={formik.values.alternateContact}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                      />
                      {formik.touched.alternateContact && formik.errors.alternateContact && (
                        <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>{formik.errors.alternateContact}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Step>

              {/* STEP 4: EMAIL & ACCOUNT DETAILS */}
              <Step>
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-display text-white">Email & Account Details</h3>
                      <p className="text-xs text-slate-400">Required credentials to register and configure your Google Business Profile owner portal.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Yes/No Question */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-200 block">Do you already have a Business Gmail Account?</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            formik.setFieldValue('hasBusinessGmail', true);
                            formik.setFieldValue('ownerName', '');
                            formik.setFieldValue('ownerMobile', '');
                            formik.setFieldValue('ownerDOB', '');
                            formik.setFieldValue('recoveryMobile', '');
                          }}
                          className={`py-3.5 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            formik.values.hasBusinessGmail 
                              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-md' 
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <Check className={`w-4 h-4 transition-all ${formik.values.hasBusinessGmail ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
                          <span>Yes, I have one</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            formik.setFieldValue('hasBusinessGmail', false);
                            formik.setFieldValue('businessGmail', '');
                          }}
                          className={`py-3.5 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            !formik.values.hasBusinessGmail 
                              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-md' 
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <Check className={`w-4 h-4 transition-all ${!formik.values.hasBusinessGmail ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
                          <span>No, need to create</span>
                        </button>
                      </div>
                    </div>

                    {/* Conditional Rendering */}
                    {formik.values.hasBusinessGmail ? (
                      <div className="space-y-2 p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 transition-all duration-300">
                        <div className="space-y-1.5" data-error={!!(formik.touched.businessGmail && formik.errors.businessGmail)}>
                          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Business Gmail ID *</label>
                          <input
                            name="businessGmail"
                            type="text"
                            placeholder="e.g. almasauto@gmail.com"
                            value={formik.values.businessGmail}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                          />
                          {formik.touched.businessGmail && formik.errors.businessGmail && (
                            <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3 text-rose-500" />
                              <span>{formik.errors.businessGmail}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6 p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 transition-all duration-300">
                        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-2">
                          <Lock className="w-3.5 h-3.5" />
                          <span>We will register a new Gmail. Please fill registration details:</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Owner Name */}
                          <div className="space-y-1.5" data-error={!!(formik.touched.ownerName && formik.errors.ownerName)}>
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Owner Name *</label>
                            <input
                              name="ownerName"
                              type="text"
                              placeholder="Full name as in ID"
                              value={formik.values.ownerName}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                            />
                            {formik.touched.ownerName && formik.errors.ownerName && (
                              <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3 text-rose-500" />
                                <span>{formik.errors.ownerName}</span>
                              </p>
                            )}
                          </div>

                          {/* Mobile Number */}
                          <div className="space-y-1.5" data-error={!!(formik.touched.ownerMobile && formik.errors.ownerMobile)}>
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Mobile Number *</label>
                            <input
                              name="ownerMobile"
                              type="text"
                              maxLength={10}
                              placeholder="Mobile number for Verification"
                              value={formik.values.ownerMobile}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                            />
                            {formik.touched.ownerMobile && formik.errors.ownerMobile && (
                              <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3 text-rose-500" />
                                <span>{formik.errors.ownerMobile}</span>
                              </p>
                            )}
                          </div>

                          {/* Date of Birth */}
                          <div className="space-y-1.5" data-error={!!(formik.touched.ownerDOB && formik.errors.ownerDOB)}>
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Date of Birth *</label>
                            <input
                              name="ownerDOB"
                              type="date"
                              value={formik.values.ownerDOB}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                            />
                            {formik.touched.ownerDOB && formik.errors.ownerDOB && (
                              <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3 text-rose-500" />
                                <span>{formik.errors.ownerDOB}</span>
                              </p>
                            )}
                          </div>

                          {/* Recovery Mobile Number */}
                          <div className="space-y-1.5" data-error={!!(formik.touched.recoveryMobile && formik.errors.recoveryMobile)}>
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Recovery Mobile Number *</label>
                            <input
                              name="recoveryMobile"
                              type="text"
                              maxLength={10}
                              placeholder="Alternative contact recovery mobile"
                              value={formik.values.recoveryMobile}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                            />
                            {formik.touched.recoveryMobile && formik.errors.recoveryMobile && (
                              <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3 text-rose-500" />
                                <span>{formik.errors.recoveryMobile}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Step>

              {/* STEP 5: BUSINESS PHOTOS UPLOAD */}
              <Step>
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-display text-white">Business Photos</h3>
                      <p className="text-xs text-slate-400">Upload business operational photos. Files will upload to Cloudinary if keys are set in your env config.</p>
                    </div>
                  </div>

                  {/* Switch between Shop vs Service */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-200 block">Select your business type:</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setBusinessType('physical')}
                        className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          businessType === 'physical'
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Shop / Physical Store</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBusinessType('service')}
                        className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          businessType === 'service'
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                        <span>Service-Based Business</span>
                      </button>
                    </div>
                  </div>

                  {/* PHOTO UPLOAD BOXES */}
                  <div className="space-y-6 pt-2">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 md:p-6">
                      {businessType === 'physical' ? (
                        /* PHYSICAL SHOP PHOTOS */
                        <div className="space-y-6">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Shop & Physical Store Photos</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Shop Front Photo */}
                            {renderSingleUploadWidget('shopFront', 'Shop Front Photo', 'Front facade showing entry')}
                            
                            {/* Shop Name Board */}
                            {renderSingleUploadWidget('nameBoard', 'Name Board Photo', 'Clearly visible name board sign')}

                            {/* Billing Counter */}
                            {renderSingleUploadWidget('billingCounter', 'Billing Counter Photo', 'Reception or point of sale counter')}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/60">
                            {/* Interior Photos (Multiple) */}
                            {renderMultipleUploadWidget('interior', 'Interior Photos', 'General shop interior layout')}
                            
                            {/* Product Display (Multiple) */}
                            {renderMultipleUploadWidget('productDisplay', 'Product Display Photos', 'Racks, shelves, or inventory showcase')}
                          </div>
                        </div>
                      ) : (
                        /* SERVICE-BASED PHOTOS */
                        <div className="space-y-6">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Service-based / Office Photos</div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderMultipleUploadWidget('serviceWork', 'Service / Work Photos', 'Photos of your team working at locations')}
                            {renderMultipleUploadWidget('teamWorking', 'Team Working Photos', 'Action shots of office operations')}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/60">
                            {renderMultipleUploadWidget('beforeAfter', 'Before & After Photos', 'Project transformations side-by-side')}
                            {renderMultipleUploadWidget('equipmentTools', 'Equipment & Tools Photos', 'Kits, tools, mechanical systems used')}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/60">
                            {renderMultipleUploadWidget('workspace', 'Office / Workspace Photos', 'Desk spaces, offices, meeting areas')}
                            {renderMultipleUploadWidget('customerService', 'Customer Service Photos', 'Consultation rooms or lobby spaces')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Step>

              {/* STEP 6: ADDITIONAL DETAILS */}
              <Step>
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-display text-white">Additional Details</h3>
                      <p className="text-xs text-slate-400">Add logos, social links, and transactional indicators (Optional).</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Business Logo Upload */}
                    <div className="md:col-span-1">
                      {renderSingleUploadWidget('logo', 'Business Logo', 'Clean logo image square')}
                    </div>

                    {/* Visiting Card Upload */}
                    <div className="md:col-span-1">
                      {renderSingleUploadWidget('visitingCard', 'Visiting Card Photo', 'Front side of business card')}
                    </div>

                    {/* GST Number */}
                    <div className="space-y-1.5" data-error={!!(formik.touched.gstNumber && formik.errors.gstNumber)}>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">GST Number (Optional)</label>
                      <input
                        name="gstNumber"
                        type="text"
                        placeholder="e.g. 22AAAAA1111A1Z1"
                        value={formik.values.gstNumber}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                      />
                      {formik.touched.gstNumber && formik.errors.gstNumber && (
                        <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>{formik.errors.gstNumber}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
                    {/* Website URL */}
                    <div className="space-y-1.5" data-error={!!(formik.touched.websiteUrl && formik.errors.websiteUrl)}>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>Website URL</span>
                      </label>
                      <input
                        name="websiteUrl"
                        type="text"
                        placeholder="https://example.com"
                        value={formik.values.websiteUrl}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                      />
                      {formik.touched.websiteUrl && formik.errors.websiteUrl && (
                        <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>{formik.errors.websiteUrl}</span>
                        </p>
                      )}
                    </div>

                    {/* Facebook Link */}
                    <div className="space-y-1.5" data-error={!!(formik.touched.facebookLink && formik.errors.facebookLink)}>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Facebook Link</label>
                      <input
                        name="facebookLink"
                        type="text"
                        placeholder="https://facebook.com/business-name"
                        value={formik.values.facebookLink}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                      />
                      {formik.touched.facebookLink && formik.errors.facebookLink && (
                        <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>{formik.errors.facebookLink}</span>
                        </p>
                      )}
                    </div>

                    {/* Instagram Link */}
                    <div className="space-y-1.5" data-error={!!(formik.touched.instagramLink && formik.errors.instagramLink)}>
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Instagram Link</label>
                      <input
                        name="instagramLink"
                        type="text"
                        placeholder="https://instagram.com/business-name"
                        value={formik.values.instagramLink}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
                      />
                      {formik.touched.instagramLink && formik.errors.instagramLink && (
                        <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>{formik.errors.instagramLink}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Checkbox Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {/* UPI Available */}
                    <button
                      type="button"
                      onClick={() => formik.setFieldValue('upiAvailable', !formik.values.upiAvailable)}
                      className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                        formik.values.upiAvailable 
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300' 
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className={`mt-0.5 p-1 rounded border transition-colors ${formik.values.upiAvailable ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-650'}`}>
                        {formik.values.upiAvailable && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold flex items-center gap-1.5 text-white">
                          <DollarSign className="w-4 h-4 text-indigo-400" />
                          <span>UPI Payment Available</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Check if you accept UPI, GPay, PhonePe, or store QR codes.</p>
                      </div>
                    </button>

                    {/* Home Delivery Available */}
                    <button
                      type="button"
                      onClick={() => formik.setFieldValue('homeDelivery', !formik.values.homeDelivery)}
                      className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                        formik.values.homeDelivery 
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300' 
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className={`mt-0.5 p-1 rounded border transition-colors ${formik.values.homeDelivery ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-650'}`}>
                        {formik.values.homeDelivery && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold flex items-center gap-1.5 text-white">
                          <Truck className="w-4 h-4 text-indigo-400" />
                          <span>Home Delivery Available</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Check if you offer delivery services to clients.</p>
                      </div>
                    </button>
                  </div>
                </div>
              </Step>
            </Stepper>
          </form>
        </div>
      ) : (
        /* SUCCESS SUBMISSION STATE & WHATSAPP REDIRECT SCREEN */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 text-center max-w-2xl mx-auto shadow-2xl transition-all">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-display text-white">Success! Details Formulated</h2>
          <p className="text-slate-300 mt-3 text-sm md:text-base px-2">
            Your details are compiled and structured. If WhatsApp did not open automatically, please click the button below.
          </p>

          <div className="mt-8 bg-slate-950 rounded-2xl border border-slate-800 text-left p-5 relative max-h-80 overflow-y-auto">
            <div className="absolute right-4 top-4 z-10 flex gap-2">
              <button 
                onClick={copyToClipboard}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-750 rounded-lg cursor-pointer transition-all"
              >
                {isCopyNotice ? 'Copied!' : 'Copy Details'}
              </button>
            </div>
            <pre id="review-formatted-text" className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
              {buildReviewText(formik.values)}
            </pre>
          </div>

          <div className="mt-6 flex flex-col md:flex-row gap-4 justify-center items-center">
            <a
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>Send WhatsApp Details</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              onClick={() => setIsSubmitSuccess(false)}
              className="px-6 py-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 text-sm font-semibold rounded-xl cursor-pointer transition-all"
            >
              Edit Form
            </button>
          </div>

          <div className="mt-8 p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 text-slate-400 text-xs flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-indigo-300">Cloudinary Upload Status: </span>
              {isCloudinaryConfigured() 
                ? 'Your images have been uploaded to Cloudinary, and secure URLs are included in the summary above.'
                : 'Since Cloudinary is not configured in your env, images remain local on your device. Please attach your photos manually in the WhatsApp chat window.'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Upload widget for single files
  function renderSingleUploadWidget(key: string, label: string, helperText: string) {
    const item = images[key];
    const hasImage = !!item;

    return (
      <div className="space-y-1.5 flex flex-col items-stretch">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">{label}</label>
        
        {hasImage ? (
          <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center">
            <img 
              src={item.preview} 
              alt={label} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {item.isUploading && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                <span className="text-[10px] text-slate-400 font-semibold">Uploading to Cloudinary...</span>
              </div>
            )}
            {!item.isUploading && (
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                {item.cloudinaryUrl ? (
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold mb-1">
                    Uploaded to Cloudinary
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-semibold mb-1">
                    Local Only
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeSingleImage(key)}
                  className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg cursor-pointer transition-colors shadow-md"
                  title="Remove photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950 hover:bg-indigo-500/2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all aspect-video">
            <Upload className="w-6 h-6 text-slate-500" />
            <div className="text-center">
              <span className="text-xs font-semibold text-slate-300">Click to upload</span>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[150px] mx-auto">{helperText}</p>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleSingleImageChange(e, key)}
            />
          </label>
        )}
      </div>
    );
  }

  // Upload widget for multiple files
  function renderMultipleUploadWidget(key: string, label: string, helperText: string) {
    const list = multipleImages[key] || [];

    return (
      <div className="space-y-1.5 flex flex-col items-stretch">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">{label} (Multiple)</label>
        
        <div className="grid grid-cols-3 gap-2">
          {list.map((item, index) => (
            <div key={index} className="relative group rounded-lg overflow-hidden border border-slate-850 bg-slate-950 aspect-square flex items-center justify-center">
              <img 
                src={item.preview} 
                alt={`${label} ${index + 1}`} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {item.isUploading ? (
                <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                </div>
              ) : (
                <>
                  <div className={`absolute top-1 left-1 h-1.5 w-1.5 rounded-full ${item.cloudinaryUrl ? 'bg-emerald-500' : 'bg-slate-400'}`} title={item.cloudinaryUrl ? 'Cloudinary Uploaded' : 'Local Only'} />
                  <button
                    type="button"
                    onClick={() => removeMultipleImage(key, index)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded cursor-pointer transition-colors shadow opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}

          {/* Add square upload box */}
          <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950 hover:bg-indigo-500/2 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-all aspect-square">
            <Plus className="w-5 h-5 text-slate-500" />
            <span className="text-[9px] font-semibold text-slate-400">Add photos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleMultipleImageChange(e, key)}
            />
          </label>
        </div>
        <p className="text-[10px] text-slate-500">{helperText}</p>
      </div>
    );
  }
}
