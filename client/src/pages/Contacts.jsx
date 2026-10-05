import ContactsSidebar from "../components/chats/ContactsSidebar";
import { useNavigate } from "react-router-dom";

function Contacts() {
  const navigate = useNavigate();

  return (
    <ContactsSidebar
      onBack={() => navigate("/messages")}
      onSelectContact={(contact) => {
        navigate("/messages", {
          state: {
            selectedContact: contact,
          },
        });
      }}
    />
  );
}

export default Contacts;
