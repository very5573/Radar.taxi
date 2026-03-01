// paymentController.js
import Payment from "../models/payment.model.js";
import Ride from "../models/ride.model.js";
import ApiError from "../utils/ApiError.js";

// ===== Service logic included in same file =====

// 1️⃣ Initiate Payment
const initiatePaymentService = async (userId, rideId, amount) => {
  const ride = await Ride.findById(rideId);
  if (!ride) throw new ApiError(404, "Ride not found");

  const payment = await Payment.create({
    ride: rideId,
    user: userId,
    amount,
    provider: "stripe",
    status: "pending",
  });

  // Yaha Stripe payment intent create hota (real integration me Stripe SDK use hoga)

  return payment;
};

// 2️⃣ Verify Payment
const verifyPaymentService = async (paymentId, transactionId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, "Payment not found");

  payment.status = "success";
  payment.transactionId = transactionId;
  await payment.save();

  // Ride update
  await Ride.findByIdAndUpdate(payment.ride, { paymentStatus: "paid" });

  return payment;
};

// 3️⃣ Refund Payment
const refundPaymentService = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, "Payment not found");

  if (payment.status !== "success") throw new ApiError(400, "Cannot refund this payment");

  payment.status = "refunded";
  await payment.save();

  await Ride.findByIdAndUpdate(payment.ride, { paymentStatus: "failed" });

  return payment;
};

// ===== Controller functions using service logic =====

export const initiatePayment = async (req, res, next) => {
  try {
    const payment = await initiatePaymentService(req.user.id, req.body.rideId, req.body.amount);
    res.status(201).json({
      success: true,
      message: "Payment initiated",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const payment = await verifyPaymentService(req.body.paymentId, req.body.transactionId);
    res.status(200).json({
      success: true,
      message: "Payment verified",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

export const refundPayment = async (req, res, next) => {
  try {
    const payment = await refundPaymentService(req.params.paymentId);
    res.status(200).json({
      success: true,
      message: "Refund processed",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};