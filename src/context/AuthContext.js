"use client";
import { createContext, useContext, useState, useEffect } from "react";

// Create the Auth Context
const AuthContext = createContext();

// Provide the Auth Context
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Null if not logged in
  useEffect(() => {
    console.log("Auth context mounted");
    // Simulate fetching user session
    const fetchUser = async () => {
      console.log("Fetch user called");
      const res = await fetch("/api/auth/session"); // Example API for user session
      if (res.ok) {
        const data = await res.json();
        console.log(data);
        setUser(data);
      }
    };
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use Auth Context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
  };
