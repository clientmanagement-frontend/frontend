import React from "react";
import Template from "./Template"; 
import { useNavigate } from "react-router-dom";

const Templates = (props) => {
    const navigate = useNavigate();

    let templates = props.templates


    
    return (
        <div>
            <div style = {{display: "flex", alignItems: "center", gap: 10}}>
                <h4 style = {{margin: 0, paddingLeft: 10}}>{props.title}</h4>
                <img
                    src={`add-button.png`}
                    alt="New Template"
                    style = {{cursor: "pointer", width: "25px", height: "25px"}}
                    onClick={() => {
                        props.setShowAddTemplate(true)
                        props.setCurrentTemplate(null)

                    }}
                    />
            </div>
            {templates?.length >= 0    && (
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
                {templates?.map((template, index) => (
                    <div
                        key={index}
                        style={{
                            flex: `0 0 calc(100% / ${Math.floor(
                                window.innerWidth / 400
                            )})`,
                            scrollSnapAlign: "start",
                            maxWidth: "400px"
                        }}
                    >
                        <Template template={template} onCreate={(template) => {navigate('/documents'); props.createDocument(template)}} onEdit={(template) => props.onEdit(template) } onBrowse={(template) => props.onBrowse(template)}/>
                    </div>
                ))}
            </div>
            )}
        </div>

    );
};

export default Templates;
