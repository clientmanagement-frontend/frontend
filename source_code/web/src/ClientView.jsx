import BackButton from "./BackButton";

const ClientView = ({ client, onBack, onEdit }) => {
    return (
        <div style={{ paddingLeft: "20px"}}>
            {/* Header with client name and back button */}
            <div style={{ display: "flex", alignItems: "center"}}>
                {/* Dynamic Back Button will change to relative on small screens */}
                <BackButton onClick={onBack} dynamic = {true}/>
                <div
                    
                >
                    <h2 
                        onClick={() => onEdit(client)}
                        style={{
                        borderBottom: "1px solid #eee",
                        cursor: "pointer",
                        transition: "font-weight 0.2s",
                        fontWeight: 100
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.fontWeight = 200)}
                        onMouseLeave={(e) => (e.currentTarget.style.fontWeight = 100)}>

                    {client.name}</h2>

                </div>
            </div>

            <div>
                {client.address && (<p style = {{padding: 0, margin: 0}}>{client.address}</p>)}
                {/* {client.phone && (<p style = {{padding: 0, margin: 0}}>{client.phone}</p>)}
                {client.email && (<p style = {{padding: 0, margin: 0}}>{client.email}</p>)} */}
            </div>

        </div>
    )
}

export default ClientView;