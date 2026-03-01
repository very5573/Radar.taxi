import express from "express";

import {
  registerUser,
  loginUser,
  logout,
  refreshToken,
  getUserDetails,
  getProfile,
  editProfile,
  updateProfile,
  updatePassword,
  getSuggestedUsers,
  followOrUnfollow,
  getSingleUser,
  getAllUser,
  updateUserRole,
  deleteUser,
  getActiveUsers,
  getUploadSignature,
  searchUsers
} from "../controller/usercontroller.js";

import {
  isAuthenticatedUser,
  authorizeRoles,
} from "../middleware/auth.js";

const router = express.Router();

/* =========================
   AUTH ROUTES
========================= */

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", isAuthenticatedUser, logout);
router.get("/refresh-token", refreshToken);
router.get("/search", isAuthenticatedUser, searchUsers);

/* =========================
   USER SELF ROUTES
========================= */

router.get("/me", isAuthenticatedUser, getUserDetails);
router.put("/password/update", isAuthenticatedUser, updatePassword);
router.put("/profile/update", isAuthenticatedUser, updateProfile);
router.put("/profile/edit", isAuthenticatedUser, editProfile);


router.get("/profile/:id", isAuthenticatedUser, getProfile);
router.get("/suggested", isAuthenticatedUser, getSuggestedUsers);
router.put("/follow/:id", isAuthenticatedUser, followOrUnfollow);

/* =========================
   CLOUDINARY
========================= */

router.get(
  "/cloudinary/signature",
  getUploadSignature
);

/* =========================
   ADMIN ROUTES
========================= */

router.get(
  "/admin/users",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  getAllUser
);

router.get(
  "/admin/active-users",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  getActiveUsers
);

router
  .route("/admin/user/:id")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getSingleUser)
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateUserRole)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

export default router;
