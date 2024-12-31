import React, { useState } from "react";

const ClientList = ({ clients, onClientClick }) => {
  const [search, setSearch] = useState("");

  const filteredClients = clients.filter((client) =>
    client.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRight: "1px solid #ccc",
        padding: "10px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Search Bar */}
      <input
        type="text"
        className="form-control"
        placeholder="Search clients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "10px", position: "sticky", top: "0", zIndex: "10" }}
      />
      {/* Scrollable List */}
      <div style={{ overflowY: "auto", height: "calc(100% - 40px)" }}>
        {filteredClients.map((client, index) => (
          <div
            key={index}
            onClick={() => onClientClick(client, index)}
            style={{
              padding: "10px",
              borderBottom: "1px solid #eee",
              cursor: "pointer",
              transition: "font-weight 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.fontWeight = "bold")}
            onMouseLeave={(e) => (e.currentTarget.style.fontWeight = "normal")}
          >
            {client}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientList;
