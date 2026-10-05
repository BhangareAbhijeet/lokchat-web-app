import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getContacts } from "../../services/api";
import "../../styles/Contacts.css";

// ✅ Frontend avatar color palette (backend doesn't store colors)
const AVATAR_PALETTE = [
  { avatarColor: "#331c1c", textColor: "#f87171" },
  { avatarColor: "#1e2530", textColor: "#60a5fa" },
  { avatarColor: "#152233", textColor: "#38bdf8" },
  { avatarColor: "#2a1e33", textColor: "#c084fc" },
  { avatarColor: "#33231e", textColor: "#fb923c" },
];

function getAvatarStyle(name) {
  const index = name ? name.charCodeAt(0) % AVATAR_PALETTE.length : 0;
  return AVATAR_PALETTE[index];
}

// onSelectContact: called with the contact when a row is clicked (opens/starts that chat)
// onBack: called when the back arrow is clicked (returns to the chat list)
function ContactsSidebar({ onSelectContact, onBack }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getContacts()
      .then((res) => {
        // Backend sends: { _id, firstName, lastName, phone, profilePic: { url, public_id },
        //                   isOnline, lastSeen, email, ... }
        const mapped = res.data.map((u) => {
          const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim();
          const initials =
            (
              (u.firstName?.[0] || "") + (u.lastName?.[0] || "")
            ).toUpperCase() || "?";
          const displayName = fullName || u.phone || u.email || "Unknown User";
          const style = getAvatarStyle(displayName);

          return {
            id: u._id,
            name: displayName,
            status: u.isOnline ? "Online" : "Hey there! I am using LokChat",
            online: u.isOnline,
            photo: u.profilePic?.url || null,
            avatarColor: style.avatarColor,
            textColor: style.textColor,
            initials,
          };
        });
        setContacts(mapped);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch contacts:", err);
        setError("Could not load contacts");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="contacts-page">
      {/* LEFT CONTACTS SIDEBAR */}
      <aside className="contacts-sidebar">
        <div className="contacts-sidebar-header">
          <div className="contacts-title-row">
            <button
              className="contact-icon-btn"
              aria-label="Back to chats"
              onClick={onBack}
            >
              <BackIcon />
            </button>

            <h1>Contacts</h1>
          </div>
        </div>

        {/* Search */}
        <div className="contacts-search">
          <SearchIcon className="contacts-search-icon" />

          <input
            type="text"
            placeholder="Search contacts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* New Group */}
        <button className="action-row">
          <span className="action-icon">
            <PlusCircleIcon />
          </span>

          <span className="action-text">
            <span className="action-title">New Group</span>

            <span className="action-subtitle">Tap to create a group</span>
          </span>
        </button>

        {/* Invite Friends */}
        <button className="action-row">
          <span className="action-icon">
            <UserPlusIcon />
          </span>

          <span className="action-text">
            <span className="action-title">Invite Friends</span>

            <span className="action-subtitle">Invite friends to join</span>
          </span>
        </button>

        <div className="contacts-list-label">Contacts on LokChat</div>

        {loading && (
          <div className="contacts-status-msg contacts-loading">
            <span className="spinner"></span>
            Loading contacts...
          </div>
        )}

        {error && <div className="contacts-status-msg">{error}</div>}

        {!loading && !error && filteredContacts.length === 0 && (
          <div className="contacts-status-msg">No contacts found</div>
        )}

        {/* Contacts List */}
        <ul className="contacts-list">
          {filteredContacts.map((contact) => (
            <li
              key={contact.id}
              className="contact-item"
              onClick={() => onSelectContact(contact)}
            >
              {/* Avatar */}
              <div
                className="profile-avatar"
                style={{
                  background: contact.avatarColor,
                  color: contact.textColor,
                }}
                onClick={(e) => {
                  e.stopPropagation();

                  navigate(`/contactinfo/${contact.id}`, {
                    state: { contact },
                  });
                }}
              >
                {contact.photo ? (
                  <img src={contact.photo} alt={contact.name} />
                ) : (
                  contact.initials
                )}

                {contact.online && <span className="status-dot"></span>}
              </div>

              {/* Contact Details */}
              <div className="contact-info">
                <span className="contact-name">{contact.name}</span>

                <span className="contact-status">{contact.status}</span>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* RIGHT EMPTY CHAT AREA */}
      <div className="contacts-empty">
        <h1>LokChat</h1>

        <p>Select a contact to start chatting</p>

        <span>🔒 Your messages are private and secure</span>
      </div>
    </div>
  );
}

/* --- Inline icon components (same set as your Contacts.jsx, plus BackIcon) --- */

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <line
        x1="19"
        y1="12"
        x2="5"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <polyline
        points="12 19 5 12 12 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <circle
        cx="11"
        cy="11"
        r="7"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <line
        x1="21"
        y1="21"
        x2="16.65"
        y2="16.65"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path
        d="M12 3a5 5 0 00-5 5v3.5c0 .6-.2 1.2-.6 1.7L5 15h14l-1.4-1.8c-.4-.5-.6-1.1-.6-1.7V8a5 5 0 00-5-5z"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 18a2.5 2.5 0 005 0"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <line
        x1="12"
        y1="5"
        x2="12"
        y2="19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="5"
        y1="12"
        x2="19"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
      />
      <line
        x1="12"
        y1="8"
        x2="12"
        y2="16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="12"
        x2="16"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <circle
        cx="9"
        cy="8"
        r="3.2"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M3.5 19c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <line
        x1="18"
        y1="8"
        x2="18"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="15"
        y1="11"
        x2="21"
        y2="11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default ContactsSidebar;
