import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


// ================= GEO POINT SCHEMA =================

const pointSchema = new mongoose.Schema(
{
 type:{
  type:String,
  enum:["Point"],
  default:"Point"
 },

 coordinates:{
  type:[Number],
  default:[0,0],

  validate:{
   validator:(v)=>v.length===2,
   message:"Coordinates must be [lng,lat]"
  }
 }

},
{
 _id:false
}
);


// ================= USER SCHEMA =================

const userSchema = new mongoose.Schema({

 // ================= BASIC INFO =================

 name:{
  type:String,
  required:true,
  trim:true,
  minlength:2,
  maxlength:50
 },

 email:{
  type:String,
  required:true,
  unique:true,
  index:true,
  lowercase:true,
  trim:true
 },

 password:{
  type:String,
  required:true,
  minlength:6,
  select:false
 },

 gender:{
  type:String,
  enum:["male","female","other"]
 },

 phoneNumber:{
  type:String,
  required:true,
  unique:true,
  index:true
 },

 role:{
  type:String,
  enum:["rider","driver","admin"],
  required:true,
  index:true
 },



 // ================= PROFILE =================

 avatar:{

  public_id:String,

  url:{
   type:String,
   default:"https://via.placeholder.com/150"
  }

 },


 // ================= STATUS =================

 isOnline:{
  type:Boolean,
  default:false,
  index:true
 },

 lastSeen:{
  type:Date,
  default:null
 },

 isActive:{
  type:Boolean,
  default:true
 },

 isBlocked:{
  type:Boolean,
  default:false
 },


 // ================= CURRENT RIDE =================

 currentRide:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"Ride",
  default:null
 },


 // ================= DRIVER VEHICLE =================

 vehicle:{

  vehicleType:{
   type:String,
   enum:["Car","Bike"],

   required:function(){
    return this.role==="driver";
   }
  },

  model:{
   type:String,

   required:function(){
    return this.role==="driver";
   }
  },

  numberPlate:{
   type:String,

   required:function(){
    return this.role==="driver";
   },

   uppercase:true
  }

 },


 // ================= DRIVER RATING =================

 rating:{
  type:Number,
  default:0,
  min:0,
  max:5
 },


 // ================= DRIVER LOCATION =================

 location:{
  type:pointSchema,

  default:{
   type:"Point",
   coordinates:[0,0]
  }

 },


 // ================= LOCATION HISTORY =================

 locationHistory:[
 {

  location:pointSchema,

  timestamp:{
   type:Date,
   default:Date.now
  }

 }

 ],



 // ================= RIDES =================

 rideHistory:[

 {

  type:mongoose.Schema.Types.ObjectId,

  ref:"Ride"

 }

 ],



 // ================= WALLET =================

 walletBalance:{
  type:Number,
  default:0,
  min:0
 },

 paymentMethods:[

 {
  type:String,

  enum:["cash","card","wallet"]
 }

 ],



 // ================= AUTH =================

 refreshToken:{
  type:String,
  select:false
 },


 resetPasswordToken:String,

 resetPasswordExpire:Date



},
{
 timestamps:true
}
);


// ================= PASSWORD HASH =================

userSchema.pre("save", async function(){

 if(!this.isModified("password")) return;

 this.password = await bcrypt.hash(this.password,12);

});


// ================= PASSWORD COMPARE =================

userSchema.methods.comparePassword =
async function(password){

 return bcrypt.compare(password,this.password);

};



// ================= ACCESS TOKEN =================

userSchema.methods.getAccessToken=function(){

 return jwt.sign(

 {
  id:this._id,
  role:this.role
 },

 process.env.JWT_SECRET,

 {
  expiresIn:
  process.env.ACCESS_TOKEN_EXPIRE || "15m"
 }

 );

};



// ================= REFRESH TOKEN =================

userSchema.methods.getRefreshToken=function(){

 return jwt.sign(

 {
  id:this._id,
  role:this.role
 },

 process.env.REFRESH_TOKEN_SECRET,

 {
  expiresIn:
  process.env.REFRESH_TOKEN_EXPIRE || "7d"
 }

 );

};



// ================= CLEAR TOKEN =================

userSchema.methods.clearRefreshToken=
async function(){

 this.refreshToken=null;

 await this.save({
  validateBeforeSave:false
 });

};



// ================= INDEXES =================

userSchema.index({
 location:"2dsphere"
});


userSchema.index({
 role:1,
 isOnline:1
});



const User =
mongoose.models.User ||
mongoose.model("User",userSchema);


export default User;