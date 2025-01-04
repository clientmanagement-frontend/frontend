import React from "react";

export default function Template({ template, onCreate, onBrowse }) {

  if(template)
  return (
    <div
        onClick={() => onBrowse(template)}
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
          <h3 style={{ margin: 0, fontSize: "18px" }}>{template.name}</h3>
          <p style={{ fontSize: "14px", color: "#888" }}>
            PDF
          </p>
        </div>
        <p style={{ margin: "5px 0", fontSize: "14px" }}>{template.description}</p>
      </div>
      <div style = {{display: "flex", justifyContent: "flex-end", flex: 1, position: "absolute",
            bottom: "10px",
            right: "10px", gap: 5}}>
      
        <button
          style={{
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "20px",
            padding: "5px 15px",
            cursor: "pointer",
            fontSize: "14px",
          }}
          onClick={(e) => {onCreate(template); e.stopPropagation();}}
        >
          Create
        </button>
      </div>
    </div>
  );
}
