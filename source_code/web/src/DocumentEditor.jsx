import React, { useEffect, useState } from "react";
import BackButton from "./BackButton";

const DocumentEditor = ({ document, onBack, saveDoc }) => {
  const [fields, setFields] = useState(document.fields || {});
  const [documentName, setDocumentName] = useState(
    document.name || "New Document"
  );



  // Handle field input changes
  const handleFieldChange = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  // Save the document
  const saveDocument = async () => {
    const updatedDocument = {
      _id: document._id,
      name: documentName,
      fields: fields,
      templateId: document.templateId,
    };

    saveDoc(updatedDocument);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <BackButton onClick={onBack} />
      {/* Left: PDF Viewer */}
      <div style={{ flex: 2, padding: "10px", borderRight: "1px solid #ccc" }}>
        {document.data && (
          <iframe
            title="Document Viewer"
            src={`data:application/pdf;base64,${btoa(
              new Uint8Array(document.data).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ""
              )
            )}`}
            style={{ width: "100%", height: "100%", border: "none" }}
          ></iframe>
        )}
      </div>

      {/* Right: Input Fields */}
      <div style={{ flex: 1, padding: "20px" }}>
        <h4>Document Editor</h4>
        <div className="mb-3">
          <label htmlFor="documentName" className="form-label">
            Document Name
          </label>
          <input
            type="text"
            className="form-control"
            id="documentName"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
          />
        </div>
        <form>
          {Object.entries(fields).map(([key, value]) => (
            <div className="form-floating mb-3" key={key}>
              <input
                type="text"
                className="form-control"
                id={key}
                value={value}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                placeholder={key}
              />
              <label htmlFor={key}>{key}</label>
            </div>
          ))}
        </form>
        <button className="btn btn-primary mt-3" onClick={saveDocument}>
          Save
        </button>
      </div>
    </div>
  );
};

export default DocumentEditor;
