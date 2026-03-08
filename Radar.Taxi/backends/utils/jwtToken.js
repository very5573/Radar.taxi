import { formatUser } from "../utils/formatUser.js";
import bcrypt from "bcryptjs";

const sendToken = async (user, statusCode, res) => {
  try {
    const accessToken = user.getAccessToken();
    const refreshToken = user.getRefreshToken();

    // Hash refresh token for DB
    user.refreshToken = await bcrypt.hash(refreshToken, 12);
    await user.save({ validateBeforeSave: false });
    const isLocal = process.env.NODE_ENV !== "production";

    const isProduction = process.env.NODE_ENV === "production";
    const isSecure =
      isProduction && process.env.FRONTEND_URL.startsWith("https");

    const cookieOptions = (expiresIn) => ({
      expires: new Date(Date.now() + expiresIn),
      httpOnly: true,
      secure: isSecure, // ✅ HTTPS only if production
      sameSite: isSecure ? "None" : "Lax", // ✅ cross-domain prod, lax local
      path: "/",
    });

    res
      .status(statusCode)
      .cookie("accessToken", accessToken, cookieOptions(15 * 60 * 1000)) // 15 min
      .cookie(
        "refreshToken",
        refreshToken,
        cookieOptions(7 * 24 * 60 * 60 * 1000),
      ) // 7 days
      .json({ success: true, user: formatUser(user) });

    console.log(`✅ Tokens sent for user: ${user.email}`);
    if (!isProduction) {
      console.log("🔐 Access Token:", accessToken);
      console.log("🔐 Refresh Token:", refreshToken);
    }
  } catch (err) {
    console.error("💥 sendToken error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export default sendToken;
