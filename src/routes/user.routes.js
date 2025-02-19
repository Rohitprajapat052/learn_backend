import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import verifyJWT from "../middlewares/auth.middleware.js";
import {
    registerUser,
    loginUser,
    logoutUser,
    changeCurrentPassword, 
    refreshAccessToken,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvtar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory

 } from  "../controllers/user.controller.js";



const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name : "avtar",
            maxCount :1 
        },
        {
            name :"coverImage",
            maxCount :1 
        }
    ]),

    registerUser)


router.route("/login").post(loginUser)



router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").post(verifyJWT, getCurrentUser)

router.route("/update-account").post(verifyJWT, updateAccountDetails)

router.route("/avtar").patch(verifyJWT, upload.single("avtar"), updateUserAvtar)

router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)




export default router