import React, { useState,  useEffect, useCallback} from "react";
import BackButton from "./BackButton";



const DocumentEditor = ({ doc, onBack, saveDoc, clients, useViewer }) => {
  const [fields, setFields] = useState({}); //doc.fields ?? {}
  const [download, setDownload] = useState(false)
  const [selectedClient, setSelectedClient] = useState(doc.client ?? null);
  const [documentName, setDocumentName] = useState((doc.name?.indexOf("🤔") > -1 ? "New Document" : doc.name) || "New Document");
  const [documentDesc, setDocumentDesc] = useState(doc.description || "");
  const defaultDeadline = new Date();
  const [pdfUrl, setPdfUrl] = useState(null)
  const [fieldMap, setFieldMap] = useState(null) // Field name to field object map
  const [loaded, setLoaded] = useState(false)

  


  defaultDeadline.setDate(defaultDeadline.getDate() + 7);

  const [deadline, setDeadline] = useState(doc._id ? (doc.deadline ): defaultDeadline.toISOString().split('T')[0]);

  const [fieldGroupsBoxes, setFieldGroupsBoxes] = useState({});
  const [fieldGroupsRadios, setFieldGroupsRadios] = useState({});

  const [fieldData, setFieldData] = useState(null);

  


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



  // Generate PDF URL only when doc.data changes, if we're using the viewer OR IF NOT because we need to build the pdf regardless!
  useEffect(() => {
    if (!pdfUrl && doc.data) {
      const pdfBlob = new Blob([doc.data], { type: "application/pdf" });
      if (pdfBlob.size < 1) return
      const blob = URL.createObjectURL(pdfBlob);

      setPdfUrl(blob)
    }
  }, [doc.data, pdfUrl]);

  
  

  

  // Pass name to get a field object on the document
  const getFieldObjById = useCallback(
    async (doc, id) => {
      if (fieldMap) {
        return fieldMap[id];
      } else {
        const objs = await doc.getFieldObjects();
        const newMap = Object.fromEntries(
          Object.entries(objs).map(([key, value]) => [key, value[value.length - 1]])
        );
        setFieldMap(newMap);
  
        return newMap[id];
      }
    },
    [fieldMap, setFieldMap]
  );

  useEffect(() => {
    // Key value pairs to .. what even is this ???
    const fetchFieldData = async () => {
      if (!fields || useViewer) return;
  
      const newFieldGroupsRadios = {};
      const newFieldGroupsBoxes = {};

      const newFieldData = {};
  
      for (const [key, value] of Object.entries(fields)) {
        const fieldObj = await getFieldObjById(getDoc(), key);
        const fieldType = fieldObj?.type;
        const fieldName = key.split(":")[0]; // Extract group name for radios
  
        if (fieldType === "text" || fieldType === "combobox" || ( (fieldType === "checkbox" || fieldType === "radiobutton") && !key.includes(":"))) {
          newFieldData[key] = { fieldType, fieldObj, value: value };
        } 
        
        else if (fieldType === "radiobutton" && key.includes(":")) {
          const group = key.startsWith("$")
            ? key.slice(1).split(":")[0]
            : fieldName; // Handle $Group format
          const option = key.split(":")[1];
          const isChecked = value === "On";
  
          if (!newFieldGroupsRadios[group]) {
            newFieldGroupsRadios[group] = [];
          }
          newFieldGroupsRadios[group].push({ key, option, isChecked });
        }

        else if (fieldType === "checkbox" && key.includes(":")) {
          const group = key.startsWith("$")
            ? key.slice(1).split(":")[0]
            : fieldName; // Handle $Group format
          const option = key.split(":")[1];
          const isSingleSelect = key.startsWith("$");
          const isChecked = value;
  
          if (!newFieldGroupsBoxes[group]) {
            newFieldGroupsBoxes[group] = [];
          }
          newFieldGroupsBoxes[group].push({ key, option, isChecked, isSingleSelect });
        }


        else
        {
          console.log("Unsupported type: ", fieldType)
        }
      }
  
      setFieldGroupsBoxes(newFieldGroupsBoxes);
      setFieldGroupsRadios(newFieldGroupsRadios);
      setFieldData(newFieldData);
    };
  
    fetchFieldData();
  }, [fields, useViewer, getDoc, getFieldObjById]);

  // Process the list of updates onto the pdf and re-render the document
  // Skip state is called if updateFields is called through handleFieldChange (if a date was changed, we call updateFields, and dont need to update state, because handleFieldChange already did this.)
  const updateFields = useCallback(async (fieldUpdates, skipState) => {
    // Set a field on the pdf
    let pdf = null
    try
    {
      pdf = getDoc()
    }
    catch (e)
    {
      // No pdf
    }

    
    for (const fieldName of Object.keys(fieldUpdates))
    {
      if (!skipState) setFields((prev) => ({ ...prev, [fieldName]: fieldUpdates[fieldName] }));
      if (!pdf)
        break

      var fObject = await getFieldObjById(pdf, fieldName);
      if(!fObject) continue
      await pdf.annotationStorage.setValue(fObject.id, {value: fieldUpdates[fieldName]});
    }
      
   
    
    if (!pdf) return
    // Update the viewer
    // Save the modified PDF
    const newpdf = await pdf.saveDocument();
    const pdfBlob = new Blob([newpdf], { type: "application/pdf" });
    const blob = URL.createObjectURL(pdfBlob);
    setPdfUrl(blob)
  }, [getDoc, getFieldObjById])

  // Handle field input changes
  const handleFieldChange = useCallback( async (key, value, date) => {
    // console.log(key, value, date)
    const obj = await getFieldObjById(getDoc(), key)
    if (value == null) value = obj.fieldType === "radiobutton" ? "Off" : obj.fieldType === "checkbox" ? false : ""

    value = Array.isArray(value) ? value[0] : value;

    if (!date) setFields((prev) => ({ ...prev, [key]: value}))
    
    // If its a date, update on the pdf
    else
      {
      setFields((prev) => ({ ...prev, [key]: value.split("-").reverse().join("-").replace(/^(\d{2})-(\d{2})-(\d{4})$/, '$2-$1-$3').replace(/-/g, "/")}))

        updateFields({[key]: value.split("-").reverse().join("-").replace(/^(\d{2})-(\d{2})-(\d{4})$/, '$2-$1-$3').replace(/-/g, "/")

        
    }, true)

  }

    
  },[updateFields, getDoc, getFieldObjById]);

   // Queue an update (needs .saveDocument() and to change the useMemo hook thru doc.data bianry blob update)
  // sets the value on a pdf object
  const setFieldValue = useCallback(async(pdf, id, val) => {
    handleFieldChange(id, val)
    if (!pdf)
      return true

    var fObject = await getFieldObjById(pdf, id);
    if(!fObject) return false// The requested field does not exist, skip (will not add to state)
    pdf.annotationStorage.setValue(fObject.id, {value: val});
    return true
}, [getFieldObjById, handleFieldChange])

 

  
  
  // When the client changes, fill the data
  const handleClientChange = (client) => {
    
    setSelectedClient(client)
      // const client = clients.find(c => c._id === selectedClient)
      let fieldUpdates = {}
    
      // Can change these to objects with a value and force property, if we want to control whether to replace existing.
      fieldUpdates["Client Name"] = client?.name || ""
      fieldUpdates["Client Address"] = client?.address || ""
      fieldUpdates["Client Phone"] = client?.phone || ""
      fieldUpdates["Client Email"] = client?.email || ""

      updateFields(fieldUpdates)

    
    
    
  }


  // Get all fields from the loaded PDF
  const getFields = useCallback(async () => {
    
    try {
      const pdf = getDoc()
  
      const totalPages = pdf.numPages;
      const updatedFields = {}; // Object to store updated fields and their values
  
      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const annotations = await page.getAnnotations();
  
        // Update fields and collect field values
        annotations.forEach(async (annotation) => {
          if (annotation.fieldName) 
            updatedFields[annotation.fieldName] =   annotation.checkBox ? (annotation.fieldValue === "Off" ? false : true) : annotation.fieldValue //annotation.radioButton? annotation.fieldValue : annotation.fieldValue;
        });
      }


      return updatedFields; // Return all fields with their updated values
    } catch (error) {
      // Likely because we are on mobile. Return state fields
      // As of our latest update, this isn't true. Even if on mobile, we extract from the pdf
      return fields
    }
  }, [fields, getDoc])



  // When the document loads, get the field data from the pdf
  useEffect(() => {
    if (loaded) return
    
    // Differs from updateFields because this will gather a list of all fields
    // in the document, returning them to be set in state for mobile use.
    // Will also perform the default auto-fill updates.
    const updateAndListPdfFields = async (fieldUpdates) => {
      try {
        const pdf = getDoc();
        const totalPages = pdf.numPages;
        const updatedFields = {}; // Object to store updated fields and their values
    
        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const annotations = await page.getAnnotations();
    
          // Use a for...of loop to properly await async operations
          for (const annotation of annotations) {
            if (annotation.fieldName) {
              // Update field value if it exists in the fieldUpdates list AND if the value is currently empty
              // (it is autofill, not autoreplace)
              if (
                fieldUpdates.hasOwnProperty(annotation.fieldName) &&
                !annotation.fieldValue
              ) {
                const success = await setFieldValue(
                  pdf,
                  annotation.fieldName,
                  fieldUpdates[annotation.fieldName]
                );
                if (success) {
                  updatedFields[annotation.fieldName] = fieldUpdates[annotation.fieldName];
                } else {
                  console.error("Broken field on pdf:", annotation.fieldName);
                }
              } else {
                // Add to the updated fields object
                updatedFields[annotation.fieldName] =   annotation.checkBox ? (annotation.fieldValue === "Off" ? false : true) : annotation.fieldValue //annotation.radioButton? annotation.fieldValue : annotation.fieldValue;
                handleFieldChange(annotation.fieldName, annotation.checkBox ? (annotation.fieldValue === "Off" ? false : true) : annotation.fieldValue);
                // console.log(annotation)
              }
            }
          } 
        }
    
        setLoaded(true);
    
        if (pdf.annotationStorage.getModified())
        {
          // Save the modified PDF if any fields changed
          const newpdf = await pdf.saveDocument();
          const pdfBlob = new Blob([newpdf], { type: "application/pdf" });
          const blob = URL.createObjectURL(pdfBlob);
          setPdfUrl(blob);

        }
        
    
        return updatedFields; // Return all fields with their updated values
      } catch (error) {
        //console.error("Error updating and listing PDF fields:", error);
        return null;
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
        // else if (!fields) setFields(updatedFields)
        // else return
      })

      .catch((e) => {
        setTimeout(tryGetFields, 1000)
      })

    }
    // Only try once the document is loaded,
    if (pdfUrl)
    tryGetFields()

    
  }, [doc,  setFieldValue, getDoc, pdfUrl, getFields, updateFields, loaded, handleFieldChange])


  
  // If we expand the view to see the viewer, load the changes
  // useEffect(() => {
  //   if (loaded && useViewer) 
  //   {

  //     // Going from no viewer, to viewer.
  //     // Gather state fields, and set them on the doc
  //     async function enterViewer()
  //     {
        
  //       const pdfDocument = getDoc()
  //       for (const fieldName of Object.keys(fields))
  //       {
  //         console.log(fields[fieldName])
  //         var fObject = await getFieldObjById(pdfDocument, fieldName);
  //         if(!fObject) continue// The requested field does not exist, skip (will not add to state)
  //         pdfDocument.annotationStorage.setValue(fObject.id, {value: fields[fieldName]});

  //       }
      

  //     // Extract the updated data from the PDF viewer
  //     const newpdf = await pdfDocument.saveDocument();
  //     const pdfBlob = new Blob([newpdf], { type: "application/pdf" });
  //     const blob = URL.createObjectURL(pdfBlob);
  //     setPdfUrl(blob)

  //     }
      
  //     enterViewer()
  //   }

  // }, [loaded, useViewer, getDoc, getFieldObjById, fields])

  // // If we collapse to leave the viewer, save in state
  // useEffect(() => {
  //   if (loaded && !useViewer) 
  //   {

  //     // Going from viewer to no viewer
  //     // Gather pdf fields, and set them as state
  //     async function exitViewer()
  //     {
  //       setFields(await getFields())
  //     }

  //     exitViewer()

  //   }

  // }, [loaded, useViewer, getFields])

  // Save the document
  const saveDocument = async (complete) => {
    try {
      const pdfDocument = getDoc()
      // If we're not using the viewer, we need to populate the pdf first.
      if (!useViewer)
        for (const fieldName of Object.keys(fields))
        {
          await setFieldValue(pdfDocument, fieldName, fields[fieldName])
        }
      

      // Extract the updated data from the PDF viewer
      const pdfBlob = await pdfDocument.saveDocument();
      const pdfArrayBuffer = new Uint8Array(pdfBlob);
  
      const updatedDocument = {
        _id: doc._id,
        name: documentName,
        description: documentDesc,
        fields: getFields(), // If we're on desktop, we need to get fields from the iframe.
        templateId: doc.templateId,
        client: selectedClient,
        data: Array.from(pdfArrayBuffer),
        type: doc.type,
        modified: new Date().toISOString(),
        deadline: deadline,
        complete: complete,
        completed: complete
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
    doc._id ? saveDoc({ _id: doc._id }, true, false, true) : onBack();
  };

  // Convert input to a valid month datatype
// Convert input to a valid month datatype
// Convert input to a valid month datatype
function inputToDate(input) {
  // Clean input: remove whitespace and standardize separators (either / or -)
  input = input.replace(/-/g, '/').replace(/\s+/g, ' ').replace(/[-]/g, '/').trim();

  // Month names mapping
  const monthNames = {
      "january": 0, "jan": 0, "february": 1, "feb": 1, "march": 2, "mar": 2,
      "april": 3, "apr": 3, "may": 4, "june": 5, "jun": 5, "july": 6, "jul": 6,
      "august": 7, "aug": 7, "september": 8, "sep": 8, "october": 9, "oct": 9,
      "november": 10, "nov": 10, "december": 11, "dec": 11
  };

  // Match formats: mm/dd/yyyy, mm/dd, m/dd, mm/d, m/d
  const numericDateRegex = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/;
  const currentYear = new Date().getFullYear();

  // Check if the date matches numeric format (mm/dd/yy or mm/dd/yyyy)
  let match = input.match(numericDateRegex);
  if (match) {
      let month = parseInt(match[1], 10); // First part - month
      let day = parseInt(match[2], 10); // Second part - day
      let year = match[3] ? parseInt(match[3], 10) : currentYear; // Use current year if missing

      month = month - 1; // JS months are zero-based (0 for January, 1 for February)

      // Handle 2-digit year logic
      if (year < 100) {
          if (year > currentYear % 100) {
              year += 1900;
          } else {
              year += 2000;
          }
      }

      return new Date(year, month, day).toISOString().split('T')[0];
  }

  // Match formats like "month day, year" or "month day"
  const monthDayYearRegex = /^([a-zA-Z]+)\s+(\d{1,2})(?:,?\s+(\d{2,4}))?$/;

  // Handle month-day-year format like "Jan 16, 2020" or "January 16"
  match = input.match(monthDayYearRegex);
  if (match) {
      let month = match[1].toLowerCase();
      const day = parseInt(match[2], 10);
      let year = match[3] ? parseInt(match[3], 10) : currentYear;

      if (monthNames[month] !== undefined) {
          month = monthNames[month]; // Get month index (0 for January, 1 for February, etc.)
      } else {
          console.error("Invalid month name:", month);
          return new Date().toISOString().split('T')[0];
      }

      // Handle 2-digit year logic
      if (year < 100) {
          if (year > currentYear % 100) {
              year += 1900;
          } else {
              year += 2000;
          }
      }

      return new Date(year, month, day).toISOString().split('T')[0];
  }

  // Match formats like "m-d-yyyy", "m-d", "m-d-yy"
  const hyphenDateRegex = /^(\d{1,2})-(\d{1,2})(?:-(\d{2,4}))?$/;
  match = input.match(hyphenDateRegex);
  if (match) {
      let month = parseInt(match[1], 10);
      let day = parseInt(match[2], 10);
      let year = match[3] ? parseInt(match[3], 10) : currentYear;

      month = month - 1; // JS months are zero-based

      // Handle 2-digit year logic
      if (year < 100) {
          if (year > currentYear % 100) {
              year += 1900;
          } else {
              year += 2000;
          }
      }

      return new Date(year, month, day).toISOString().split('T')[0];
  }

  // If the input doesn't match any format, return today's date
  //console.log("Invalid date format:", input);
  return new Date().toISOString().split('T')[0];
}




  


  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden"}}>
      <BackButton onClick={onBack} />

      {/* Left: PDF Viewer */}
      <div style={{  display: useViewer? "inline-block" : "none", flex: 2, padding: "10px", borderRight: "1px solid #ccc" }}>
        {pdfUrl && (
          <iframe
            title="PDF Viewer"
            src={`/pdfjs/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`}
            style={{ width: "100%", height: "100%", border: "none"}}
            onLoad = {() => {
              
            }}
          ></iframe>
        )}
      </div>

      {/* Right: Input Fields */}
      <div
        style={{
          flex: 1,
          padding: 5,
          justifyContent: "space-between",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style = {{overflowY: "auto", padding: 5}}>
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
                    handleClientChange(client || null);
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

          <div>
          <form >
            {/* Whether on mobile or desktop, render date fields */}
            {!loaded && (
              <div style = {{display: "flex", alignContent: "center", alignSelf: "center", alignItems: "center"}}>
                <h3>Loading fields...</h3>

              </div>
            )}
          {loaded && fields && Object.entries(fields).filter(([key,value]) => key.toLowerCase().includes("date") || key.toLowerCase().includes("deadline")).map(([key, value]) => (
            
            <div className="form-floating mb-3" key={key}>
                <input
                    type="date"
                    className="form-control"
                    id={key}
                    value={inputToDate(value)}
                    onChange={(e) => handleFieldChange(key, e.target.value, true)}
                    placeholder={key}
                />
                
                <label htmlFor={key}>{key}</label>
            </div>
            ))}

{/* Render text and dropdowns */}
{fieldData &&
  !useViewer &&
  (() => {
    let currentGroup = null; // Track the current group
    let hasGroup = false; // Flag to check if we've rendered a group

    return Object.entries(fieldData).map(([key, { fieldType, fieldObj, value }], index, entries) => {
      if (key.toLowerCase().includes("date") || key.toLowerCase().includes("deadline")) return null;

      const [group, title] = key.includes(":") ? key.split(":") : [null, key]; // Split into group and title
      const isGroupStart = group && group !== currentGroup; // Check if we're starting a new group
      const isLastInGroup =
        group &&
        (index === entries.length - 1 || entries[index + 1][0]?.split(":")[0] !== group); // Last item in the group

      const groupLabel = isGroupStart ? (
        <>
          {currentGroup && hasGroup && <hr />} {/* Divider after the previous group */}
          <h4>{group}</h4> {/* Render group label */}
        </>
      ) : null;

      const groupDivider = isLastInGroup ? <hr /> : null; // Divider after the current group ends

      currentGroup = group || currentGroup; // Update the current group
      hasGroup = group ? true : hasGroup; // Mark that a group has been processed

      const renderField = () => {
        if (fieldType === "text") {
          return (
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                id={key}
                value={value}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                placeholder={key}
              />
              <label htmlFor={key}>{title || key}</label>
            </div>
          );
        } else if (fieldType === "combobox") {
          const options = fieldObj?.items.map((i) => i.displayValue) || [];
          return (
            <div className="form-floating mb-3">
              <select
                className="form-select"
                id={key}
                value={value}
                onChange={(e) => handleFieldChange(key, e.target.value)}
              >
                {options.map((option, idx) => (
                  <option key={idx} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <label htmlFor={key}>{title || key}</label>
            </div>
          );
        }
        return null;
      };

      return (
        <React.Fragment key={key}>
          {groupLabel}
          {renderField()}
          {groupDivider}
        </React.Fragment>
      );
    });
  })()}


  
        {/* Radios */}
        {fieldGroupsRadios &&
        !useViewer && Object.entries(fieldGroupsRadios).map(([group, radios]) => (
          <div key={group} className="mb-3">
            <label className="form-label">{group}</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {radios.map(({ key, option, isChecked}) => (
                <div key={key} className="form-check">
                  <input
                    type="radio"
                    className="form-check-input"
                    id={key}
                    name={group} // Group radios together
                    checked={isChecked}
                    onChange={() => {
                      // all others mut become unchecked (radio logic)
                      radios.forEach((radio) => {
                        handleFieldChange(
                          radio.key,
                          radio.key === key ? "On" : "Off"
                        );
                      });
                    }}
                  />
                  <label htmlFor={key} className="form-check-label">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Checkboxes */}
        {fieldGroupsBoxes &&
        !useViewer && Object.entries(fieldGroupsBoxes).map(([group, checkboxes]) => (
          <div key={group} className="mb-3">
            <label className="form-label">{group}</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {checkboxes.map(({ key, option, isChecked, isSingleSelect }) => (
                <div key={key} className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={key}
                    name={group} // Group radios together
                    checked={isChecked}
                    onChange={() => {
                      // Handle single selection
                      if (isSingleSelect) {
                        checkboxes.forEach((checkbox) => {
                          handleFieldChange(
                            checkbox.key,
                            checkbox.key === key && !isChecked ? true : false
                          );
                        });
                      } else {
                        handleFieldChange(key, isChecked ? false : true);
                      }
                    }}
                  />
                  <label htmlFor={key} className="form-check-label">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}

          </form>
          </div>
          

          
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 5 }}>
          <button disabled={!doc.data} className="btn btn-dark mt-3" onClick={deleteDoc}>
            {doc.completed ? "Delete" : "Discard"}
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
              {doc.completed ? "Mark Incomplete" : "Save"}
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
