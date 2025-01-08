import React, { useState,  useEffect, useCallback } from "react";
import BackButton from "./BackButton";
//import { EmbedPDF } from "@simplepdf/react-embed-pdf";



const DocumentEditor = ({ doc, onBack, saveDoc, clients }) => {
  const [fields, setFields] = useState(null); //doc.fields ?? {}
  const [download, setDownload] = useState(false)
  const [selectedClient, setSelectedClient] = useState(doc.client ?? null);
  const [documentName, setDocumentName] = useState(doc.name || "New Document");
  const [documentDesc, setDocumentDesc] = useState(doc.description || "");
  const defaultDeadline = new Date();
  const [pdfUrl, setPdfUrl] = useState(null)



  defaultDeadline.setDate(defaultDeadline.getDate() + 7);

  const [deadline, setDeadline] = useState(doc._id ? (doc.completed ? "" : doc.deadline ): defaultDeadline.toISOString().split('T')[0]);


  // Get the document that is currently loaded
  const getDoc = useCallback(() => {
    // Access the iframe window
    const iframe = document.querySelector("iframe");

    const iframeWindow = iframe.contentWindow || iframe.contentDocument.defaultView;

    // Ensure the PDF.js application is loaded
    if (!iframeWindow || !iframeWindow.PDFViewerApplication) {
      throw new Error("No PDF Loaded")
    }

    const pdfViewer = iframeWindow.PDFViewerApplication;
    const pdfDocument = pdfViewer.pdfDocument;

    if (!pdfDocument) {
      throw new Error("No PDF Loaded")
    }
    return pdfDocument
}, [])

  // Generate PDF URL only when doc.data changes
  useEffect(() => {
    if (!pdfUrl && doc.data) {
      const pdfBlob = new Blob([doc.data], { type: "application/pdf" });
      if (pdfBlob.size < 1) return
      const blob = URL.createObjectURL(pdfBlob);

      setPdfUrl(blob)
    }
  }, [doc.data, pdfUrl]);

  
  

  

  // Pass name to get a field object on the document
  async function getFieldObjById(doc, id) {
    var objs = await doc.getFieldObjects();
    for(var i=0; i<Object.values(objs).length; i++) {
      // console.log(Object.values(objs)[i][0].name, id)
        if(Object.values(objs)[i][0].name === id) {
            return Object.values(objs)[i][0];
        }
    }
  }

  // Queue an update (needs .saveDocument() and to change the useMemo hook thru doc.data bianry blob update)
  // sets the value on a pdf object
  const setFieldValue = useCallback(async(pdf, id, val) => {

      var fObject = await getFieldObjById(pdf, id);
      if(!fObject) return false// The requested field does not exist, skip (will not add to state)
      pdf.annotationStorage.setValue(fObject.id, {value: val});
      return true
  }, [])

  // Process the list of updates onto the pdf and re-render the document
  const updateFields = useCallback(async (fieldUpdates) => {
    // Set a field on the pdf
    for (const fieldName of Object.keys(fieldUpdates))
      {
        setFieldValue(getDoc(), fieldName, fieldUpdates[fieldName])
        handleFieldChange(fieldName, fieldUpdates[fieldName])
      }
  
      // Update the viewer
      // Save the modified PDF
      const newpdf = await getDoc().saveDocument();
      const pdfBlob = new Blob([newpdf], { type: "application/pdf" });
      const blob = URL.createObjectURL(pdfBlob);
      setPdfUrl(blob)
  }, [getDoc, setFieldValue])
  
  // When the client changes, fill the data
  useEffect(() => {
    if (selectedClient)
    {
      // const client = clients.find(c => c._id === selectedClient)
      let fieldUpdates = {}
    
      // Can change these to objects with a value and force property, if we want to control whether to replace existing.
      fieldUpdates["Client Name"] = selectedClient.name
      fieldUpdates["Client Address"] = selectedClient.address
      fieldUpdates["Client Phone"] = selectedClient.phone
      fieldUpdates["Client Email"] = selectedClient.email

      updateFields(fieldUpdates)

    }
    
    
  }, [selectedClient, setFieldValue, updateFields, clients])

  // When the document loads, get the field data from the pdf
  useEffect(() => {
    
    // Differs from updateFields because this will gather a list of all fields
    // in the document, returning them to be set in state for mobile use.
    // Will also perform the default auto-fill updates.
    const updateAndListPdfFields = async (fieldUpdates) => {
      try {
        const pdf = getDoc()
    
        const totalPages = pdf.numPages;
        const updatedFields = {}; // Object to store updated fields and their values
    
        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const annotations = await page.getAnnotations();
    
          // Update fields and collect field values
          annotations.forEach((annotation) => {
            if (annotation.fieldName) {
              // Update field value if it exists in the fieldUpdates list AND if the value is currently empty
              // (it is autofill, not autoreplace)
              
              if (fieldUpdates.hasOwnProperty(annotation.fieldName) && (!annotation.fieldValue )) {
                 if (setFieldValue(pdf, annotation.fieldName, fieldUpdates[annotation.fieldName]))
                    updatedFields[annotation.fieldName] = fieldUpdates[annotation.fieldName]
                 else console.error("Broken field on pdf:", annotation.fieldName)
              }
              // Add to the updated fields object
              else updatedFields[annotation.fieldName] = annotation.fieldValue;
    
            }
          });
        }

        // Save the modified PDF
        const newpdf = await pdf.saveDocument();
        const pdfBlob = new Blob([newpdf], { type: "application/pdf" });
        const blob = URL.createObjectURL(pdfBlob);
        setPdfUrl(blob)

        return updatedFields; // Return all fields with their updated values
      } catch (error) {
        console.log(error)
        return null
      }
    };

    function getCurrentDate() {
      const date = new Date();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
      const day = String(date.getDate()).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2); // Get the last two digits of the year
    
      return `${month}/${day}/${year}`;
    }

    let fieldUpdates = {}
    fieldUpdates["Date"] = getCurrentDate()
    
    if(doc.client)
    {
      // Can change these to objects with a value and force property, if we want to control whether to replace existing.
      fieldUpdates["Client Name"] = doc.client.name
      fieldUpdates["Client Address"] = doc.client.address
      fieldUpdates["Client Phone"] = doc.client.phone
      fieldUpdates["Client Email"] = doc.client.email

    }
    
    
    const tryGetFields = () => {
      // Force the update with true, so we get the most recent date.
      updateAndListPdfFields(fieldUpdates).then((updatedFields) => {
        if (!updatedFields) throw new Error("Still loading")
        
        // We want to use the handleFieldChangeFunction instead when we want to change state.
        // Currently, we don't use the fields array, at all. 
        // On mobile, we will use this return value to render the fields as an input form.
        // For desktop, we use the fields directly from the document, and enter them directly to the document
        // Therefor, state variable fields is not needed. It is just needed to provide an alternative I/O to the iframe for
        // a better mobile experience (TODO)
        // It will simply involve rendering an input for each field, and modifying the handleFieldChange callback to
        // call setFieldValue function. We DONT need to save modifications with .saveDocument(), because we won't be viewing
        // a pdf iframe that we need to refresh. .saveDocument() will be called from the Save Draft / Complete buttons 
        //, the saveDocument() function on this component will trigger the loading of the updated annotations.
        else if (!fields) setFields(updatedFields)
        else return
      })

      .catch((e) => {
        setTimeout(tryGetFields, 1000)
      })

    }
    tryGetFields()

    
  }, [doc, fields, setFieldValue, getDoc])

  // We got the fields
  useEffect(() => {
    if (fields)
    {
      console.log(fields)
      // We can use these fields however we want ...
      
    }
      

  }, [fields])

  // Handle field input changes
  const handleFieldChange = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  // Save the document
  const saveDocument = async (complete) => {
    try {
      const pdfDocument = getDoc()

      // Extract the updated data from the PDF viewer
      const pdfBlob = await pdfDocument.saveDocument();
      const pdfArrayBuffer = new Uint8Array(pdfBlob);
  
      const updatedDocument = {
        _id: doc._id,
        name: documentName,
        description: documentDesc,
        fields,
        templateId: doc.templateId,
        client: selectedClient,
        data: Array.from(pdfArrayBuffer),
        type: doc.type,
        modified: new Date().toISOString(),
        deadline: deadline,
      };
  
      // Save the document
      saveDoc(updatedDocument, false, complete);
    //   console.log(pdfDocument.annotationStorage)
  
      //Trigger the PDF download
      if (download)
      {
        const pdfBlobToDownload = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(pdfBlobToDownload);
    
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${documentName}.pdf`; // Set the download filename
        link.click(); // Trigger the download
    
        // Clean up the URL object after download
        URL.revokeObjectURL(pdfUrl);
      }
      
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
            onLoad = {() => {
              
            }}
          ></iframe>
        //   <EmbedPDF companyIdentifier="viewer"
        //     mode="inline"
        //     style={{ width: 900, height: 800 }}
        //     documentURL={pdfUrl}
        // />
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
                  value={selectedClient?._id || ""}
                  onChange={(e) => {
                    const client = clients.find((c) => c._id === e.target.value);
                    setSelectedClient(client || null);
                  }}
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

            {doc.completed && (
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
          { false && fields && Object.entries(fields).map(([key, value]) => (
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
          <div  className="form-check" style={{ display: "flex", alignItems: "center", position: "relative", top: 8 }}>
                <input
                    type="checkbox"
                    className="form-check-input"
                    id={`download`}
                    checked={download}
                    onChange={(e) => setDownload(e.target.checked)}
                />
                <label htmlFor={`download`} className="form-check-label" style={{ marginLeft: "5px", color: "gray" }}>
                    Download
                </label>
              </div>

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
