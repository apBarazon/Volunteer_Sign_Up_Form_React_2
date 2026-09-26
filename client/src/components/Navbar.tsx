import { Link } from "react-router-dom";

type NavbarProps = {
  isDark: boolean;
  onToggleTheme: () => void;
};

function Navbar({ isDark, onToggleTheme }: NavbarProps) {
  return (
    <nav className="navbar">
      <span className="brand">VolunteerPortal</span>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/my-applications">My Applications</Link>
        <button type="button" className="theme-toggle" onClick={onToggleTheme}>
          {isDark ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
