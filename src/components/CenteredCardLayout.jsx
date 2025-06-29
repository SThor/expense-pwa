import { motion } from "framer-motion";
import PropTypes from "prop-types";

import Version from "./Version.jsx";

export default function CenteredCardLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sky-50">
      <motion.div
        className="bg-white shadow rounded p-8 w-full max-w-md mb-10"
        initial={{ height: 0 }}
        animate={{ height: "auto" }}
        exit={{ height: 0 }}
        style={{ overflow: "hidden" }}
      >
        {children}
      </motion.div>
      <Version variant="short" />
    </div>
  );
}

CenteredCardLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
