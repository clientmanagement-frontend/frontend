import React, {  useState } from "react";
import BackButton from "./BackButton";

const DocumentEditor = ({ doc, onBack, saveDoc }) => {
  const [fields, setFields] = useState(doc.fields || {});
  const [documentName, setDocumentName] = useState(
    doc.name || "New Document"
  );

  const pdfBlob = new Blob([doc.data], { type: "application/pdf" });
  const pdfURL = URL.createObjectURL(pdfBlob);



  // Handle field input changes
  const handleFieldChange = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  // Save the document
  const saveDocument = async () => {
    try {
        const iframe = document.querySelector("iframe");
        const iframeWindow = iframe.contentWindow || iframe.contentDocument.defaultView;
    
        // Ensure the PDF Viewer is loaded
        if (!iframeWindow || !iframeWindow.PDFViewerApplication) {
          throw new Error("PDF Viewer is not loaded or accessible.");
        }
    
        // Get the modified PDF document
        const pdfDocument = iframeWindow.PDFViewerApplication.pdfDocument;
        if (!pdfDocument) {
          throw new Error("No PDF document is loaded in the viewer.");
        }
    
        // Save the modified document (includes changes made in the viewer)
        // const modifiedPdfBlob = await iframeWindow.PDFViewerApplication.save();
    
        // // Convert Blob to Uint8Array
        // const pdfArrayBuffer = await modifiedPdfBlob.arrayBuffer();
        const pdfArrayBuffer = await pdfDocument.getData();
    
        // Prepare the data for the server
        const updatedDocument = {
          _id: doc._id,
          name: documentName,
          fields: fields,
          templateId: doc.templateId,
          data: Array.from(new Uint8Array(pdfArrayBuffer)), // Convert to Array for sending
        };
  
      // Save the document to the server
      saveDoc(updatedDocument);
    } catch (error) {
      console.error("Error saving document:", error);
    }
  };
  

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <BackButton onClick={onBack} />
      {/* Left: PDF Viewer */}
      <div style={{ flex: 2, padding: "10px", borderRight: "1px solid #ccc" }}>
        {doc.data && (
          

          <iframe
      title="PDF Viewer"
      src={`/pdfjs/web/viewer.html?file=${encodeURIComponent(pdfURL)}`}
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
