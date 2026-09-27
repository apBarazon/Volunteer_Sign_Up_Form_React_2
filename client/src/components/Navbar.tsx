import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type NavbarProps = {
  isDark: boolean;
  onToggleTheme: () => void;
};

function Navbar({ isDark, onToggleTheme }: NavbarProps) {
  const { account, logout } = useAuth();

  return (
    <nav className="navbar">
      <span className="brand">VolunteerPortal</span>
      <div className="nav-links">
        <Link to="/">Home</Link>
        {account ? (
          <>
            <Link to="/my-applications">My Applications</Link>
            {account.role === "admin" && <Link to="/admin">Admin Panel</Link>}
            <button type="button" className="nav-button" onClick={logout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
        <button type="button" className="theme-toggle" onClick={onToggleTheme}>
          {isDark ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
