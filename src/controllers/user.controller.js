import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {uploadOnCloudinary } from "../utils/cloudinary.js"
import  {ApiResponse} from "../utils/ApiResponse.js"
import User from "../models/user.model.js"

const registerUser = asyncHandler( async (req, res)=> {
     //get user details from frontend
     // validation - not empty
     //check if user already exists : username , email
     //check for images , check for avtar
     // upload them to cloudinary , avtar
     //create user object - create entry in db
     //remove password and refresh token from response 
     // check user creation 
     // return res 
      
     const { username ,fullName , email , password} = req.body 
       

     if(
         [username , fullName , email , password].some((field) => 
           field?.trim() === "")
      ){
           throw new ApiError(400, "All fields are required ")
     }

    const existedUser = await User.findOne({
        $or : [{ username}, {email}]
    }) 

    if(existedUser){
       throw new ApiError(409, "User with email or username already exists")
    }

    //req.files ka access deta h multer 
    const avtarLocalPath = req.files?.avtar[0]?.path ;
    // const coverImagePath = req.files?.coverImage[0]?.path ;
    
    let coverImagePath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0 ){
        coverImagePath = req.files.coverImage[0].path
    }

    if(!avtarLocalPath){
        throw new ApiError(400, "Avtar Local path is required ")
       }

       const avtar = await uploadOnCloudinary(avtarLocalPath)
       const coverImage = await uploadOnCloudinary(coverImagePath)

      
     
       if(!avtar){
           throw new ApiError(400, " Avtar file is required")
       }


 const user = await User.create({
       fullName,
       email,
       password,
       username : username.toLowerCase(),
       avtar : avtar.url,
       coverImage : coverImage?.url || ""
   })

 const createdUser = await User.findById(user._id).select(
     "-password -refreshToken "
 )
            
 if(!createdUser){
   throw new ApiError(500, "Something went wrong while creating the user ")
 }
   
return res.status(201).json(
   new ApiResponse(200, createdUser, "User Registered Successfully")
)




})


export { 
    registerUser
}

