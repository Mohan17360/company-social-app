import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase";

function ProfilePage() {
  const [userId, setUserId] =
    useState("");

  const [name, setName] =
    useState("");

  const [role, setRole] =
    useState("");

  const [photo, setPhoto] =
    useState("");

  const [image, setImage] =
    useState(null);

  const [preview, setPreview] =
    useState("");

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          if (!user) return;

          setUserId(user.uid);

          const userRef = doc(
            db,
            "users",
            user.uid
          );

          const userSnap =
            await getDoc(userRef);

          if (
            userSnap.exists()
          ) {
            const data =
              userSnap.data();

            setName(
              data.name || ""
            );

            setRole(
              data.role || ""
            );

            setPhoto(
              data.photo || ""
            );
          }
        }
      );

    return () =>
      unsubscribe();
  }, []);

  const uploadImage =
    async () => {
      if (!image) return photo;

      const formData =
        new FormData();

      formData.append(
        "file",
        image
      );

      formData.append(
        "upload_preset",
        "companysocial"
      );

      const response =
        await fetch(
          "https://api.cloudinary.com/v1_1/doocnue5h/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      return data.secure_url;
    };

  const handleSave =
    async () => {
      try {
        const photoUrl =
          await uploadImage();

        await updateDoc(
          doc(
            db,
            "users",
            userId
          ),
          {
            name,
            role,
            photo:
              photoUrl,
          }
        );

        alert(
          "Profile Updated!"
        );

        window.location.href =
          "/feed";
      } catch (error) {
        alert(
          error.message
        );
      }
    };

  return (
    <div className="feed-container">
      <div className="profile-card">

        {(preview ||
          photo) && (
          <img
            src={
              preview ||
              photo
            }
            alt="Profile"
            style={{
              width: "120px",
              height: "120px",
              borderRadius:
                "50%",
              objectFit:
                "cover",
              marginBottom:
                "20px",
              border:
                "3px solid #2563eb",
            }}
          />
        )}

        <h1>
          Edit Profile
        </h1>

        <br />

        <input
          type="text"
          value={name}
          placeholder="Name"
          onChange={(e) =>
            setName(
              e.target.value
            )
          }
        />

        <br />
        <br />

        <select
          value={role}
          onChange={(e) =>
            setRole(
              e.target.value
            )
          }
        >
          <option>
            Owner
          </option>

          <option>
            Investor
          </option>

          <option>
            Freelancer
          </option>
        </select>

        <br />
        <br />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            setImage(
              e.target.files[0]
            );

            setPreview(
              URL.createObjectURL(
                e.target.files[0]
              )
            );
          }}
        />

        <br />
        <br />

        <button
          className="create-btn"
          onClick={
            handleSave
          }
        >
          Save Changes
        </button>

        <br />
        <br />

        <button
          className="edit-btn"
          onClick={() =>
            (window.location.href =
              "/feed")
          }
        >
          Back To Feed
        </button>
      </div>
    </div>
  );
}

export default ProfilePage;
