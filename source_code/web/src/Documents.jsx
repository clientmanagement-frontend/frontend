import React from 'react';
import Document from './Document';

const Documents = (props) => {
  const sortedDocuments = [...props.documents].sort((a, b) => new Date(b.modified) - new Date(a.modified));


  return (
    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
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

          {/* {props.currentTemplate && (
            <button type="button" className="btn btn-light" onClick={props.onEdit}>
              Modify Template
            </button>
          )} */}
        </div>

      <div
        style={{
            display: "flex",
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitScrollbar: "none",
            scrollSnapType: "x mandatory",
        }}
      >
        {sortedDocuments.map((doc) => (
          <div
            key={doc._id}
            style={{
                flex: `0 0 calc(100% / ${Math.floor(
                    window.innerWidth / 400
                )})`,
                scrollSnapAlign: "start",
                maxWidth: "400px",
                minWidth: "300px"
            }}
          >
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
  );
};

export default Documents;
