import React, { useState } from "react";

const AddTemplate = ({ close, handle, template }) => {
  const [name, setName] = useState(template ? template.name : "");
  const [description, setDescription] = useState(template ? template.description : "");
  const [file, setFile] = useState(null); // State to store the uploaded file

  // Delete
  const handleDelete = () => {
    if (template) {
      if (window.confirm(`Are you sure you want to delete ${template.name}?`)) {
        handle(template, true);
      } else {
        return;
      }
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // Set the file state to the uploaded file
  };

  const handleSave = () => {
    if (!name) {
      alert("Template name is required.");
      return;
    }

    // Create new template
    const newTemplate = {
      _id: template ? template._id : null,
      name: name,
      description: description,
      file: file, // Include the uploaded file
    };

    handle(newTemplate);
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
            <h5 className="modal-title">{template ? `Edit ${template.name}` : "Add New Template"}</h5>
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
                  placeholder="Enter template name"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="templateDesc" className="form-label">
                  Description
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="templateDesc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter template description (optional)"
                />
              </div>
              {/* File input */}
              <div className="mb-3">
                <label htmlFor="formFile" className="form-label">
                  Upload Template
                </label>
                <input
                  className="form-control"
                  type="file"
                  id="formFile"
                  onChange={handleFileChange}
                  required // Makes the file input required
                />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <div style={{ display: "flex", justifyContent: template ? "space-between" : "right", flex: 1 }}>
              <button style={{ display: template ? "block" : "none" }} className="btn btn-danger" onClick={handleDelete}>
                Delete Template
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-secondary" onClick={close}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTemplate;
