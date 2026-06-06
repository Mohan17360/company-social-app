import { useState } from "react";
import CommentSection from "./CommentSection";

function PostCard({
  post,
  handleLike,
  handleEdit,
  handleDelete,
  user,
}) {
  const [isEditing, setIsEditing] =
    useState(false);

  const [editedContent, setEditedContent] =
    useState(post.content);

  const handleSave = () => {
    handleEdit(post.id, editedContent);
    setIsEditing(false);
  };

  return (
    <div
      style={{
        border: "1px solid gray",
        padding: "20px",
        marginBottom: "20px",
      }}
    >
      <h2>{post.name}</h2>

      <h3>{post.role}</h3>

      {isEditing ? (
        <>
          <textarea
            rows="4"
            cols="50"
            value={editedContent}
            onChange={(e) =>
              setEditedContent(
                e.target.value
              )
            }
          />

          <br />
          <br />

          <button
            onClick={handleSave}
          >
            💾 Save
          </button>

          <button
            onClick={() =>
              setIsEditing(false)
            }
            style={{
              marginLeft: "10px",
            }}
          >
            ❌ Cancel
          </button>
        </>
      ) : (
        <p>{post.content}</p>
      )}

      <button
        onClick={() =>
          handleLike(post.id)
        }
      >
        ❤️ Like ({post.likes || 0})
      </button>

      <button
        onClick={() =>
          setIsEditing(true)
        }
        style={{
          marginLeft: "10px",
        }}
      >
        ✏️ Edit
      </button>

      <button
        onClick={() =>
          handleDelete(post.id)
        }
        style={{
          marginLeft: "10px",
        }}
      >
        🗑 Delete
      </button>

      <CommentSection
        postId={post.id}
        user={user}
      />
    </div>
  );
}

export default PostCard;