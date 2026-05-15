"use server";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImageAction(base64Data: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Fallback to Base64 if Cloudinary is not configured
  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("[uploadAction] Cloudinary credentials missing — falling back to Base64 storage");
    return {
      success: true,
      url: base64Data, // Data URL works as a src for img tags
      isFallback: true
    };
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(base64Data, {
      folder: "revision-master/editor-uploads",
    });

    return {
      success: true,
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    };
  } catch (error: any) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload image to Cloudinary",
    };
  }
}
