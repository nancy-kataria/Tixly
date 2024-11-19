import mongoose from "mongoose";


const connectDB = async () => 
{
    if(mongoose.connection.readyState>=1)return;

    try
    {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");
    }
    catch(e)
    {
        console.log("Error Connecting to DB",e);
        process.exit(1);
    }
}

export default connectDB;