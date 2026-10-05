import { NavLink } from "react-router-dom";
import { FiMessageSquare, FiUsers, FiPhone, FiUser } from "react-icons/fi";
import "../../styles/Sidebar.css";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <NavLink
          to="/messages"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <FiMessageSquare />
        </NavLink>
        <NavLink
          to="/contacts"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <FiUsers />
        </NavLink>
        <NavLink
          to="/calls"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <FiPhone />
        </NavLink>
      </div>

      <div className="sidebar-bottom">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <FiUser />
        </NavLink>
      </div>
    </aside>
  );
}
