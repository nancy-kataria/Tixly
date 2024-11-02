//const mongoose = require('mongoose');
import mongoose, { SchemaTypeOptions } from "mongoose";

const {Schema, SchemaTypes, model, models} = mongoose;

const ticketSchema = new Schema({
    ticketID : {type: SchemaTypes.ObjectId, ref: "Event.tickets", required: true}, ///should be unique per transaction
    price: {type:Number, required: true}, //price bought/sold at

});

const userSchema = new Schema (
{
    _id: {type:SchemaTypes.ObjectId, auto: true},
    name: {type:String, required:true},
    email: {type:String, required:true, unique:true},
    password: {type:String, required:true},
    phone: Number,
    address: String,
    userType: {type:String, required:true},
    transactions: [
        {
            transactionDate: Date,
            status: String, //Completed,Pending, etc
            transactionType: String, //Buy, Sell, trade
            date: SchemaTypes.Date, //date of transaction
            tickets : { type:[ticketSchema]}
        }
    ],

    ownedTickets : [{ticketSchema}]
});

const User = models.User ||  model("User", userSchema);
export default User;