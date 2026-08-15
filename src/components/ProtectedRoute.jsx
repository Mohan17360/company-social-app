import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

function ProtectedRoute({ children, roles = [] }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (!snap.exists()) {
          setAllowed(false);
        } else {
          const userRole = snap.data().role;

          if (roles.length === 0) {
            setAllowed(true);
          } else {
            setAllowed(roles.includes(userRole));
          }
        }
      } catch (error) {
        console.error(error);
        setAllowed(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [roles]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#0f172a",
          color: "white",
          fontSize: "20px",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/feed" replace />;
  }

  return children;
}

export default ProtectedRoute;