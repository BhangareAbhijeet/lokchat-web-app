    import React, { useState, useRef, useEffect } from "react";
    import { FiSearch, FiMoreVertical, FiUsers } from "react-icons/fi";

    const ChatListSidebar = ({
      chats,
      loading,
      error,
      search,
      setSearch,
      selectedChat,
      setSelectedChat,
      onShowContacts,
    }) => {
      const [showMenu, setShowMenu] = useState(false);
      const menuRef = useRef(null);
      const getInitials = (name = "") => {
        const parts = name.trim().split(" ").filter(Boolean);

        if (parts.length === 0) return "?";
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
      };

      const filteredChats = chats.filter((chat) =>
        chat.name.toLowerCase().includes(search.toLowerCase()),
      );

      useEffect(() => {
        const handleClickOutside = (e) => {
          if (menuRef.current && !menuRef.current.contains(e.target)) {
            setShowMenu(false);
          }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }, []);

      return (
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Chats</h2>

            <div className="menu-container" ref={menuRef}>
              <button
                className="menu-icon-btn"
                onClick={() => setShowMenu((prev) => !prev)}
              >
                <FiMoreVertical className="menu-icon" />
              </button>

              {showMenu && (
                <div className="dropdown-menu">
                  <div
                    className="dropdown-item"
                    onClick={() => {
                      setShowMenu(false);
                      onShowContacts();
                    }}
                  >
                    <FiUsers size={17} />
                    <span>Contacts</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading && (
            <div className="chat-list-status">
              <span className="spinner" />
              Loading chats...
            </div>
          )}
          {error && <div className="chat-list-status">{error}</div>}
          {!loading && !error && filteredChats.length === 0 && (
            <div className="chat-list-status">No chats found</div>
          )}

          <div className="chat-list">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-card ${
                  selectedChat?.id === chat.id ? "selected" : ""
                }`}
                onClick={() => setSelectedChat(chat)}
              >
                <div
                  className="chat-avatar"
                  style={{
                    background: chat.photo ? "transparent" : chat.avatarColor,
                    color: chat.textColor,
                  }}
                >
                  {chat.photo ? (
                    <img
                      src={chat.photo}
                      alt={chat.name}
                      className="avatar-image"
                    />
                  ) : (
                    <span>{getInitials(chat.name)}</span>
                  )}
                  {chat.online && <span className="online-dot"></span>}
                </div>
                <div className="chat-info">
                  <div className="top">
                    <h4>{chat.name}</h4>
                    <span>{chat.time}</span>
                  </div>

                  <div className="bottom">
                    <p>{chat.message}</p>
                    {chat.unread > 0 && (
                      <span className="badge">{chat.unread}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      );
    };

    export default ChatListSidebar;
