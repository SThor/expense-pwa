import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Component to display sync messages and errors
 * Preserves all messages without overwrites
 */
export default function SyncMessages({ messages, errors }) {
  const allItems = [
    ...messages.map((m) => ({ ...m, isError: false })),
    ...errors.map((e) => ({ ...e, isError: true })),
  ];

  if (allItems.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      <AnimatePresence>
        {allItems.map((item, index) => (
          <motion.div
            key={`${item.type}-${index}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`p-3 rounded-md text-sm ${
              item.isError
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            <div className="font-semibold">
              {item.type === "ynab" ? "YNAB" : "SettleUp"}
              {item.isError ? " Error" : " Success"}
            </div>
            <div className="mt-1 whitespace-pre-wrap">{item.message}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

SyncMessages.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
    }),
  ),
  errors: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
    }),
  ),
};

SyncMessages.defaultProps = {
  messages: [],
  errors: [],
};
