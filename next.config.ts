import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.VITE_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
    NEXT_PUBLIC_CLOUDINARY_FOLDER: process.env.VITE_CLOUDINARY_FOLDER || process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "",
  }
};

export default nextConfig;
