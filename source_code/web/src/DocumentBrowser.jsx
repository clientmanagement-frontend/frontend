import BackButton from './BackButton';
import Document from './Document';
import DocumentEditor from './DocumentEditor';
import ClientList from './ClientList';
import { useNavigate } from 'react-router-dom';

const DocumentBrowser = (props) => {
  // Sort documents by `modified` date (most recent first)
  const sortedDocuments = [...props.documents].sort((a, b) => new Date(b.modified) - new Date(a.modified));
  const navigate = useNavigate();

  if (props.currentDocument)
    return (
      <DocumentEditor
        doc={props.currentDocument}
        onBack={() => props.setCurrentDocument(null)}
        user={props.user}
        saveDoc={props.saveDoc}
        clients={props.clients}
      />
    );

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Left Panel - ClientList */}
      <div>
        <ClientList
          clients={props.clients}
          onClientClick={(client) => {
            props.setCurrentClient(client);
            navigate("/");
          }}
          addClient={() => props.setShowAddClient(true)}
          search={props.search}
          setSearch={props.setSearch}
        />
      </div>

      <div style={{ display: "flex", flex: 1, flexDirection: "column" }}>
        <BackButton onClick={props.onBack} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between", padding: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="mb-3">
              <select
                className="form-select"
                id="client"
                value={props.currentTemplate ? props.currentTemplate._id : ""}
                onChange={(e) =>
                  props.setCurrentTemplate(
                    props.templates.find((t) => t._id === e.target.value)
                  )
                }
              >
                <option value="">All Documents</option>
                {props.templates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <img
              src={`add-button.png`}
              alt="New Task"
              style={{
                cursor: "pointer",
                width: "25px",
                height: "25px",
                position: "relative",
                top: "-7.5px",
              }}
              onClick={props.newDoc}
            />
          </div>

          {props.currentTemplate && (
            <button type="button" className="btn btn-light" onClick={props.onEdit}>
              Modify Template
            </button>
          )}
        </div>

        {/* Scrollable container for documents */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", // Dynamic columns
            gap: "10px",
            overflowY: "auto",
            height: "100%", // Restrict the div's height to avoid main page overflow
            padding: "10px"
          }}
        >
          {sortedDocuments.map((doc) => (
            <div key={doc._id}>
              <Document
                doc={doc}
                onClick={props.onClick}
                onComplete={props.onComplete}
                onSend={props.onSend}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentBrowser;
