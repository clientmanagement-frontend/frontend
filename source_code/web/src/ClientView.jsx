import BackButton from "./BackButton";

const ClientView = ({ client, onBack }) => {
    return (
        <div style={{ paddingLeft: "20px"}}>
            {/* Header with client name and back button */}
            <div style={{ display: "flex", alignItems: "center"}}>
                {/* Dynamic Back Button will change to relative on small screens */}
                <BackButton onClick={onBack} dynamic = {true}/>
                <h1>{client}</h1>
            </div>

            <p>This is the client view</p>
        </div>
    )
}

export default ClientView;