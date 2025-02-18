import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {uploadOnCloudinary } from "../utils/cloudinary.js"
import  {ApiResponse} from "../utils/ApiResponse.js"
import User from "../models/user.model.js"
import jwt from "jsonwebtoken"

const generateRefreshTokenAndAccessToken =  async (userId) =>{
     try {
             const user = await User.findById(userId)
             const refreshToken  = await user.generateRefreshToken()
             const accessToken = await user.generateAccessToken()

             user.refreshToken = refreshToken;
            await user.save({validateBeforeSave : false})
             return {refreshToken , accessToken}

        
     } catch (error) {
            throw new ApiError(500, "Err in generating RefreshToken and AccessToken")
     }
}


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

const loginUser = asyncHandler(async(req, res) => {
         //take data from req.body
         // check username or email already exist
         //find the user
         //check password
         //set refreshToken and accessToken
         //send cookie

         const {username , email, password } = req.body 

         if(!(username || email)) {
            throw new ApiError(404, "Username or Email is required ")
         }

         const user = await User.findOne({
            $or : [{email},{username}]
         })

         const isPasswordValid = await user.isPasswordCorrect(password);

         if(!isPasswordValid){
            throw new ApiError(401, "Invalid Credentials")
         }


           const {accessToken, refreshToken} = await generateRefreshTokenAndAccessToken(user._id)
           
           const loggedInUser  = await User.findById(user._id).select("-password -refreshToken")
           
            const options = {
                httpOnly : true,
                secure : true
        }

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user : loggedInUser,accessToken,
                    refreshToken
                },
                "User Logged In Successfully"
            )
        )
       



})

const logoutUser = asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
        $set : {
                  refreshToken : undefined
        }
    },
    {
        new : true
    }
)

   const options = {
    httpOnly : true,
    secure : true
   }

   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200, "User Logged Out Successfully"))
    
})

const refreshAccessToken = asyncHandler ( async(req ,res)=>{
     
      const refreshIncomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken 

      if(!incomingRefreshToken){
         throw new ApiError(401, "Unauthorized Request")
      }
     
    try {
         const decodedToken =  jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
         )
          
         const user = await User.findById(decodedToken?._id)
        
          if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
          }
    
    
          if(incomingRefreshTOken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token Is Expired or Used ")
          }
    
           const options = {
             httpOnly : true, 
             secure : true
           }
    
        const {accessToken, newRefreshToken } = await generateRefreshTokenAndAccessToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken" , accessToken, options)
        .cookie("refreshToken" , newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken : newRefreshToken},
                "Access Token Refreshed"
    
            )
        )
    } catch (error) {

         throw new ApiError(401 , error?.message || "Invalid Refresh Token")
    }
    
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword , newPassword} = req.body
    
    const user = await User.findById(req.user._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword

    await user.save({validateBeforeSave:false})

    return res
    
})

const getCurrentUser = asyncHandler ( async(req, res)=>{
      return res
      .status(200)
      .json(200, req.user._id , "Current User Fetched Successfully")

})

const  updateAccountDetails = asyncHandler(async(req, res)=>{
    const { fullName, email} = req.body

    if(!fullName || !email) {
             throw new ApiError(400 , "All fields are required")
    }

     const user = await User.findByIdAndUpdate(
        req.user._id,
        {
             $set : {
                fullName ,
                email : email, // both are same work

             }
        },
        {new : true}

    ).select("-password")

    return res 
    .status(200)
    .json(new ApiResponse(200, user, "Account Details Updated Successfully "))
})


const updateUserAvtar = asyncHandler(async(req, res) =>{
    
  const avtarLocalPath = req.file?.path

  if(!avtarLocalPath){
    throw new ApiError(400, "Avtar file is missing")
  }

  const avtar = await uploadOnCloudinary(avtarLocalPath)


if(!avtar.url){
    throw new ApiError(400, "Avtar while uploading avtar")
  }

await User.findByIdAndUpdate(
    req.user?._id ,
    {
         $set : {
            avtar : avtar.url
         }
    },
    {new : true}
).select("-password")

})


const updateUserCoverImage = asyncHandler(async(req, res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400 , "Cover image is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    if(!coverImage.url)
     {
        throw new ApiError(400 , "Err :Cover  on image uploading")
     }

    const user=  await User.findByIdAndUpdate(
        req.user._id,
        {
                $set : {
                    coverImage : coverImage.url
                }
        },
        {
            new : true
        }

     ).select("-password")

     return res
     .status(200)
     .json(
         new ApiResponse(200, user, "Cover Image updated successfully")
     )
})


export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvtar,
    updateUserCoverImage
}

