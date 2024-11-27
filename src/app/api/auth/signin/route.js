import connectDB from '@/lib/mongooseDB';
import createUserCookie from '@/lib/setCookie';
import User from '@/models/Users';
import bcrypt from "bcrypt";


export async function POST(req) {
  try{
    await connectDB();
    const { email, password } = await req.json();
  
    const user = await User.findOne({ email });
    const sameDeCryptPassword = await bcrypt.compare(password, user.password);
    const samepassword = password == user.password;
    if (!user || !(samepassword || sameDeCryptPassword)) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
    }

    const {token, headers} = await createUserCookie(user);

    // Authentication successful
    var res = new Response(JSON.stringify(user), { status: 200 , headers});
    return res;

  }catch(e){
    console.error(e);
    return new Response(JSON.stringify({ error: 'Server Error' }), { status: 401 });
  }
}
