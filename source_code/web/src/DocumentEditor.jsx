import React, { useState, useMemo } from "react";
import BackButton from "./BackButton";

const DocumentEditor = ({ doc, onBack, saveDoc, clients }) => {
  const [fields, setFields] = useState(doc.fields || {});
  const [selectedClient, setSelectedClient] = useState(doc.client?._id ?? null);
  const [documentName, setDocumentName] = useState(doc.name || "New Document");
  const [documentDesc, setDocumentDesc] = useState(doc.description || "");
  const defaultDeadline = new Date();
  defaultDeadline.setDate(defaultDeadline.getDate() + 7);

  const [deadline, setDeadline] = useState(doc._id ? (doc.completed ? "" : doc.deadline ): defaultDeadline.toISOString().split('T')[0]);


  // Generate PDF URL only when doc.data changes
  const pdfUrl = useMemo(() => {
    if (doc.data) {
      const pdfBlob = new Blob([doc.data], { type: "application/pdf" });
      return URL.createObjectURL(pdfBlob);
    }
    return null;
  }, [doc.data]);

  // Handle field input changes
  const handleFieldChange = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  // Save the document
  const saveDocument = async (complete) => {
    try {
      const iframe = document.querySelector("iframe");
      const iframeWindow = iframe.contentWindow || iframe.contentDocument.defaultView;

      // Ensure the iframe has fully loaded and PDFViewerApplication is accessible
      if (!iframeWindow || !iframeWindow.PDFViewerApplication) {
        throw new Error("PDF Viewer is not loaded or accessible.");
      }

      const pdfDocument = iframeWindow.PDFViewerApplication.pdfDocument;
      if (!pdfDocument) {
        throw new Error("No PDF document is loaded in the viewer.");
      }

      const pdfBlob = await pdfDocument.getData();
      const pdfArrayBuffer = new Uint8Array(pdfBlob);

      const updatedDocument = {
        _id: doc._id,
        name: documentName,
        description: documentDesc,
        fields,
        templateId: doc.templateId,
        client: selectedClient
          ? { name: clients.find((client) => client._id === selectedClient)?.name, _id: selectedClient }
          : null,
        data: Array.from(pdfArrayBuffer),
        type: doc.type,
        modified: new Date().toISOString(),
        deadline: deadline,
      };

      saveDoc(updatedDocument, false, complete);
    } catch (error) {
      console.error("Error saving document:", error);
    }
  };

  // Delete the document
  const deleteDoc = async () => {
    doc._id ? saveDoc({ _id: doc._id }, true, false) : onBack();
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <BackButton onClick={onBack} />

      {/* Left: PDF Viewer */}
      <div style={{ flex: 2, padding: "10px", borderRight: "1px solid #ccc" }}>
        {pdfUrl && (
          <iframe
            title="PDF Viewer"
            src={`/pdfjs/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`}
            style={{ width: "100%", height: "100%", border: "none" }}
          ></iframe>
        )}
      </div>

      {/* Right: Input Fields */}
      <div
        style={{
          flex: 1,
          padding: "10px",
          justifyContent: "space-between",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div>
          <div className="form-floating mb-3">
            <input
              type="text"
              className="form-control"
              id="documentName"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Document Name"
            />
            <label htmlFor="documentName">Title</label>
          </div>

            <div style = {{display: "flex", alignItems: "center", gap: 10}}>
            <div className="form-floating mb-3" style = {{flex: 1}}>
                <select
                className="form-select"
                id="client"
                value={selectedClient || ""}
                onChange={(e) => setSelectedClient(e.target.value)}
                aria-label="For"
                >
                <option value="">No Client</option>
                {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                    {client.name}
                    </option>
                ))}
                </select>
                <label htmlFor="client">For</label>
            </div>

            {!doc.completed && (
            <div className="form-floating mb-3">
                <input
                type="date"
                className="form-control"
                id="deadline"
                placeholder="Deadline"
                value={deadline}
                onChange={(e) => setDeadline( e.target.value)}
                />
                <label htmlFor="deadline">Personal Deadline</label>
            </div>
            )}
            </div>

          <div className="form-floating mb-3">
            <input
              type="text"
              className="form-control"
              id="documentDesc"
              value={documentDesc}
              onChange={(e) => setDocumentDesc(e.target.value)}
              placeholder="Description"
            />
            <label htmlFor="documentDesc">Description</label>
          </div>

          <hr></hr>


          <form>
          {Object.entries(fields).map(([key, value]) => (
            <div className="form-floating mb-3" key={key}>
                {key.includes("date") ? (
                <input
                    type="date"
                    className="form-control"
                    id={key}
                    value={value}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    placeholder={key}
                />
                ) : (
                <input
                    type="text"
                    className="form-control"
                    id={key}
                    value={value}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    placeholder={key}
                />
                )}
                <label htmlFor={key}>{key}</label>
            </div>
            ))}

          </form>

          

          
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 5 }}>
          <button disabled={!doc.data} className="btn btn-dark mt-3" onClick={deleteDoc}>
            {doc.completed ? "Delete" : "Discard Draft"}
          </button>

          <div style={{ display: "flex", gap: 5 }}>
            <button disabled={!doc.data} className="btn btn-secondary mt-3" onClick={() => saveDocument(false)}>
              {doc.completed ? "Mark Incomplete" : "Save Draft"}
            </button>

            <button disabled={!doc.data} className="btn btn-primary mt-3" onClick={() => saveDocument(true)}>
              {doc.completed ? "Save" : "Complete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
