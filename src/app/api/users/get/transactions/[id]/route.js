import connectDB from "@/lib/mongooseDB";
import User from "@/models/Users";

//  Get All Transactions for a User
export async function GET(req, {params}) {
    try {
        await connectDB();

        const {id: userID} = await params;

        if(!userID || userID ==="") return new Response(JSON.stringify({ error: "No UserID given" }), { status: 404 });

        const transactions = await User.findById(userID).select("transactions");
        if(!transactions)  return new Response(JSON.stringify({ error: "No Transactions found" }), { status: 404 });

        return new Response(JSON.stringify(transactions), { status: 200 });

    }catch (error) {
        console.log(error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
