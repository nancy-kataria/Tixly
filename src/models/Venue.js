import mongoose from "mongoose";
const {Schema, SchemaTypes, model} = mongoose;

const seatSchema = new Schema({
    _id: false,
    seatNumber : Number,
    row : String,
    section: String
    
});
const venueSchema = new Schema(
    {
        _id: {type:SchemaTypes.ObjectId, auto: true},
        name: String,
        address: String,
        totalSeats : Number,
        seats: {
            type:[seatSchema],
            validate: {
                validator: function(seats)
                {
                    const seatSet = new Set();
                    for(const seat of seats)
                    {
                        
                        const key = `${seat.seatNumber}-${seat.row} - ${seat.section}`;
                        if(seatSet.has(key)) return false;
                        seatSet.add(key);
                    }
                    return true;
                },
                message:"Each seat combonation of seatNumber, row, and section must be unique"
            }
        }
    }
);
const Venue = model("Venue", venueSchema);
export {seatSchema};
export default Venue;