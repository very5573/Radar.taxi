"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import API from "../../../utils/axiosInstance";
import {
  TextField,
  Button,
  CircularProgress,
  Typography,
  Box,
  IconButton,
  InputAdornment,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function UpdatePassword() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // State to toggle visibility
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    try {
      setLoading(true);

      await API.put(
        "/password/update",
        { oldPassword, newPassword, confirmPassword },
        { withCredentials: true }
      );

      toast.success("✅ Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // 🔥 Navigate to login after password update
      router.push("/auth/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "❌ Error updating password");
    } finally {
      setLoading(false);
    }
  };

  // Password fields config
  const passwordFields = [
    {
      label: "Old Password",
      value: oldPassword,
      setter: setOldPassword,
      show: showOld,
      toggle: () => setShowOld(!showOld),
    },
    {
      label: "New Password",
      value: newPassword,
      setter: setNewPassword,
      show: showNew,
      toggle: () => setShowNew(!showNew),
    },
    {
      label: "Confirm Password",
      value: confirmPassword,
      setter: setConfirmPassword,
      show: showConfirm,
      toggle: () => setShowConfirm(!showConfirm),
    },
  ];

  return (
    <Box className="min-h-screen flex justify-center items-start bg-gray-50 py-10 px-4">
      <Box
        component="form"
        onSubmit={handleUpdate}
        className="w-full max-w-md bg-white p-6 rounded-xl shadow-lg flex flex-col gap-4"
      >
        <Typography
          variant="h5"
          className="text-gray-800 font-bold text-center"
        >
          Update Password
        </Typography>

        {/* Render password fields with show/hide toggle */}
        {passwordFields.map((field) => (
          <TextField
            key={field.label}
            type={field.show ? "text" : "password"}
            label={field.label}
            fullWidth
            value={field.value}
            onChange={(e) => field.setter(e.target.value)}
            required
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={field.toggle} edge="end">
                    {field.show ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        ))}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
          className="mt-2"
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Update Password"}
        </Button>
      </Box>
    </Box>
  );
}
