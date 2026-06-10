import { useEffect, useState } from "react";
// Step A: Integrated the useNavigate hook import alongside useParams
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase";

function UserProfilePage() {
  const { uid } = useParams();

  // Step B: Initialized the navigate hook inside the component
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const loadUser = async () => {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserData(userSnap.data());
      }
    };

    loadUser();

    const q = query(
      collection(db, "posts"),
      where("uid", "==", uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPosts(data);
    });

    return () => unsubscribe();
  }, [uid]);

  if (!userData) return <p>Loading...</p>;

  return (
    <div className="feed-container">
      {/* Step C: Added navigation block layout directly at the top of the viewport container */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <button
          className="edit-btn"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <button
          className="create-btn"
          onClick={() => window.location.reload()}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="profile-card">
        {userData.photo && (
          <img
            src={userData.photo}
            alt="Profile"
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
            }}
          />
        )}

        <h2>{userData.name}</h2>
        <p>{userData.email}</p>
        <p>{userData.role}</p>

        <p>
          Followers: {userData.followers?.length || 0}
        </p>

        <p>
          Following: {userData.following?.length || 0}
        </p>
      </div>

      <h2>User Posts</h2>

      {posts.map((post) => (
        <div key={post.id} className="post-card">
          <p>{post.content}</p>

          {post.image && (
            <img
              src={post.image}
              alt=""
              style={{
                width: "100%",
                borderRadius: "10px",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default UserProfilePage;