import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Owner");
  const [image, setImage] = useState(null);

  const handleRegister = async () => {
    try {
      let photoURL = "";

      if (image) {
        const formData = new FormData();

        formData.append("file", image);
        formData.append(
          "upload_preset",
          "companysocial"
        );

        const response = await fetch(
          "https://api.cloudinary.com/v1_1/doocnue5h/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const data =
          await response.json();

        photoURL =
          data.secure_url;
      }

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user =
        userCredential.user;

      await setDoc(
        doc(db, "users", user.uid),
        {
          name,
          email,
          role,
          photo: photoURL,
          createdAt: new Date(),
        }
      );

      alert(
        "Registration Successful!"
      );

      window.location.href =
        "/feed";
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "50px auto",
      }}
    >
      <h1>Register</h1>

      <input
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
      />

      <br />
      <br />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
      />

      <br />
      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) =>
          setPassword(
            e.target.value
          )
        }
      />

      <br />
      <br />

      <select
        value={role}
        onChange={(e) =>
          setRole(e.target.value)
        }
      >
        <option>Owner</option>
        <option>Investor</option>
        <option>Freelancer</option>
      </select>

      <br />
      <br />

      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          setImage(
            e.target.files[0]
          )
        }
      />

      <br />
      <br />

      <button
        className="create-btn"
        onClick={handleRegister}
      >
        Register
      </button>
    </div>
  );
}

export default RegisterPage;