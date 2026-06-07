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

  const formatDate = (timestamp) => {
    if (!timestamp) return "";

    const date = timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);

    return date.toLocaleString();
  };

  return (
    <div className="post-card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        {post.photo ? (
          <img
            src={post.photo}
            alt="Profile"
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: "#2563eb",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: "20px",
            }}
          >
            {post.name?.charAt(0).toUpperCase()}
          </div>
        )}

        <div>
          <div className="post-name">
            {post.name}
          </div>

          <div className="post-role">
            {post.role}
          </div>

          <div className="post-time">
            {formatDate(post.createdAt)}
          </div>
        </div>
      </div>

      {post.updatedAt && (
        <div
          style={{
            color: "#f59e0b",
            marginBottom: "10px",
            fontSize: "12px",
          }}
        >
          Edited: {formatDate(post.updatedAt)}
        </div>
      )}

      {isEditing ? (
        <>
          <textarea
            rows="4"
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
            className="edit-btn"
            onClick={handleSave}
          >
            Save
          </button>

          <button
            className="delete-btn"
            onClick={() =>
              setIsEditing(false)
            }
            style={{
              marginLeft: "10px",
            }}
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <div className="post-content">
            {post.content}
          </div>

          {post.image && (
            <img
              src={post.image}
              alt="Post"
              style={{
                width: "100%",
                borderRadius: "12px",
                marginTop: "10px",
                marginBottom: "15px",
                maxHeight: "500px",
                objectFit: "cover",
              }}
            />
          )}
        </>
      )}

      <div className="action-buttons">
        <button
          className="like-btn"
          onClick={() =>
            handleLike(post.id)
          }
        >
          ❤️ {post.likes || 0}
        </button>

        <button
          className="edit-btn"
          onClick={() =>
            setIsEditing(true)
          }
        >
          ✏️ Edit
        </button>

        <button
          className="delete-btn"
          onClick={() =>
            handleDelete(post.id)
          }
        >
          🗑 Delete
        </button>
      </div>

      <CommentSection
        postId={post.id}
        user={user}
      />
    </div>
  );
}

export default PostCard;
