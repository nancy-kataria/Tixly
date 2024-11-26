import { serialize } from "cookie";

export  function POST() {
  try{
    const cookie = serialize("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0, // Immediately expire the cookie
      sameSite: "strict",
      path: "/",
    });
  
    return new Response(JSON.stringify({ message: "Logged out successfully" }), {
      status: 200,
      headers: {
        "Set-Cookie": cookie,
      },
    });

  }
  catch(e){
    console.log(JSON.stringify(e));
    return new Response(JSON.stringify({ message: "could not log out" }), {
      status: 401,
      headers: {
        "Set-Cookie": cookie,
      },
    });
  }
}