import React, {useState} from "react";
import ClientList from "./ClientList";
import ClientView from "./ClientView";

export default function Dashboard() {
  const clients = [
    "John Doe",
    "Jane Smith",
    "Acme Corporation",
    "Globex Inc.",
    "Wayne Enterprises",
    "Stark Industries",
    "Pied Piper",
  ];

  const [client, setClient] = useState(null);

  const onClientClick = (client) => {
    // alert(`You clicked on ${client}`);
    setClient(client);

  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left Panel */}
      <div>
        <ClientList clients={clients} onClientClick={onClientClick} />
      </div>

      {/* Client View */}
      {client && (
        <ClientView
            client={client}
            onBack={() => setClient(null)}  
        />
      )}


      {/* Main Content */}
        {!client && (
            <div style={{ flex: 1, paddingLeft: "20px" }}>
            <h1>Dashboard</h1>
            <p>This is the dashboard page</p>
            </div>
        )}
    </div>
  );
}
