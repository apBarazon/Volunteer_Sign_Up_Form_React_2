import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import MyApplicationsPage from "./pages/MyApplicationsPage";

function App() {
  const [isDark, setIsDark] = useState(false);

  return (
    <AppProvider>
      <BrowserRouter>
        <div className={isDark ? "app-shell dark" : "app-shell"}>
          <Navbar isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/my-applications" element={<MyApplicationsPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
