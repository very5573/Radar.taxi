import express from "express";

import {
  requestRide,
  getAvailableRides,
  cancelRide,
  getRideHistory,
  getRideDetails
} from "../controller/rideController.js";

import { isAuthenticatedUser } from "../middleware/auth.js";

const router = express.Router();

// ======================
// 1️⃣ Request a Ride
// ======================

router.post("/request", isAuthenticatedUser, requestRide);

router.get(
  "/ride/:rideId",

  isAuthenticatedUser,

  getRideDetails,
);
// ======================
// 2️⃣ Get Available Rides
// ======================
router.get("/available", isAuthenticatedUser, getAvailableRides);

// ======================
// 3️⃣ Cancel Ride
// ======================
router.put("/cancel/:rideId", isAuthenticatedUser, cancelRide);

// ======================
// 4️⃣ Ride History
// ======================
router.get("/history", isAuthenticatedUser, getRideHistory);

export default router;
