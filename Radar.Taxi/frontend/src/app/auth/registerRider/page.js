"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import API from "../../../utils/axiosInstance";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CircularProgress from "@mui/material/CircularProgress";

const initialFormData = {
  name: "",
  email: "",
  password: "",
  phoneNumber: "",
  avatar: null,
};

// ✅ Input fields configuration
const inputFields = [
  { name: "name", type: "text", placeholder: "Name" },
  { name: "email", type: "email", placeholder: "Email" },
  { name: "phoneNumber", type: "text", placeholder: "Phone Number" },
  { name: "password", type: "password", placeholder: "Password", isPassword: true },
];

export default function RegisterRider() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormData);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.warn("Only JPG/PNG allowed");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.warn("File size must be < 10MB");
      return;
    }

    setFormData((prev) => ({ ...prev, avatar: file }));
    setPreview(URL.createObjectURL(file));
  };

  const isPasswordStrong = (pwd) =>
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(pwd);

  const uploadToCloudinary = async (file) => {
    const { signature, timestamp, folder, cloudName, apiKey } =
      await API.get("/cloudinary/signature").then((res) => res.data);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", apiKey);
    fd.append("folder", folder);
    fd.append("timestamp", timestamp);
    fd.append("signature", signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: fd }
    );

    const data = await res.json();
    return { url: data.secure_url, public_id: data.public_id };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { name, email, password, phoneNumber, avatar } = formData;

    if (!name || !email || !password || !phoneNumber) {
      toast.warn("All fields are required");
      setLoading(false);
      return;
    }

    if (!isPasswordStrong(password)) {
      toast.warn(
        "Password must contain uppercase, lowercase, number & special character"
      );
      setLoading(false);
      return;
    }

    try {
      let avatarData = null;
      if (avatar) avatarData = await uploadToCloudinary(avatar);

      const { data } = await API.post("/register", {
        name,
        email,
        password,
        phoneNumber,
        role: "rider",
        avatar: avatarData,
      });

      toast.success(data.message || "Registration successful!");
      setFormData(initialFormData);
      setPreview(null);

      setTimeout(() => {
        router.push("/auth/login");
      }, 1200);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-6">
      <div className="w-full max-w-sm space-y-8">
        <h2 className="text-center text-2xl font-bold tracking-tight text-white">
          Create your Rider account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {inputFields.map(({ name, type, placeholder, isPassword }) => (
            <div key={name} className={isPassword ? "relative" : ""}>
              <input
                type={isPassword ? (showPassword ? "text" : "password") : type}
                name={name}
                placeholder={placeholder}
                value={formData[name]}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-md bg-white/5 px-3 py-2 pr-10 text-white"
              />
              {isPassword && (
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-2 text-gray-400"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </button>
              )}
            </div>
          ))}

          {/* Avatar */}
          <label className="flex items-center gap-2 cursor-pointer text-gray-300">
            <CloudUploadIcon /> Upload Avatar
            <input type="file" onChange={handleFileChange} hidden />
          </label>

          {preview && (
            <img
              src={preview}
              alt="preview"
              className="h-20 w-20 rounded-full"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-500 py-2 text-white flex items-center justify-center gap-2"
          >
            {loading && <CircularProgress size={20} color="inherit" />}
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/auth/login")}
            className="cursor-pointer text-indigo-400"
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}