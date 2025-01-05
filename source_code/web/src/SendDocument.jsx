import React, { useState, useEffect } from "react";

const SendDocument = ({
  clients,
  close,
  onSend,
  doc,
  currentClient,
  setEditingClient,
  settings,
  user
}) => {
  const dateToString = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
    });
  };

  const replacements = {
    DOCTYPE: doc.type,
    DOCNAME: doc.name,
    DOCDESC: doc.description,
    COMPANY: user.company,
    ME: user.name,
    CLIENT: doc.client ? doc.client.name : "all"
  };

  function replacePlaceholders(template) {
    let result = template;
    for (const [placeholder, value] of Object.entries(replacements)) {
      const regex = new RegExp(`\\$${placeholder}\\$`, "g"); // Create a dynamic regex to match the placeholder
      result = result.replace(regex, value);
    }
    return result;
  }
  

  const [body, setBody] = useState(replacePlaceholders(`${settings?.defaultEmailBody ?? ""}${settings?.includeDeadlines && doc.fields.deadline ? `\n\nPlease kindly reply by ${dateToString(doc.deadline)}`:""}\n\n${replacePlaceholders(settings?.defaultEmailFooter ?? "")}`));
  const [subject, setSubject] = useState(replacePlaceholders(settings?.defaultEmailSubject ?? ""));
  const [dueDate, setDueDate] = useState(""); // Date input
  const [curClient, setCurClient] = useState(currentClient);
  const [method, setMethod] = useState(curClient?.email ? "Email" : ""); // Contact method dropdown

  useEffect(() => {

    setMethod(curClient?.email ? "Email" : "")
  }, [curClient])

  const handleSend = () => {
    const due = dueDate ? new Date(dueDate) : null;

    const msg = {
      body,
      subject,
      due,
      client: curClient, // Entire client object
      method,
    };

    onSend(doc, msg);
  };

  const currentClientHasContactInfo =
    !curClient ||
    ((typeof (curClient.phone === "string") && (curClient.phone.trim() !== "" )) ||
    ((typeof curClient.email === "string") && (curClient.email.trim() !== "")));

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
            <h5 className="modal-title">Send {doc.type} form</h5>
            <button
              type="button"
              className="btn-close"
              onClick={close}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            {curClient && !currentClientHasContactInfo ? (
              <div>
                <p>{curClient.name} does not have any contact information.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setEditingClient(true)}
                >
                  Add Contact Info
                </button>
              </div>
            ) : (
              <form>
                <div className="form-floating mb-3">
                  <select
                    className="form-select"
                    id="client"
                    value={curClient?._id || ""}
                    onChange={(e) =>
                      setCurClient(
                        clients.find((client) => client._id === e.target.value)
                      )
                    }
                    aria-label="For"
                  >
                    <option value="">Everybody</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="client">To</label>
                </div>
                <div className="form-floating mb-3">
                  <select
                    className="form-select"
                    id="method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    aria-label="Method"
                  >
                    <option value="">Select Method</option>
                    {(typeof curClient?.phone === "string") &&
                      (curClient.phone.trim() !== "") && (
                        <option value="Text">Text</option>
                      )}
                    {((((typeof curClient?.email === "string") &&
                      (curClient.email.trim() !== "")) || !curClient)) && (
                        <option value="Email">Email</option>
                      )}
                      {(typeof curClient?.phone === "string") &&
                      (curClient.phone.trim() !== "") && (
                        <option value="Both">Both</option>
                      )}
                  </select>
                  <label htmlFor="method">Method</label>
                </div>
                <div className="form-floating mb-3">
                  
                  <input
                    type="text"
                    className="form-control"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter subject line"
                    required
                  />

                <label htmlFor="subject">
                    Subject
                  </label>
                </div>
                <div className="form-floating mb-3">
                  
                  <textarea
                  style = {{height: 130}}
                    className="form-control"
                    id="description"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Enter message body"
                  ></textarea>

                <label htmlFor="description" >
                    Body
                  </label>
                </div>
                <div className="form-floating mb-3">
                  
                  <input
                    type="date"
                    className="form-control"
                    id="dueDate"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <label htmlFor="dueDate">
                    Send on
                  </label>
                </div>
              </form>
            )}
          </div>
          <div className="modal-footer">
            <div style={{ display: "flex", justifyContent: "right", flex: 1 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-secondary" onClick={close}>
                  Cancel
                </button>
                {currentClientHasContactInfo && method && (
                  <button className="btn btn-primary" onClick={() => {
                    navigator.clipboard.writeText(`${subject}\n\n${body}`);
                    handleSend();
                  }}>
                    Send
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendDocument;
