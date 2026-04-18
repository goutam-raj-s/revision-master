import crypto from "crypto";

/**
 * Delete a Cloudinary asset by its public_id.
 * Uses the signed Destroy API so it works for any resource_type.
 * Server-side only — requires CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.
 */
export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("[cloudinary] Missing env vars — skipping asset deletion");
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000);

  // Signature: SHA1(`public_id={id}&timestamp={ts}{apiSecret}`)
  const signaturePayload = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto
    .createHash("sha1")
    .update(signaturePayload)
    .digest("hex");

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
    invalidate: "true",
  });

  // Use /auto/destroy so it works for images, audio (raw), video, and PDFs
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/destroy`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[cloudinary] Destroy failed (${res.status}):`, text);
    }
  } catch (err) {
    console.error("[cloudinary] Destroy request threw:", err);
  }
}
