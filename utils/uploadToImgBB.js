// utils/uploadToImgBB.ts
const IMGBB_KEY = import.meta.env.VITE_IMGBB_KEY as string | undefined;

export async function uploadToImgBB(file: File): Promise<string> {
  if (!IMGBB_KEY) {
    throw new Error("VITE_IMGBB_KEY is missing. Check your env vars.");
  }

  const formData = new FormData();
  formData.append("image", file); // raw file, ImgBB supports this

  const res = await fetch(
    `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  if (!data.success) {
    console.error("ImgBB error:", data);
    throw new Error("ImgBB upload failed");
  }

  // choose whichever you like; display_url is usually fine
  return data.data.display_url as string;
}
