import BackButton from "./BackButton";

// What is document?
// do I provide template?
// No, document.template is the template
// it will always be apart of document, because it contains the info on how to construct it.
// we can also just have document.fields being a map of keys from the template to values.
//document._id will be the id of the finished document, one for each instantiation

const DocumentEditor = ({ document, onBack }) => { 
    return (
        <div style={{ display: "flex", height: "100vh" }}>
        <BackButton onClick={onBack} />
        <div style={{ flex: 1, padding: "10px", gap: 20, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h4 style={{ margin: 0, paddingLeft: 10 }}>Document</h4>
            </div>
            <div style={{ flex: 1 }}>
                <iframe
                    title="Document"
                    // srcDoc={props.currentDocument}
                    style={{ width: "100%", height: "100%", border: "none" }}
                ></iframe>
            </div>
        </div>
    </div>
    );
};

export default DocumentEditor;