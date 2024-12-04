"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
//import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // Only used for signup
  const [userType, setUserType] = useState("User"); // Only used for signup

  const { refreshUser } = useUser();

  //const { setUser } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isLogin ? "/api/auth/signin" : "/api/auth/signup";
    const body = isLogin
      ? { email, password }
      : { name, email, password, userType };

    //for cookie
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    console.log(res);

    if (!res.ok) return;
    const data = await res.json();

    if (res.error) {
      alert(res.error);
    } else {
      alert("Logged in");
      await refreshUser();
      console.log(res);
      router.push("/");
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-100">
        <div className="w-full max-w-md p-6 space-y-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-semibold text-center text-gray-700">
            {isLogin ? "Sign In" : "Sign Up"}
          </h1>

          {/* Sign in and Sign up Forms */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
                />
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
                >
                  <option value="User">User</option>
                  <option value="Organizer">Organizer</option>
                </select>
              </>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-400"
            />
            <button
              type="submit"
              className="w-full py-2 mt-4 font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
              {isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-4 text-sm font-medium text-blue-500 hover:underline"
          >
            {isLogin ? "Create an account" : "Have an account? Login"}
          </button>
        </div>
      </div>
    </>
  );
}
