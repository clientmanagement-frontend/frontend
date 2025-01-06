import React, { useState } from "react";
import BackButton from "./BackButton";

const ClientNotes = ({
  notes,
  addNote,
  deleteNote,
  isMobile,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const [search, setSearch] = useState("");
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(
      date.getDate()
    ).padStart(2, "0")}/${String(date.getFullYear()).slice(-2)}`;
  };

  const filteredNotes = notes
    ? notes.filter((note) =>
        note.body.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const handleAddNote = () => {
    if (newNote.trim() !== "") {
      addNote({ body: newNote.trim(), timestamp: Date.now(), _id: editingNote?._id });
      setNewNote("");
    }
  };

  const handleEditClick = (note) => {
    setEditingNote(note);
    setEditingContent(note.body);
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditingContent("");
  };

  const handleSaveEdit = () => {
    if (editingContent.trim() === "") {
      deleteNote(editingNote._id);
    } else {
      addNote({
        body: editingContent.trim(),
        timestamp: editingNote.timestamp,
        _id: editingNote._id,
      });
    }
    handleCancelEdit();
  };

  if (!mobileMenuOpen && isMobile) {
    return (
      <button
        onClick={() => {setMobileMenuOpen(true)}}
        style={{
          position: "fixed",
          bottom: "10px",
          left: "10px",
          width: "50px",
          height: "50px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
          zIndex: 1000
        }}
      >
        ☰
      </button>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        borderRight: "1px solid #ccc",
        padding: "10px",
        boxSizing: "border-box",
        flexDirection: "column",
      }}
    >
      {isMobile && mobileMenuOpen && (
        <BackButton onClick={() => setMobileMenuOpen(false)} />
      )}
      {/* Search Bar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: "10px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <input
          type="text"
          className="form-control"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Scrollable Notes Section */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingRight: "10px",
          marginBottom: "10px",
        }}
      >
        {filteredNotes.map((note) =>
          editingNote?.timestamp === note.timestamp ? (
            <div
              key={note.timestamp}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                borderRadius: "15px",
                marginBottom: "10px",
                maxWidth: "80%",
                alignSelf: "flex-start",
                boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
              }}
            >
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                style={{
                  width: "100%",
                  height: "60px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  padding: "5px",
                  boxSizing: "border-box",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "10px",
                }}
              >
                <button
                  onClick={handleCancelEdit}
                  style={{
                    backgroundColor: "#ccc",
                    color: "#000",
                    border: "none",
                    padding: "5px 20px",
                    borderRadius: "10px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  style={{
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    padding: "5px 20px",
                    borderRadius: "10px",
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div
              key={note.timestamp}
              onClick={() => handleEditClick(note)}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                borderRadius: "15px",
                marginBottom: "10px",
                maxWidth: "80%",
                alignSelf: "flex-start",
                boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <div>{note.body}</div>
              <div
                style={{
                  fontSize: "0.8em",
                  fontWeight: "lighter",
                  position: "absolute",
                  bottom: "5px",
                  right: "10px",
                  color: "#888",
                }}
              >
                {formatDate(note.timestamp)}
              </div>
            </div>
          )
        )}
      </div>

      {/* Input Footer */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          position: "sticky",
          bottom: 0,
          padding: "10px 0",
        }}
      >
        <input
          type="text"
          className="form-control"
          placeholder="Type a note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAddNote();
            }
          }}
          style={{
            borderRadius: "15px",
            flex: 1,
            height: "40px",
            border: "1px solid #ccc",
            padding: "5px 10px",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={handleAddNote}
          style={{
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            height: "40px",
            padding: "0 20px",
            borderRadius: "15px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default ClientNotes;
