import React, { useState } from "react";

const AddClient = ({ close, add, client }) => {
  const [name, setName] = useState(client? client.name : "");
  const [address, setAddress] = useState(client? client.address : "");
  const [email, setEmail] = useState(client? client.email : "");
  const [phone, setPhone] = useState(client? client.phone : "");

  // Delete client
const handleDelete = () => {
    if (client) {
        if (window.confirm(`Are you sure you want to delete ${client.name}?`)) {
            add(client, true);
        } else {
            return;
        }
    }
};

  const handleSave = () => {
    if (!name) {
      alert("Client name is required.");
      return;
    }

    const newClient = {
      _id: client? client._id : null,
      name: name,
      address: address,
      email: email,
      phone: phone,
      points: client? client.points : 0
    };

    add(newClient);
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{client?._id ? "Edit Client" : "Add New Client"}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={close}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <form>
              <div className="mb-3">
                <label htmlFor="clientName" className="form-label">
                  Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="clientName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter client's name"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="clientAddress" className="form-label">
                  Address
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="clientAddress"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter client's address (optional)"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="clientEmail" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="clientEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter client's email (optional)"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="clientPhone" className="form-label">
                  Phone
                </label>
                <input
                  type="tel"
                  className="form-control"
                  id="clientPhone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter client's phone number (optional)"
                />
              </div>
            </form>
          </div>
          <div className="modal-footer">

            <div style = {{display: "flex", justifyContent: client ? "space-between" : "right", flex: 1}}>
                
                <button style = {{display: client ? "block" : "none"}}className="btn btn-danger" onClick={handleDelete}>
                    Delete Client
                </button>

                <div style = {{display: "flex", gap: 10}}>
                    <button className="btn btn-secondary" onClick={close}>
                    Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSave}>
                    Save Client
                    </button>
                </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AddClient;
