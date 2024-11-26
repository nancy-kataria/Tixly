import mongoose, { models } from "mongoose";
import {seatSchema} from "./Venue.js";
const {Schema, SchemaTypes, model} = mongoose;


const ticketSchema = new Schema({
    _id: {type:SchemaTypes.ObjectId, auto: true},
    seatNumber: {type: Number, required: true},
    price: {type:Number, default: 0},
    status: {type:String, default: "Available"} //Available, Sold
});


const eventSchema = new Schema (
    {
        _id: {type:SchemaTypes.ObjectId, auto: true},
        // Reference to User who organizes the event
        organizerId: {type: SchemaTypes.ObjectId, ref:"User"}, 
        //references the venue
        venue: {type: SchemaTypes.ObjectId, ref: "Venue"},
        eventName : String,
        eventCategory: { 
            type: String, 
            enum: ["Music", "Sports", "Comedy", "Theater"], // Restrict to these values
            default:"Music",
            required: true 
        },
        eventArtist: String,
        eventDate : Date,
        tickets : [ticketSchema],
    }
);

const Event = models.Event || model("Event", eventSchema);
export {ticketSchema};
export default Event;