import { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        // Wait for Firebase to initialize
        let attempts = 0;
        while (!auth && attempts < 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }

        if (!auth) {
          console.error(
            "Firebase auth not initialized after multiple attempts"
          );
          setLoading(false);
          return;
        }

        unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log("Auth state changed:", user);
          setUser(user);
          setLoading(false);
        });
      } catch (error) {
        console.error("Error initializing auth:", error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}
