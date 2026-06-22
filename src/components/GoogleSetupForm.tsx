"use client";

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
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step6Schema
} from '@/lib/validation';

interface ImageData {
  file: File;
  preview: string;
  cloudinaryUrl?: string;
  isUploading: boolean;
}

export default function GoogleSetupForm() {
  const [activeStep, setActiveStep] = useState(1);
  const [businessType, setBusinessType] = useState<'physical' | 'service'>('physical');
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [isCopyNotice, setIsCopyNotice] = useState(false);
  const [whatsAppLink, setWhatsAppLink] = useState('');
  
  // Database submission state
  const [isSubmittingToDb, setIsSubmittingToDb] = useState(false);
  const [dbSubmitError, setDbSubmitError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string>('');
  const [databaseType, setDatabaseType] = useState<string>('');

  // Local state for all images (multiple images support for all upload fields)
  const [multipleImages, setMultipleImages] = useState<Record<string, ImageData[]>>({
    logo: [],
    visitingCard: [],
    shopFront: [],
    nameBoard: [],
    billingCounter: [],
    interior: [],
    productDisplay: [],
    serviceWork: [],
    teamWorking: [],
    beforeAfter: [],
    equipmentTools: [],
    workspace: [],
    customerService: []
  });

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

  // Handle multiple photo selections (local only)
  const handleMultipleImageChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      const newItems: ImageData[] = newFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        isUploading: false
      }));

      setMultipleImages(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), ...newItems]
      }));
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
  const beforeStepChange = (from: number, to: number, isDirectClick?: boolean): boolean => {
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

    // If navigating forward between steps
    if (to > from) {
      const res = validateSingleStep(from);
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

        // If clicked top stepper directly, let them browse to see other steps, but show validation errors.
        // If clicked bottom "Continue" button, block the transition.
        if (!isDirectClick) {
          return false;
        }
      }
    }

    // Allow normal transition
    setActiveStep(to);
    return true;
  };

  // Build plaintext report
  const buildReviewText = (values: typeof formik.initialValues, dbId?: string, dbType?: string) => {
    let message = `-----------------------------------\n`;
    message += `GOOGLE BUSINESS PROFILE SETUP FORM\n`;
    message += `-----------------------------------\n\n`;

    if (dbId && dbType) {
      message += `DATABASE RECORD SAVED\n`;
      message += `- ID: ${dbId}\n`;
      message += `- Storage: ${dbType}\n\n`;
    }

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
      message += `- Owner Mobile: ${values.ownerMobile}\n`;
      message += `- Date of Birth: ${values.ownerDOB}\n`;
      message += `- Recovery Mobile: ${values.recoveryMobile}\n\n`;
    }

    message += `5. UPLOADED PHOTOS SUMMARY (${businessType.toUpperCase()} BUSINESS)\n`;
    
    const keysToCheck = ['logo', 'visitingCard', 'shopFront', 'nameBoard', 'billingCounter'];
    keysToCheck.forEach(k => {
      const list = multipleImages[k] || [];
      if (list.length > 0) {
        const readable = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        message += `- ${readable}:\n`;
        list.forEach((img, index) => {
          message += `  ${index + 1}. ${img.cloudinaryUrl || '[Attached Locally]'}\n`;
        });
      }
    });
    
    if (businessType === 'physical') {
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

  const handleFinalSubmission = async (values: typeof formik.initialValues) => {
    setIsSubmittingToDb(true);
    setDbSubmitError(null);

    const formData = new FormData();

    // 1. Append all text form fields
    Object.entries(values).forEach(([key, val]) => {
      formData.append(key, String(val));
    });
    formData.append('businessType', businessType);

    // 2. Append all uploaded files
    Object.entries(multipleImages).forEach(([key, list]) => {
      if (list && list.length > 0) {
        list.forEach((img, idx) => {
          if (img.file) {
            formData.append(`file_${key}_${idx}`, img.file);
          }
        });
      }
    });

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Failed to submit form details to server database.');
      }

      setSubmissionId(result.id);
      setDatabaseType(result.database);
      setIsSubmitSuccess(true);
    } catch (err: any) {
      console.error('Submission error:', err);
      setDbSubmitError(err.message || 'Database connection error. Submission was not recorded.');
    } finally {
      setIsSubmittingToDb(false);
    }
  };

  const copyToClipboard = () => {
    const message = buildReviewText(formik.values, submissionId, databaseType);
    navigator.clipboard.writeText(message);
    setIsCopyNotice(true);
    setTimeout(() => setIsCopyNotice(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-4 px-2 md:px-0 relative">
      {/* Loading Overlay */}
      {isSubmittingToDb && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-sm">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
          <h3 className="text-xl font-bold text-white tracking-wide">Recording Submission</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-xs text-center">Saving your business profile setup parameters to the database...</p>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
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

          {/* Database Submit Error Warning */}
          {dbSubmitError && (
            <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm flex items-start gap-3 max-w-2xl mx-auto">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-300">Database Storage Error: </span>
                {dbSubmitError}
                <p className="text-xs text-rose-400/80 mt-1">Please fix connection credentials in your .env configuration or try again.</p>
              </div>
            </div>
          )}

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
                      <h3 className="text-lg font-bold text-white">Business Details</h3>
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
                      <h3 className="text-lg font-bold text-white">Location Details</h3>
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
                      <h3 className="text-lg font-bold text-white">Contact Details</h3>
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
                            className="w-3.5 h-3.5 rounded border-slate-850 bg-slate-950 text-indigo-650 focus:ring-indigo-500/20 cursor-pointer"
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
                      <h3 className="text-lg font-bold text-white">Email & Account Details</h3>
                      <p className="text-xs text-slate-400">Required credentials to register and configure your Google Business Profile owner portal.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Yes/No Question */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-205 block">Do you already have a Business Gmail Account?</label>
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
                          <Check className={`w-4 h-4 transition-all ${formik.values.hasBusinessGmail ? 'scale-105 opacity-100' : 'scale-0 opacity-0'}`} />
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
                          <Check className={`w-4 h-4 transition-all ${!formik.values.hasBusinessGmail ? 'scale-105 opacity-100' : 'scale-0 opacity-0'}`} />
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

                          {/* Owner Mobile Number */}
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
                              className="bg-slate-950 border border-slate-800 text-slate-100 text-slate-400 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
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
                      <h3 className="text-lg font-bold text-white">Business Photos</h3>
                      <p className="text-xs text-slate-400">Upload business operational photos. Files will upload to Cloudinary if keys are set in your env config.</p>
                    </div>
                  </div>

                  {/* Switch between Shop vs Service */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-205 block">Select your business type:</label>
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
                            {renderMultipleUploadWidget('shopFront', 'Shop Front Photos', 'Front facade showing entry')}
                            
                            {/* Shop Name Board */}
                            {renderMultipleUploadWidget('nameBoard', 'Name Board Photos', 'Clearly visible name board sign')}

                            {/* Billing Counter */}
                            {renderMultipleUploadWidget('billingCounter', 'Billing Counter Photos', 'Reception or point of sale counter')}
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
                      <h3 className="text-lg font-bold text-white">Additional Details</h3>
                      <p className="text-xs text-slate-400">Add logos, social links, and transactional indicators (Optional).</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Business Logo Upload */}
                    <div className="md:col-span-1">
                      {renderMultipleUploadWidget('logo', 'Business Logos', 'Clean logo image square')}
                    </div>

                    {/* Visiting Card Upload */}
                    <div className="md:col-span-1">
                      {renderMultipleUploadWidget('visitingCard', 'Visiting Card Photos', 'Front side of business card')}
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
                      <div className={`mt-0.5 p-1 rounded border transition-colors ${formik.values.upiAvailable ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-700'}`}>
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
                      <div className={`mt-0.5 p-1 rounded border transition-colors ${formik.values.homeDelivery ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-700'}`}>
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
        /* SUCCESS SUBMISSION STATE SCREEN - USER FRIENDLY */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto shadow-2xl transition-all">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Submission Successful!
          </h2>
          <p className="text-slate-300 mt-4 text-sm md:text-base leading-relaxed px-4">
            Thank you for providing your details. Our setup team has successfully received your Google Business Profile onboarding parameters and will begin configuring and optimizing your listing shortly. 
          </p>
          <p className="text-slate-400 mt-2 text-xs leading-relaxed px-4">
            We will contact you if we require any additional clarifications.
          </p>

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => {
                formik.resetForm();
                setMultipleImages({
                  logo: [],
                  visitingCard: [],
                  shopFront: [],
                  nameBoard: [],
                  billingCounter: [],
                  interior: [],
                  productDisplay: [],
                  serviceWork: [],
                  teamWorking: [],
                  beforeAfter: [],
                  equipmentTools: [],
                  workspace: [],
                  customerService: []
                });
                setActiveStep(1);
                setIsSubmitSuccess(false);
              }}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-650 to-indigo-750 hover:from-indigo-650 hover:to-indigo-700 text-white font-bold rounded-xl cursor-pointer transition-all active:scale-[0.98] shadow-md border border-indigo-500/20 text-sm"
            >
              Submit Another Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );

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
