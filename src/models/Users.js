//const mongoose = require('mongoose');
import mongoose, { SchemaTypeOptions } from "mongoose";
import { ticketSchema } from "./Event";

const {Schema, SchemaTypes, model, models} = mongoose;


const transactionSchema = new Schema (
    {
        transactionDate: Date,
        status: String, //Completed,Pending, etc
        transactionType: String, //Buy, Sell, trade
        tickets : { type:[ticketSchema]}
    }
);
const userSchema = new Schema (
{
    _id: {type:SchemaTypes.ObjectId, auto: true},
    name: {type:String, required:true},
    email: {type:String, required:true, unique:true},
    password: {type:String, required:true},
    phone: Number,
    address: String,
    userType: {type:String, required:true},
    transactions: [transactionSchema],

    //ownedTickets : [{ticketSchema}]
});

const User = models.User ||  model("User", userSchema);
export default User;