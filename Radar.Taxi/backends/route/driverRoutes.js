import express from "express";
import {
  getDriverProfile,
  acceptRide,
  rejectRide,
  getDriverRideHistory,
  getDriverDashboard
} from "../controller/driverController.js";

import { authorizeRoles, isAuthenticatedUser } from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/dashboard",
  isAuthenticatedUser,
  authorizeRoles("driver"),
  getDriverDashboard
);

router.get(
  "/profile",
  isAuthenticatedUser,
  authorizeRoles("driver"),
  getDriverProfile
);

router.patch(
  "/accept-ride/:rideId",
  isAuthenticatedUser,
  authorizeRoles("driver"),
  acceptRide
);

router.patch(
  "/reject-ride/:rideId",
  isAuthenticatedUser,
  authorizeRoles("driver"),
  rejectRide
);

router.get(
  "/ride-history",
  isAuthenticatedUser,
  authorizeRoles("driver"),
  getDriverRideHistory
);

export default router;