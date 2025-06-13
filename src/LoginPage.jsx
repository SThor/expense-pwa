import PropTypes from "prop-types";

import CenteredCardLayout from "./components/CenteredCardLayout.jsx";

export default function LoginPage({ onLogin }) {
  return (
    <CenteredCardLayout>
      <h1 className="text-2xl font-bold mb-4 text-sky-700">Login</h1>
      <p className="mb-6 text-gray-600">
        This is a placeholder login page. Click below to simulate login.
      </p>
      <button
        className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded w-full"
        onClick={onLogin}
      >
        Login
      </button>
    </CenteredCardLayout>
  );
}

LoginPage.propTypes = {
  onLogin: PropTypes.func.isRequired,
};
