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
        //Transaction that will rollback if any update fails
        session.startTransaction();

        //find the current owner of the ticket
        const oldOwnership = await TicketOwnership.findOne({"ticket": id});
        if (!oldOwnership)
        {
            return new Response(JSON.stringify({ error: "Ticket ownership not found" }), { status: 404 });

        }
        const ownerID = oldOwnership.userID.toString();

        //Find the event of the ticket
        const event = await Event.findOne({ "tickets._id": id });
        if (!event) {
            return new Response(JSON.stringify({ error: "Event not found" }), {
                status: 404,
            });
        }

        //get the ticket embedded in the event
        const ticket = event.tickets.find((t) => t._id.toString() === id);
        if (!ticket) {
            return new Response(JSON.stringify({ error: "Ticket not found" }), {
                status: 404,
            });
        }
        //Template data to be used in a transaction
        const transactionTemplate = {
            transactionDate: new Date(),
            status: "Completed",
            tickets: [ticket],
        };

        //ticketowneship should only change the user
        const ownershipQuery = TicketOwnership.findOneAndUpdate({"ticket": id}, {userID}, {new: true});

        //Base Query made here and adjustments are made based on action of request
        const buyerQuery = User.findByIdAndUpdate(userID, {
            $push: {
              transactions: {
                ...transactionTemplate,
                transactionType: "purchase",
              },
            },
          }, {new: true});
      
          const sellerQuery = User.findByIdAndUpdate(ownerID, {
            $push: {
              transactions: {
                ...transactionTemplate,
                transactionType: "sell",
              },
            },
          }, {new: true});

        //Action determines what should be done (purchase, sell, cancel sell)
        //If Purchase or Sell, Users get a transaction
        
        switch(action)
        {
            //If buying, ticket status should be sold. Non owners should not interact with the ticket
            case "purchase":
                {
                    ticket.status="Sold";
                    break;
                }
            //If selling, the ticket status should be available
            case "sell":
                {
                    ticket.status="Available";

                    break;
                }
                //Cancel is for when a user was selling a ticket, but no longer wants to sell it. They would still own it
            case "cancel":
                {
                    ticket.status="Sold";

                    break;
                }
            default:
                {
                    //No action/invalid action
                    return new Response(
                        JSON.stringify({ error: "Invalid action specified" }),
                        { status: 400 }
                      );
                }
        }
        //This saves the ticket status in event
        await event.save()

        //Update the owner of the ticket
        //should only change in purchase/sell, but cant move it now
        const updatedOwnership = await ownershipQuery.exec();
        var buyer, seller;
        //If buying or selling the ticket, add a transaction to the buyer and seller
        if(action ==="purchase" || action==="sell")
        {
             buyer = await buyerQuery.exec();
             seller = await sellerQuery.exec();
        }
        //Commit
        await session.commitTransaction();
        session.endSession()

        return new Response(JSON.stringify({ success: true, updatedOwnership, event }), { status: 200 });
    }
    catch (error) {
        session.endSession()
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}