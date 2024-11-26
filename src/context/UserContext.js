"use client"
import { createContext, useContext, useEffect, useState, useCallback } from "react"

const UserContext = createContext(null);
export function UserProvider({children}){
    const [user, setUser] = useState(null);

    const fetchUser = useCallback(async () => {
        try {
          const res = await fetch("/api/auth/me", { method: "GET", credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Failed to fetch user:", error);
          setUser(null);
        }
      }, []);

        useEffect(() => {
            fetchUser();
          }, [fetchUser]);

    return (<UserContext.Provider value={{ user, refreshUser: fetchUser }}>{children}</UserContext.Provider>);
}

export function useUser(){
    return useContext(UserContext);
}