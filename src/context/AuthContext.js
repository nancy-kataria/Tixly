"use client";
import { createContext, useContext, useState, useEffect } from "react";

// Create the Auth Context
const AuthContext = createContext();

// Provide the Auth Context
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Null if not logged in
  useEffect(() => {
    // Simulate fetching user session
    const fetchUser = async () => {
      const res = await fetch("/api/auth/session"); // Example API for user session
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    };
    fetchUser();
  }, []);

  const signOut = async () => {
    try {
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, signOut }}>
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
