import React from "react";

export default function Document({ doc, onClick, onComplete, onSend }) {

  return (
    <div
        onClick={() => onClick(doc)}
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
        cursor: "pointer",
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
          <h3 style={{ margin: 0, fontSize: "18px"}}>{doc.name}</h3>
          <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>
            { new Date(doc.modified).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}
          </p>
          
        </div>
        
        <p style={{ margin: 0, fontSize: "14px", fontWeight: 100}}>
            {doc.type}
          </p>
        <p style={{ margin: "10px 0", fontSize: "14px", fontStyle: "italic" }}>{doc.description}</p>


        <p style={{ fontSize: "14px", fontWeight: 100, position: "absolute", bottom: -5  }}>
            {doc.client ? doc.client.name : "General"}
          </p>
      </div>
      <div style = {{display: "flex", justifyContent: "flex-end", flex: 1, position: "absolute",
            bottom: "10px",
            right: "10px", gap: 5}}>
      { !doc.completed && (<button
          style={{
            backgroundColor: "#aaaaaa",
            color: "#fff",
            border: "none",
            borderRadius: "20px",
            padding: "5px 15px",
            fontSize: "14px",
          }}
        >
          Incomplete
        </button>
      )}
        {doc.completed && (<button
          style={{
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "20px",
            padding: "5px 15px",
            cursor: "pointer",
            fontSize: "14px",
          }}
          onClick={(e) => {onSend(doc); e.stopPropagation();}}
        >
          Send
        </button>)}
      </div>
    </div>
  );
}
