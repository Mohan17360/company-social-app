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

  const [showImage, setShowImage] =
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

  const hasLiked =
    user &&
    post.likes?.includes(user.uid);

  const isOwner =
    user?.email === post.email;

  const badgeColor =
    post.role === "Owner"
      ? "#16a34a"
      : post.role === "Investor"
      ? "#2563eb"
      : "#9333ea";

  return (
    <>
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
              {post.name
                ?.charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div className="post-name">
                {post.name}
              </div>

              <span
                style={{
                  background:
                    badgeColor,
                  color: "white",
                  padding:
                    "2px 8px",
                  borderRadius:
                    "20px",
                  fontSize:
                    "12px",
                  fontWeight:
                    "bold",
                }}
              >
                {post.role}
              </span>
            </div>

            <div className="post-time">
              {formatDate(
                post.createdAt
              )}
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
            Edited:{" "}
            {formatDate(
              post.updatedAt
            )}
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
                onClick={() =>
                  setShowImage(true)
                }
                style={{
                  width: "100%",
                  borderRadius:
                    "12px",
                  marginTop:
                    "10px",
                  marginBottom:
                    "15px",
                  maxHeight:
                    "500px",
                  objectFit:
                    "cover",
                  cursor:
                    "pointer",
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
            style={{
              background:
                hasLiked
                  ? "#ef4444"
                  : "#475569",
              color: "white",
            }}
          >
            {hasLiked
              ? "❤️"
              : "🤍"}{" "}
            {post.likes?.length ||
              0}{" "}
            {post.likes?.length ===
            1
              ? "Like"
              : "Likes"}
          </button>

          {isOwner && (
            <>
              <button
                className="edit-btn"
                onClick={() =>
                  setIsEditing(
                    true
                  )
                }
              >
                ✏️ Edit
              </button>

              <button
                className="delete-btn"
                onClick={() =>
                  handleDelete(
                    post.id
                  )
                }
              >
                🗑 Delete
              </button>
            </>
          )}
        </div>

        {post.likes?.length > 0 && (
          <p
            style={{
              marginTop: "10px",
              color: "#94a3b8",
              fontSize: "14px",
            }}
          >
            {hasLiked
              ? post.likes
                  .length === 1
                ? "You liked this"
                : `You and ${
                    post.likes
                      .length - 1
                  } others liked this`
              : `${post.likes.length} people liked this`}
          </p>
        )}

        <CommentSection
          postId={post.id}
          user={user}
        />
      </div>

      {showImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "rgba(0,0,0,0.9)",
            display: "flex",
            justifyContent:
              "center",
            alignItems:
              "center",
            zIndex: 9999,
          }}
        >
          <button
            onClick={() =>
              setShowImage(false)
            }
            style={{
              position:
                "absolute",
              top: "20px",
              right: "20px",
              background:
                "#ef4444",
              color: "white",
              border: "none",
              padding:
                "10px 15px",
              borderRadius:
                "8px",
              cursor:
                "pointer",
            }}
          >
            ✕ Close
          </button>

          <img
            src={post.image}
            alt="Full"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius:
                "10px",
            }}
          />
        </div>
      )}
    </>
  );
}

export default PostCard;