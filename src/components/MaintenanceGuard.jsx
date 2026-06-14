import { useEffect, useState } from "react";
import { auth, db } from "../firebase";

import {
  doc,
  getDoc,
} from "firebase/firestore";

function MaintenanceGuard({
  children,
}) {
  const [loading, setLoading] =
    useState(true);

  const [maintenance,
    setMaintenance] =
    useState(false);

  useEffect(() => {
    const checkMaintenance =
      async () => {

        const settings =
          await getDoc(
            doc(
              db,
              "settings",
              "platform"
            )
          );

        if (
          settings.exists()
        ) {
          setMaintenance(
            settings.data()
              .maintenanceMode
          );
        }

        setLoading(false);
      };

    checkMaintenance();
  }, []);

  if (loading) {
    return null;
  }

  const currentEmail =
    auth.currentUser?.email;

  const isSuperAdmin =
    currentEmail ===
    "laminyamal1239@gmail.com";

  if (
    maintenance &&
    !isSuperAdmin
  ) {
    return (
      <div
        style={{
          minHeight:
            "100vh",
          display:
            "flex",
          justifyContent:
            "center",
          alignItems:
            "center",
          background:
            "#0f172a",
          color:
            "white",
          textAlign:
            "center",
        }}
      >
        <div>

          <h1>
            🚧 Platform Under Maintenance
          </h1>

          <p>
            The platform is
            temporarily unavailable.
          </p>

          <p>
            Please try again
            later.
          </p>

        </div>
      </div>
    );
  }

  return children;
}

export default MaintenanceGuard;