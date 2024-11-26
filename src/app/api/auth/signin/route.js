import connectDB from '@/lib/mongooseDB';
import createUserCookie from '@/lib/setCookie';
import User from '@/models/Users';

export async function POST(req, res) {
  try{
    await connectDB();
    res = new Response();
    const { email, password } = await req.json();
  
    const user = await User.findOne({ email });
    if (!user || (password != user.password)) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
    }
    const {token, headers} = await createUserCookie(user, res);

    // Authentication successful
    var res = new Response(JSON.stringify(user), { status: 200 , headers});
    console.log(JSON.stringify(res));
    return res;

  }catch(e){
    console.error(e);
    return new Response(JSON.stringify({ error: 'Server Error' }), { status: 401 });
  }
}
