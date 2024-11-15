import mongoose, { models } from "mongoose";
import {seatSchema} from "./Venue.js";
import {ticketSchema} from "./Event.js";


const {Schema, SchemaTypes, model} = mongoose;



const ticketOwnershipSchema = new Schema({
    _id: {type:SchemaTypes.ObjectId, auto: true},
    userID: {type:SchemaTypes.ObjectId, ref:"User", required: true},
    eventID: {type:SchemaTypes.ObjectId, ref:"Event", required: true},
    ticket: {type:SchemaTypes.ObjectId, required: true, unique:true} // should point to an event.ticket

});

const TicketOwnership = models.TicketOwnership || model("TicketOwnership", ticketOwnershipSchema);
export default TicketOwnership;