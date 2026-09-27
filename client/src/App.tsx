import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import RequireAuth from "./components/RequireAuth";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SignUpPage from "./pages/SignUpPage";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import AdminPage from "./pages/AdminPage";
import RequireAdmin from "./components/RequireAdmin";

function App() {
  const [isDark, setIsDark] = useState(false);

  return (
    <AppProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className={isDark ? "app-shell dark" : "app-shell"}>
            <Navbar isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<RequireAuth />}>
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/my-applications" element={<MyApplicationsPage />} />
              </Route>
              <Route element={<RequireAdmin />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
