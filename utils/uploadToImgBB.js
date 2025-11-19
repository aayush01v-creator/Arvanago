// src/utils/uploadToImgBB.js
const IMGBB_KEY = process.env.REACT_APP_IMGBB_KEY;

export async function uploadToImgBB(file) {
  if (!IMGBB_KEY) {
    throw new Error("ImgBB key missing. Check REACT_APP_IMGBB_KEY.");
  }

  const formData = new FormData();
  formData.append("image", file); // raw file, no base64 needed

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

  // You can also use data.data.url or data.data.image.url
  return data.data.display_url;
}
