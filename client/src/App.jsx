import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Diagnose from "./pages/Diagnose.jsx";
import Knowledge from "./pages/Knowledge.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="diagnose" element={<Diagnose />} />
        <Route path="knowledge" element={<Knowledge />} />
      </Route>
    </Routes>
  );
}
