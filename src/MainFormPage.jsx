import React from "react";
import { Link } from "react-router-dom";
import App from "./App";
import CenteredCardLayout from "./components/CenteredCardLayout";

export default function MainFormPage() {
  return (
    <CenteredCardLayout>
      <div className="flex justify-between mb-4">
        <span />
        <Link to="/login" className="text-sky-600 underline">Logout</Link>
      </div>
      <App />
    </CenteredCardLayout>
  );
}
