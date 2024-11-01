import mongoose from "mongoose";
import {seatSchema} from "./Venue.js";
const {Schema, SchemaTypes, model} = mongoose;


const ticketSchema = new Schema({
    _id: {type:SchemaTypes.ObjectId, auto: true},
    seat: seatSchema,
    price: Number,
    status: String
});


const eventSchema = new Schema (
    {
        _id: {type:SchemaTypes.ObjectId, auto: true},
        // Reference to User who organizes the event
        organizerId: {type: SchemaTypes.ObjectId, ref:"User"}, 
        //references the venue
        venue: {type: SchemaTypes.ObjectId, ref: "Venue"},
        eventName : String,
        eventDate : Date,

        tickets : [
            ticketSchema
        ]

    }
);

const Event = model("Event", eventSchema);
export default Event;