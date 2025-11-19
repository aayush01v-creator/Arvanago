// utils/uploadToImgBB.ts
const IMGBB_KEY = import.meta.env.VITE_IMGBB_KEY as string | undefined;

export async function uploadToImgBB(file: File): Promise<string> {
  if (!IMGBB_KEY) {
    throw new Error("VITE_IMGBB_KEY is missing. Check env vars on Vercel and .env.local.");
  }

  const formData = new FormData();
  formData.append("image", file); // raw file is fine

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!data.success) {
    console.error("ImgBB error:", data);
    throw new Error("ImgBB upload failed");
  }

  // You can also use data.data.url or data.data.image.url
  return data.data.display_url as string;
}
