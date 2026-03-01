// models/Ride.js
import mongoose from "mongoose";

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Point"],
    required: true,
    default: "Point",
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
  },
});

const rideSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // now points to User model with role: "driver"
      default: null,
    },
    pickupLocation: {
      type: pointSchema,
      required: true,
    },
    dropoffLocation: {
      type: pointSchema,
      required: true,
    },
    fare: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "ongoing", "completed", "cancelled", "rejected"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    cancelledBy: {
      type: String,
      enum: ["user", "driver", null],
      default: null,
    },
  },
  { timestamps: true }
);

// Index for geo queries (nearest driver search)
rideSchema.index({ pickupLocation: "2dsphere" });
rideSchema.index({ dropoffLocation: "2dsphere" });

const Ride = mongoose.models.Ride || mongoose.model("Ride", rideSchema);
export default Ride;