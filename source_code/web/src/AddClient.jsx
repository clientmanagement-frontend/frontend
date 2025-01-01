import React, { useState } from "react";

const AddClient = ({ close, add, client }) => {
  const [name, setName] = useState(client? client.name : "");
  const [address, setAddress] = useState(client? client.address : "");
  const [email, setEmail] = useState(client? client.email : "");
  const [phone, setPhone] = useState(client? client.phone : "");

  const handleSave = () => {
    if (!name) {
      alert("Client name is required.");
      return;
    }

    const newClient = {
      name,
      address: address,
      email: email,
      phone: phone
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
            <h5 className="modal-title">Add New Client</h5>
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
  );
};

export default AddClient;
