import { AnimatePresence, motion } from "framer-motion";
import PropTypes from "prop-types";
import { useState } from "react";

const Collapsible = ({ isOpened, children }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  return (
    <AnimatePresence>
      {isOpened && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          style={{ overflow: isAnimating ? "hidden" : "visible" }}
          onAnimationStart={() => setIsAnimating(true)}
          onAnimationComplete={() => setIsAnimating(false)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

Collapsible.propTypes = {
  isOpened: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

export default Collapsible;
