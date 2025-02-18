import mongoose from "mongoose"
import { Schema } from "mongoose"

const subscriptionSchema = new Schema({
    subscriber : {
        type : Schema.Types.ObjectId,  //one who is subcribing
        ref : "User"
    },
 
     channel : {
        type : Schema.Types.ObjectId, // one to whom subscriber is subcribing
        ref : "User"
     }



})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)