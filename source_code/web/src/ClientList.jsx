import React, { useState } from "react";

const ClientList = ({ clients, onClientClick, addClient }) => {
  const [search, setSearch] = useState("");

  const filteredClients = clients ? clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase())
  ) : null

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
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: "10px", position: "sticky", top: "0", zIndex: "10"  }}>
        <input
            type="text"
            className="form-control"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" class="btn btn-light" onClick={addClient}>New</button>
      </div>

      {/* Scrollable List */}
      <div style={{ overflowY: "auto", height: "calc(100% - 40px)" }}>
        {filteredClients?.map((client, index) => (
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
            {client.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientList;
