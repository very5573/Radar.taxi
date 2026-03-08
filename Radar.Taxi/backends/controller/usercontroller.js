import jwt from "jsonwebtoken"; // ✅ Make sure this is imported
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";

import sendToken from "../utils/jwtToken.js";
import cloudinary from "cloudinary";
import mongoose from "mongoose"; // ES6 import
import { formatUser } from "../utils/formatUser.js";

export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email role createdAt avatar",
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: formatUser(user),
    });
  } catch (err) {
    console.error("❌ Get User Error:", err);
  }
};

// backend/controllers/adminController.js
// backend/controllers/adminController.js

export const getActiveUsers = async (req, res) => {
  try {
    const users = await User.find(); // all users
    const currentUserId = req.user?.id;

    const activeUsers = users.filter(
      (user) => user.isActive || user._id.toString() === currentUserId,
    );
    const blockedUsers = users.filter((user) => user.isBlocked);

    // Mark current user
    const usersWithCurrentFlag = users.map((user) => ({
      ...user.toObject(),
      currentUser: user._id.toString() === currentUserId,
    }));

    res.status(200).json({
      success: true,
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      blockedUsers: blockedUsers.length,
      users: usersWithCurrentFlag,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    console.log("♻️ Refresh Token route hit");

    const cookieRefreshToken = req.cookies?.refreshToken;
    console.log(
      "🍪 Incoming refresh token:",
      cookieRefreshToken ? "Present ✅" : "Missing ❌",
    );

    if (!cookieRefreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    // Decode token to get user ID
    let decoded;
    try {
      decoded = jwt.verify(
        cookieRefreshToken,
        process.env.REFRESH_TOKEN_SECRET,
      );
      console.log("🔐 Refresh token decoded:", decoded);
    } catch (err) {
      console.log("❌ Invalid or expired refresh token");
      return res
        .status(403)
        .json({ success: false, message: "Invalid or expired token" });
    }

    // Fetch user with hashed refresh token
    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user) {
      console.log("⚠️ User not found in DB");
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // ✅ Verify cookie token against hashed DB token
    const isValid = await bcrypt.compare(cookieRefreshToken, user.refreshToken);
    if (!isValid) {
      console.log("❌ Refresh token does not match DB hash");
      return res.status(403).json({ success: false, message: "Invalid token" });
    }

    console.log("✅ Generating new tokens for:", user.email);
    sendToken(user, 200, res);
  } catch (err) {
    console.error("💥 Refresh token error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// us// controllers/userController.js
export const searchUsers = async (req, res) => {
  try {
    const { q, userId } = req.query;

    if (!q || !userId) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      _id: { $ne: userId }, // logged-in user exclude
      $or: [
        { name: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } },
      ],
    })
      .select("name username avatar")
      .limit(10)
      .lean();
    const formattedUsers = users.map((u) => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      avatar: u.avatar || null, // ❗ full object
    }));

    res.status(200).json({ users: formattedUsers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUploadSignature = (req, res) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);

    const signature = cloudinary.v2.utils.api_sign_request(
      { timestamp, folder: "avatars" },
      process.env.CLOUDINARY_API_SECRET,
    );

    return res.status(200).json({
      success: true,
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder: "avatars",
    });
  } catch (err) {
    console.error("❌ Cloudinary Signature Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};









export const registerUser = async (req, res) => {

  console.log("🔥 REGISTER CONTROLLER HIT 🔥");

  try {

    const {
      name,
      email,
      password,
      gender,
      phoneNumber,
      role,
      avatar,
      vehicle
    } = req.body;


    // ========= BASIC VALIDATION =========

    if (!name?.trim() || !email?.trim() || !password || !phoneNumber || !role) {

      return res.status(400).json({
        success:false,
        message:"Required fields missing"
      });

    }



    // ========= DRIVER VALIDATION =========

    if(role==="driver"){

      if(
        !vehicle ||
        !vehicle.vehicleType ||
        !vehicle.model ||
        !vehicle.numberPlate
      ){

        return res.status(400).json({
          success:false,
          message:"Vehicle details required"
        });

      }

    }



    // ========= EMAIL NORMALIZE =========

    const normalizedEmail =
    email.toLowerCase().trim();



    // ========= USER EXISTS =========

    const existingUser =
    await User.findOne({

      email:normalizedEmail

    });


    if(existingUser){

      return res.status(400).json({

        success:false,
        message:"User already exists"

      });

    }



    // ========= CREATE USER =========

    const user =
    await User.create({

      name:name.trim(),

      email:normalizedEmail,

      password,

      gender,

      phoneNumber,

      role,



      avatar:avatar?.url
      ?{
        url:avatar.url,
        public_id:avatar.public_id
      }
      :undefined,



      vehicle:

      role==="driver"
      ?{

        vehicleType:vehicle.vehicleType,

        model:vehicle.model,

        numberPlate:
        vehicle.numberPlate.toUpperCase()

      }
      :undefined,



      location:{

        type:"Point",

        coordinates:[0,0]

      }


    });



    console.log("✅ User Created:",user._id);



    await sendToken(user,201,res);


  }

  catch(err){

    console.log("❌ Register Error:",err);


    res.status(500).json({

      success:false,

      message:err.message

    });

  }

};





export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Validate fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter Email & Password",
      });
    }

    // ✅ Find user with password
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ✅ Compare password
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ✅ Send token + response (without notification)
    sendToken(user, 200, res, "Login successful");
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === "production";

    // 🔹 1️⃣ Get refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      try {
        // 🔹 2️⃣ Verify refresh token
        const decoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET,
        );

        // 🔹 3️⃣ Find user & clear refresh token from DB
        const user = await User.findById(decoded.id);
        if (user) {
          await user.clearRefreshToken(); // ✅ model method
        }
      } catch (err) {
        // ❌ Invalid / expired refresh token → ignore
      }
    }

    // 🔹 4️⃣ Clear cookies (always)
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      path: "/",
    });

    // 🔹 5️⃣ Response
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    // Optional: handle invalid MongoDB ID
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(userId)
      .select("-password -refreshToken") // remove sensitive fields
      .populate({
        path: "posts",
        options: { sort: { createdAt: -1 }, limit: 20 }, // latest 20 posts
        select: "caption images createdAt likes comments", // only necessary fields
      })
      .populate({
        path: "bookmarks",
        select: "caption images createdAt",
      })
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Shape response for frontend
    const responseUser = {
      _id: user._id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      followers: user.followers?.length || 0,
      following: user.following?.length || 0,
      posts: user.posts || [],
      bookmarks: user.bookmarks || [],
    };

    return res.status(200).json({
      success: true,
      user: responseUser,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
    if (!isPasswordMatched) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    // ============================================
    // ✅ UNIVERSAL PASSWORD UPDATE NOTIFICATION
    // ============================================

    // ✅ Send token
    sendToken(user, 200, res, "Password updated successfully");
  } catch (err) {
    console.error("❌ Update Password Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const editProfile = async (req, res) => {
  try {
    const userId = req.id; // from auth middleware
    const { bio, gender, profilePictureUrl } = req.body;
    // profilePictureUrl: frontend se direct Cloudinary URL

    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (bio) user.bio = bio;
    if (gender) user.gender = gender;
    if (profilePictureUrl) user.profilePicture = profilePictureUrl;

    await user.save();

    // Shape response
    const responseUser = {
      _id: user._id,
      username: user.username,
      name: user.name,
      bio: user.bio,
      gender: user.gender,
      avatar: user.profilePicture,
      followers: user.followers?.length || 0,
      following: user.following?.length || 0,
    };

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: responseUser,
    });
  } catch (err) {
    console.error("❌ Edit Profile Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.id;
    const LIMIT = 10;

    // Step 1: Get current user's following list
    const currentUser = await User.findById(userId).select("following").lean();

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found.",
      });
    }

    const followingIds = currentUser.following || [];

    // Step 2: Aggregate users
    // Exclude current user & users already followed
    const suggestedUsers = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId, $nin: followingIds },
        },
      },
      {
        // Add a field counting mutual followers with current user
        $addFields: {
          mutualFollowers: {
            $size: {
              $setIntersection: ["$followers", followingIds],
            },
          },
        },
      },
      { $sort: { mutualFollowers: -1, createdAt: -1 } }, // prioritize mutual followers then recent
      { $limit: LIMIT },
      { $project: { password: 0, refreshToken: 0, email: 0 } }, // exclude sensitive fields
    ]);

    if (!suggestedUsers || suggestedUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No suggested users available at the moment.",
      });
    }

    return res.status(200).json({
      success: true,
      users: suggestedUsers,
    });
  } catch (error) {
    console.error("❌ Get Suggested Users Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const followOrUnfollow = async (req, res) => {
  const session = await mongoose.startSession(); // for transaction (if replica set)
  session.startTransaction();
  try {
    const followerId = req.id; // currently logged in user
    const targetId = req.params.id; // user to follow/unfollow

    if (followerId === targetId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow/unfollow yourself.",
      });
    }

    const [user, targetUser] = await Promise.all([
      User.findById(followerId).select("following"),
      User.findById(targetId).select("followers"),
    ]);

    if (!user || !targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isFollowing = user.following.includes(targetId);

    if (isFollowing) {
      // unfollow
      await Promise.all([
        User.updateOne(
          { _id: followerId },
          { $pull: { following: targetId } },
          { session },
        ),
        User.updateOne(
          { _id: targetId },
          { $pull: { followers: followerId } },
          { session },
        ),
      ]);
      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "Unfollowed successfully",
        followingCount: user.following.length - 1,
        followersCount: targetUser.followers.length - 1,
      });
    } else {
      // follow
      await Promise.all([
        User.updateOne(
          { _id: followerId },
          { $push: { following: targetId } },
          { session },
        ),
        User.updateOne(
          { _id: targetId },
          { $push: { followers: followerId } },
          { session },
        ),
      ]);
      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "Followed successfully",
        followingCount: user.following.length + 1,
        followersCount: targetUser.followers.length + 1,
      });
    }
  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Follow/Unfollow Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  } finally {
    session.endSession();
  }
};

export const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate ObjectId (best practice)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // ✅ Find user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User does not exist with ID: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("Error fetching single user:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

// Update
// Update User Role

// Update User Role -- Admin

export const updateProfile = async (req, res) => {
  try {
    const { name, email, avatar } = req.body; // avatar = { url, public_id }

    // ✅ Auth middleware से req.user.id आना चाहिए
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // ✅ Email update check (case insensitive)
    if (email && email.toLowerCase().trim() !== user.email) {
      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email already in use" });
      }
      user.email = email.toLowerCase().trim();
    }

    // ✅ Name update
    if (name) user.name = name.trim();

    // ✅ Avatar update
    if (avatar && avatar.url && avatar.public_id) {
      // पुराना avatar delete करो अगर है तो
      if (user.avatar?.public_id) {
        try {
          await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        } catch (err) {
          console.warn("⚠️ Failed to delete old avatar:", err.message);
        }
      }
      user.avatar = { url: avatar.url, public_id: avatar.public_id };
    }

    await user.save();

    // ✅ Success response (अगर JWT payload में info है तो नया token भेजो)
    sendToken(user, 200, res, "Profile updated successfully");
  } catch (err) {
    console.error("❌ UpdateProfile Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: err.message,
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate ObjectId (best practice)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // ✅ Prepare new user data
    const newUserData = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
    };

    // ✅ Update user
    const updatedUser = await User.findByIdAndUpdate(id, newUserData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: `User not found with ID: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user role:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

// Get All Users
export const getAllUser = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete User -- Admin
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate ObjectId (best practice)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // ✅ Find user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User does not exist with ID: ${id}`,
      });
    }

    // ✅ Delete Cloudinary avatar if exists
    const imageId = user.avatar?.public_id;
    if (imageId) {
      await cloudinary.v2.uploader.destroy(imageId);
    }

    // ✅ Delete user from MongoDB
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
