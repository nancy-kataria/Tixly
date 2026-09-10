"use client"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client";

const UserContext = createContext(null);
export function UserProvider({children}){
    const supabase = useMemo(() => createClient(), []);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading]= useState(true);

    // Combines the Supabase auth user with their row in public.profiles.
    // Resolves to null when signed out.
    const loadUser = useCallback(async () => {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (!authUser) return null;

          const { data: profile, error } = await supabase
            .from("profiles")
            .select("name, avatar_url, role")
            .eq("id", authUser.id)
            .single();
          if (error) console.error("Failed to fetch profile:", error);

          return {
            id: authUser.id,
            email: authUser.email,
            name: profile?.name ?? authUser.user_metadata?.full_name ?? authUser.email,
            avatarUrl: profile?.avatar_url ?? authUser.user_metadata?.avatar_url ?? null,
            role: profile?.role ?? "user", // "user" | "organizer"
          };
        } catch (error) {
          console.error("Failed to fetch user:", error);
          return null;
        }
      }, [supabase]);

    const refreshUser = useCallback(async () => {
        setUser(await loadUser());
      }, [loadUser]);

    // Returns true if sign-out succeeded.
    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Failed to sign out:", error);
          return false;
        }
        setUser(null);
        return true;
      }, [supabase]);

        useEffect(() => {
            let ignore = false;
            loadUser().then((loadedUser) => {
              if (ignore) return;
              setUser(loadedUser);
              setIsLoading(false);
            });
            return () => { ignore = true; };
          }, [loadUser]);

    return (<UserContext.Provider value={{ user, refreshUser, signOut, isLoading }}>{children}</UserContext.Provider>);
}

export function useUser(){
    return useContext(UserContext);
}
