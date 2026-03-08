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
  gender: "",
  role: "driver",

  // ✅ MATCHES BACKEND SCHEMA
  vehicle: {
    vehicleType: "",  // <-- change from 'type' to 'vehicleType'
    model: "",
    numberPlate: "",
  },

  avatar: null,
};
// ✅ Form fields configuration

const formFields = [
  { name: "name", type: "text", placeholder: "Name" },

  { name: "email", type: "email", placeholder: "Email" },

  {
    name: "password",
    type: "password",
    placeholder: "Password",
    isPassword: true,
  },

  { name: "phoneNumber", type: "text", placeholder: "Phone Number" },

  {
    name: "gender",
    type: "select",
    placeholder: "Select Gender",
    options: ["male", "female", "other"],
  },

  // ✅ VEHICLE TYPE

  {
    name: "vehicle.type",
    type: "select",
    placeholder: "Vehicle Type",
    options: ["Car", "Bike"],
  },

  // ✅ VEHICLE MODEL

  {
    name: "vehicle.model",
    type: "text",
    placeholder: "Vehicle Model",
  },

  // ✅ NUMBER PLATE

  {
    name: "vehicle.numberPlate",
    type: "text",
    placeholder: "Number Plate",
  },
];

export default function Register() {
  const router = useRouter();

  const [formData, setFormData] = useState(initialFormData);

  const [preview, setPreview] = useState(null);

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  // ✅ UPDATED HANDLE CHANGE

  const handleChange = (e) => {
    const { name, value } = e.target;

    // vehicle nested object

    if (name.startsWith("vehicle.")) {
      const key = name.split(".")[1];

      setFormData((prev) => ({
        ...prev,

        vehicle: {
          ...prev.vehicle,

          [key]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,

        [name]: value,
      }));
    }
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
    try {
      const { signature, timestamp, folder, cloudName, apiKey } = await API.get(
        "/cloudinary/signature",
      )

        .then((res) => res.data);

      const fd = new FormData();

      fd.append("file", file);

      fd.append("api_key", apiKey);

      fd.append("folder", folder);

      fd.append("timestamp", timestamp);

      fd.append("signature", signature);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,

        {
          method: "POST",

          body: fd,
        },
      );

      const data = await res.json();

      return {
        url: data.secure_url,

        public_id: data.public_id,
      };
    } catch (err) {
      toast.error("Image upload failed");

      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    const {
      name,

      email,

      password,

      phoneNumber,

      role,

      avatar,

      vehicle,
    } = formData;

    if (!name || !email || !password || !phoneNumber || !role) {
      toast.warn("Name, email, password, phone number and role are required");

      setLoading(false);

      return;
    }

    // ✅ VEHICLE VALIDATION

    if (!vehicle.type || !vehicle.model || !vehicle.numberPlate) {
      toast.warn("Complete vehicle details required");

      setLoading(false);

      return;
    }

    if (!isPasswordStrong(password)) {
      toast.warn(
        "Password must contain uppercase, lowercase, number & special character",
      );

      setLoading(false);

      return;
    }

    try {
      let avatarData = null;

      if (avatar) avatarData = await uploadToCloudinary(avatar);
      const payload = {

 name: formData.name,

 email: formData.email,

 password: formData.password,

 phoneNumber: formData.phoneNumber,

 gender: formData.gender,

 role: formData.role,

 avatar: avatarData,

 vehicle: {

 vehicleType: formData.vehicle.type,

 model: formData.vehicle.model,

 numberPlate: formData.vehicle.numberPlate

 }

};
      const { data } = await API.post(
        "/register",

        payload,
      );

      toast.success(data.message || "Registration successful!");

      setFormData(initialFormData);

      setPreview(null);

      setTimeout(
        () => router.push("/auth/login"),

        1200,
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-6">
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-center text-2xl font-bold tracking-tight text-white">
          Create Driver Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formFields.map((field) => {
            // SELECT FIELD

            if (field.type === "select") {
              let value = formData[field.name];

              // vehicle nested

              if (field.name.startsWith("vehicle.")) {
                const key = field.name.split(".")[1];

                value = formData.vehicle[key];
              }

              return (
                <select
                  key={field.name}
                  name={field.name}
                  value={value}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-md bg-white/5 px-3 py-2 text-white"
                >
                  <option value="">{field.placeholder}</option>

                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              );
            }

            // INPUT FIELD

            let value = formData[field.name];

            if (field.name.startsWith("vehicle.")) {
              const key = field.name.split(".")[1];

              value = formData.vehicle[key];
            }

            return (
              <div
                key={field.name}
                className={field.isPassword ? "relative" : ""}
              >
                <input
                  type={
                    field.isPassword
                      ? showPassword
                        ? "text"
                        : "password"
                      : field.type
                  }
                  name={field.name}
                  placeholder={field.placeholder}
                  value={value}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-md bg-white/5 px-3 py-2 pr-10 text-white"
                />

                {field.isPassword && (
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-2 text-gray-400"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </button>
                )}
              </div>
            );
          })}

          <label className="flex items-center gap-2 cursor-pointer text-gray-300">
            <CloudUploadIcon />
            Upload Avatar
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
          Already have an account?
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
