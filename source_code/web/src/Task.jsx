import React from "react";

export default function Task({ task, onDone }) {
  const calculateDueDate = (due) => {
    const currentDate = new Date();
    const dueDate = new Date(due);
    const differenceInDays = Math.ceil(
      (dueDate - currentDate) / (1000 * 60 * 60 * 24)
    );

    if (differenceInDays === 0) return "Today";
    if (differenceInDays === -1) return "Yesterday";
    if (differenceInDays === 1) return "Tomorrow";
    if (differenceInDays > 1) return `In ${differenceInDays} days`;
    return `${Math.abs(differenceInDays)} days ago`;
  };

  return (
    <div
      style={{
        backgroundColor: "#f9f9f9",
        border: "1px solid #ddd",
        borderRadius: "10px",
        padding: "15px",
        margin: "10px",
        position: "relative",
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
        height: "150px", 
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "18px" }}>{task.name}</h3>
          <p style={{ fontSize: "14px", color: "#888" }}>
            {calculateDueDate(task.due)}
          </p>
        </div>
        {task.client && (
          <p style={{ margin: "5px 0", fontSize: "14px" }}>
            Client: {task.client.name}
          </p>
        )}
        <p style={{ margin: "5px 0", fontSize: "14px" }}>{task.description}</p>
      </div>
      <button
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "20px",
          padding: "5px 15px",
          cursor: "pointer",
          fontSize: "14px",
        }}
        onClick={() => onDone(task)}
      >
        Done
      </button>
    </div>
  );
}
