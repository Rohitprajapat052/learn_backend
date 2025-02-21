import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"




const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
// 1. Validate `title`, `description`, and file paths.  
// 2. Upload video and thumbnail to Cloudinary.  
// 3. Save video details in the database.  
// 4. Verify upload and return a success response.

    if([title ,description].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required ")
    }

    const videoFilePath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "videoFileLocalPath is required");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnailLocalPath is required");
    }

    const videoFile = await uploadOnCloudinary(videoFilePath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

      


if (!videoFile) {
    throw new ApiError(400, "Video file not found");
}

if (!thumbnail) {
    throw new ApiError(400, "Thumbnail not found");
}

const video  = await Video.create({
    title, 
    description,
    duration : videoFile.duration,
    videoFile : {
        url : videoFile.url,
        public_id : videoFile.public_id
    },
    thumbnail : {
        url : thumbnail.url,
        public_url : thumbnail.public_id
    },
    owner : req.user?._id,
    isPublished: false
})

const videoUploaded = await Video.findById(video._id);

if (!videoUploaded) {
    throw new ApiError(500, "videoUpload failed please try again !!!");
}
return res
.status(200)
.json(new ApiResponse(200, video, "Video uploaded successfully"));

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
//TODO: update video details like title, description, thumbnail
    
//  Validate videoId, title, and description.
// Check if the video exists.
// Verify the user owns the video.
// Upload a new thumbnail to Cloudinary.
// Update the video in the database.
// Delete the old thumbnail from Cloudinary.
// Return the updated video.

    
    const {title, description } = req.body
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    if (!(title && description)) {
        throw new ApiError(400, "title and description are required");
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "You can't edit this video as you are not the owner"
        );
    }

     const thumbnailToDelete = video.thumbnail.public_Id;


     const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new ApiError(400, "thumbnail not found");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: {
                    public_id: thumbnail.public_id,
                    url: thumbnail.url
                }
            }
        },
        { new: true }
    );

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video please try again");
    }

    if (updatedVideo) {
        await deleteOnCloudinary(thumbnailToDelete);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});



const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
//TODO: delete video
// 1. Validate `videoId` and check if the video exists.  
// 2. Ensure only the owner can delete the video.  
// 3. Delete the video from the database.  
// 4. Remove the video and thumbnail from Cloudinary.  
// 5. Delete related likes and comments.  
// 6. Return a success response.

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "You can't delete this video as you are not the owner"
        );
    }

    const videoDeleted = await Video.findByIdAndDelete(video?._id);

    if (!videoDeleted) {
        throw new ApiError(400, "Failed to delete the video please try again");
    }

    await deleteOnCloudinary(video.thumbnail.public_id); // video model has thumbnail public_id stored in it->check videoModel
    await deleteOnCloudinary(video.videoFile.public_id, "video"); // specify video while deleting video

    // delete video likes
    await Like.deleteMany({
        video: videoId
    })

     // delete video comments
    await Comment.deleteMany({
        video: videoId,
    })
    
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

//  1. Validate `videoId` and check if the video exists.  
// 2. Ensure only the owner can toggle the publish status.  
// 3. Update `isPublished` by flipping its value.  
// 4. Return the updated status in the response.

     if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId");

     }

     const video = await Video.findById(videoId)

     if(!video){
        throw new ApiError(400,"Video not found ");

     }

     if(video?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(
            400,
            "You can't toogle publish status as you are not the owner"
        );
     }

     const togglePublishedVideo =  await Video.findByIdAndUpdate(
        video._id,
        {
            $set : {
                 isPublished   : !video?.isPublished
            }
        },
        {new : true}
     )

return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: toggledVideoPublish.isPublished },
                "Video publish toggled successfully"
            )
        );
});




const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
 //TODO: get video by id
 // Validate IDs – Checks if videoId and the logged-in user's ID are valid.
 // Find Video – Searches for the video using videoId.
 // Get Likes – Fetches likes associated with the video.
 // Get Owner Info – Retrieves the video's owner details, including subscriber count and subscription status.
 // Count Likes – Calculates the total likes on the video.
 // Check If Liked – Determines if the logged-in user has liked the video.
 // Increment Views – Increases the view count for the video.
 // Update Watch History – Adds the video to the user's watch history.
 // Send Response – Returns the video details in the response.

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(400, "Invalid userId");
    }
    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user?._id,
                                            "$subscribers.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likes.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                "videoFile.url": 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
            }
        }
    ]);

    if (!video) {
        throw new ApiError(500, "failed to fetch video");
    }

    // increment views if video fetched successfully
    await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1
        }
    });

    // add this video to user watch history
    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: videoId
        }
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, video[0], "video details fetched successfully")
        );
});

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
//  Extracts query parameters.
// Uses MongoDB aggregation for efficient filtering.
// Implements full-text search on title and description.
// Filters videos by userId (if provided).
// Ensures only published videos are fetched.
// Allows sorting by views, createdAt, or duration.
// Joins the users collection to get the owner's details.
// Uses MongoDB pagination for better performance.
// Sends the final list of videos as a JSON response.
   // for using Full Text based search u need to create a search index in mongoDB atlas
    // you can include field mapppings in search index eg.title, description, as well
    // Field mappings specify which fields within your documents should be indexed for text search.
    // this helps in seraching only in title, desc providing faster search results
    // here the name of search index is 'search-videos'

const pipeline = [];

if(query){
    pipeline.push({
        $search : {  //search using an Atlas Search Index.
            index : "search-videos",
            text : {
                query : query, // The text provided by the user for searching
                path : ["title", "description"] // Fields to search within
            }
        }
    })
}

if(userId) {
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid userId");
    }
    pipeline.push({
        $match : {
            owner  : new mongoose.Types.ObjectId(userId)
        }
    })
}

pipeline.push({ $match : {isPublished: true}})

//sortBy can be views, createdAt, duration
//sortType can be ascending(-1) or descending(1)

if(sortBy && sortType){
    pipeline.push({
        $sort : {
            [sortBy] : sortType === "asc"? 1:-1
        }
    });
}else{
     pipeline.push({ $sort : {createdAt : -1}})
}

pipeline.push(
    {
        $lookup : {
            from : "users",
            localField : "owner",
            foreignField : "_id",
            as : "ownerDetails",

            pipeline : [{
                $project : {
                    username :1,
                    "avtar.url" : 1
                }}
            ]
        }
    },
    {
        $unwind : '$ownerDetails'
    }
)

const videoAggregate = Video.aggregate(pipeline)

const options = {
    page : parseInt(page, 10),
    limit : parseInt(limit , 10)
}

const video = await Video.aggregatePaginate(videoAggregate, options)

return res
.status(200)
.json(new ApiResponse(200, video, "Videos fetched successfully"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}