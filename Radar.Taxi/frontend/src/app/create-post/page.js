"use client"; // Next.js 13+ App Router

import { useState } from "react";
import API from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddPost = () => {
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // 1️⃣ Get Cloudinary signature from backend
  const getSignature = async () => {
    try {
      const res = await API.get("/cloudinary/signature"); 
      return res.data;
    } catch (err) {
      console.error("Signature Error:", err);
      toast.error("Failed to get upload signature.");
    }
  };

  // 2️⃣ Upload image to Cloudinary using signature
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);

    const signatureData = await getSignature();
    if (!signatureData) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signatureData.apiKey);
    formData.append("timestamp", signatureData.timestamp);
    formData.append("signature", signatureData.signature);
    formData.append("folder", signatureData.folder);

    try {
      setLoading(true);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        toast.success("Image uploaded successfully!");
      } else {
        toast.error("Cloudinary upload failed.");
      }
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
      toast.error("Failed to upload image.");
    } finally {
      setLoading(false);
    }
  };

  // 3️⃣ Submit post to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageUrl) {
      toast.error("Please upload an image first.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/post", { caption, imageUrl });

      if (res.data.success) {
        setCaption("");
        setImageFile(null);
        setImageUrl("");
        toast.success("Post created successfully!");
      } else {
        toast.error(res.data.message || "Failed to create post.");
      }
    } catch (err) {
      console.error("Add Post Error:", err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded shadow">
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="What's on your mind?"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="mb-2"
        />
        {imageUrl && (
          <div className="mb-2">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full max-h-64 object-cover rounded"
            />
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
};

export default AddPost;
