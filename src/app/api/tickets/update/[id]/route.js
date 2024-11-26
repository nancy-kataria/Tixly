import connectDB from '@/lib/mongooseDB';
import Event from '@/models/Event';
import TicketOwnership from '@/models/TicketOwnership';
import User from '@/models/Users';
import  mongoose  from 'mongoose';


export async function PUT(request, {params}) {
    const {id} = await params;
    const {userID, action} = await request.json();
    await connectDB();
    const session = await mongoose.startSession();
    try{
        session.startTransaction();

        const oldOwnership = await TicketOwnership.findOne({"ticket": id});
        if (!oldOwnership)
        {
            return new Response(JSON.stringify({ error: "Ticket ownership not found" }), { status: 404 });

        }
        const ownerID = oldOwnership.userID.toString();

        const event = await Event.findOne({ "tickets._id": id });
        if (!event) {
            return new Response(JSON.stringify({ error: "Event not found" }), {
                status: 404,
            });
        }

        const ticket = event.tickets.find((t) => t._id.toString() === id);
        if (!ticket) {
            return new Response(JSON.stringify({ error: "Ticket not found" }), {
                status: 404,
            });
        }

        const transactionTemplate = {
            ticketID: id,
            eventID: event._id,
            transactionDate: new Date(),
            price: ticket.price,
        };
        //ticketowneship should only change the user
        const ownershipQuery = TicketOwnership.findOneAndUpdate({"ticket": id}, {userID}, {new: true});


        const buyerQuery = User.findByIdAndUpdate(userID, {
            $push: {
              transactions: {
                ...transactionTemplate,
                transactionType: "purchase",
                status: "Completed",
              },
            },
          });
      
          const sellerQuery = User.findByIdAndUpdate(ownerID, {
            $push: {
              transactions: {
                ...transactionTemplate,
                transactionType: "sell",
                status: "Completed",
              },
            },
          });

        switch(action)
        {
            case "purchase":
                {
                    ticket.status="Sold";
                    break;
                }
            case "sell":
                {
                    ticket.status="Available";
                    //add transaction to Original Owner
                    //add transaction to buyer
                    break;
                }
            case "cancel":
                {
                    ticket.status="Sold";

                    break;
                }
            default:
                {
                    return new Response(
                        JSON.stringify({ error: "Invalid action specified" }),
                        { status: 400 }
                      );
                }
        }
        await event.save()
        const updatedOwnership = await ownershipQuery.exec();
        if(action ==="purchase" || action==="sell")
        {
            await buyerQuery.exec();
            await sellerQuery.exec();
        }

        await session.commitTransaction();
        session.endSession()

        return new Response(JSON.stringify({ success: true, updatedOwnership, event }), { status: 200 });
    }
    catch (error) {
        session.endSession()
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}