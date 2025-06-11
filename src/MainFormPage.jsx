import React from "react";
import { useAppContext } from "./AppContext";
import App from "./App";
import CenteredCardLayout from "./components/CenteredCardLayout";

export default function MainFormPage() {
  const { logout } = useAppContext();
  return (
    <CenteredCardLayout>
      <div className="flex justify-between mb-4">
        <span />
        <button
          className="text-sky-600 underline bg-transparent border-none cursor-pointer p-0"
          onClick={logout}
        >
          Logout
        </button>
      </div>
      <App />
    </CenteredCardLayout>
  );
}
