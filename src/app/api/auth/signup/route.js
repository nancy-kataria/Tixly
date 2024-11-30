import connectDB from "@/lib/mongooseDB";
import User from "@/models/Users";
import bcrypt from "bcrypt";
import createUserCookie from "@/lib/setCookie";

export async function POST(req) {
  await connectDB();
  const { name, email, password, userType } = await req.json();
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      userType,
    });
    console.log(JSON.stringify(user));
    await user.save();
    const { token, headers } = await createUserCookie(user);

    // Authentication successful
    var res = new Response(JSON.stringify(user), { status: 200, headers });
    return res;
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "User already exists or invalid data" }),
      { status: 400 }
    );
  }
}
