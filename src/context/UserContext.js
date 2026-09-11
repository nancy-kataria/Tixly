"use client"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client";

const UserContext = createContext(null);
export function UserProvider({children}){
    const supabase = useMemo(() => createClient(), []);
    const [user, setUser] = useState(null);
    const [cartCount, setCartCount] = useState(0);
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

    // How many tickets are held in the user's cart right now.
    const loadCartCount = useCallback(async (userId) => {
        if (!userId) return 0;
        const { count, error } = await supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("held_by", userId)
          .gt("held_until", new Date().toISOString());
        if (error) console.error("Failed to fetch cart:", error);
        return count ?? 0;
      }, [supabase]);

    const refreshUser = useCallback(async () => {
        const loadedUser = await loadUser();
        setUser(loadedUser);
        setCartCount(await loadCartCount(loadedUser?.id));
      }, [loadUser, loadCartCount]);

    const refreshCart = useCallback(async () => {
        setCartCount(await loadCartCount(user?.id));
      }, [loadCartCount, user?.id]);

    // Returns true if sign-out succeeded.
    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Failed to sign out:", error);
          return false;
        }
        setUser(null);
        setCartCount(0);
        return true;
      }, [supabase]);

        useEffect(() => {
            let ignore = false;
            loadUser().then(async (loadedUser) => {
              const count = await loadCartCount(loadedUser?.id);
              if (ignore) return;
              setUser(loadedUser);
              setCartCount(count);
              setIsLoading(false);
            });
            return () => { ignore = true; };
          }, [loadUser, loadCartCount]);

    return (
      <UserContext.Provider value={{ user, cartCount, refreshUser, refreshCart, signOut, isLoading }}>
        {children}
      </UserContext.Provider>
    );
}

export function useUser(){
    return useContext(UserContext);
}
