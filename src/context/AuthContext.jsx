import { useEffect, useState } from "react";

import { auth, db } from "../firebase";

import { onAuthStateChanged } from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) {
          setUser(null);
          setUserData(null);
          setLoading(false);
          return;
        }

        setUser(currentUser);

        try {
          const snap = await getDoc(
            doc(db, "users", currentUser.uid)
          );

          if (snap.exists()) {
            setUserData(snap.data());
          }
        } catch (error) {
          console.error(error);
        }

        setLoading(false);
      });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
