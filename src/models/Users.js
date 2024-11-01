//const mongoose = require('mongoose');
import mongoose from "mongoose";

const {Schema, SchemaTypes, model, models} = mongoose;

const userSchema = new Schema (
{
    _id: {type:SchemaTypes.ObjectId, auto: true},
    name: {type:String, required:true},
    email: {type:String, required:true, unique:true},
    password: {type:String, required:true},
    phone: Number,
    address: String,
    userType: String,
    transactions: [
        {
            transactionDate: Date,
            status: String,
            tickets : [
            ]
        }
    ]
});

const User = models.User ||  model("User", userSchema);
export default User;