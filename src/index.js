
import connectDb from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";


dotenv.config({
    path: './.env'
});

connectDb()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(` 🧿 Server is running at port : ${process.env.PORT}`)
        
    })
    
})
.catch((err)=>{
      console.log("MONGODB connection Failed !!! ", err)
})











// import express from "express";
// import dotenv from "dotenv";
// dotenv.config();



// const app = express();

// (  async ()=>{
     
//     try {
//          await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//          console.log("Database connected successfully")
//            app.on("error",(error)=>{
//             console.log("ERR:", error);
//             throw error
//            })

//            app.listen(process.env.PORT, ()=>{
//             console.log(`App is listening on PORT : ${process.env.PORT}`)
//            })
//         } catch (error) {
         
//         console.log("Error in connecting with Database ", error)
//     }
// })()