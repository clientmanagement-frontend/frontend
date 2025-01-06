import BackButton from "./BackButton";

const ClientList = ({ clients, onClientClick, addClient, search, setSearch, isMobile, mobileMenuOpen, setMobileMenuOpen }) => {

  const filteredClients = clients ? clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase())
  ) : null

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
        width: "100%",
        height: "100%",
        borderRight: "1px solid #ccc",
        padding: "10px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
        {isMobile && mobileMenuOpen && (
        <BackButton onClick={() => setMobileMenuOpen(false)} />
      )}

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
            onClick={() => {onClientClick(client, index); setMobileMenuOpen(false)}}
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
