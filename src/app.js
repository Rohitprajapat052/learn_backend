import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"




const app = express()
// .use is use for middlewares etc
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true 
}
   
))
//limit of json data that we can receive
app.use(express.json({ limit : "16kb"}))

//for spaces in url {extended mtlb objects k ander bhi objects de pate ho }
app.use(express.urlencoded({extended : true, limit : "16kb"}))
//this is used when some public things are saved aur anyone can see like asset , favicon
app.use(express.static("public"))
//cookie parser use ki cookies pr curd operations kr pau. mere server se  user ki cookies access kr pau aur set kr pau 
app.use(cookieParser())

export {
    app
}