import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { FaCheck, FaTimes, FaSpinner } from "react-icons/fa";

/**
 * Step status enum
 */
const StepStatus = {
  PENDING: "pending",
  ACTIVE: "active",
  COMPLETED: "completed",
  ERROR: "error",
};

/**
 * Individual step component in the stepper
 */
function Step({ label, status, isLast }) {
  const getStatusIcon = () => {
    switch (status) {
      case StepStatus.COMPLETED:
        return <FaCheck className="w-4 h-4 text-white" />;
      case StepStatus.ERROR:
        return <FaTimes className="w-4 h-4 text-white" />;
      case StepStatus.ACTIVE:
        return <FaSpinner className="w-4 h-4 text-white animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case StepStatus.COMPLETED:
        return "bg-green-500";
      case StepStatus.ERROR:
        return "bg-red-500";
      case StepStatus.ACTIVE:
        return "bg-blue-500";
      default:
        return "bg-gray-300";
    }
  };

  const getTextColor = () => {
    switch (status) {
      case StepStatus.COMPLETED:
        return "text-green-700";
      case StepStatus.ERROR:
        return "text-red-700";
      case StepStatus.ACTIVE:
        return "text-blue-700";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="flex items-center flex-1">
      <div className="flex flex-col items-center">
        <motion.div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor()}`}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {getStatusIcon()}
        </motion.div>
        <div
          className={`mt-2 text-xs font-medium text-center ${getTextColor()}`}
        >
          {label}
        </div>
      </div>
      {!isLast && (
        <div className="flex-1 h-0.5 mx-2 bg-gray-300">
          <motion.div
            className={`h-full ${status === StepStatus.COMPLETED ? "bg-green-500" : "bg-gray-300"}`}
            initial={{ width: "0%" }}
            animate={{ width: status === StepStatus.COMPLETED ? "100%" : "0%" }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </div>
  );
}

Step.propTypes = {
  label: PropTypes.string.isRequired,
  status: PropTypes.oneOf(Object.values(StepStatus)).isRequired,
  isLast: PropTypes.bool,
};

/**
 * Stepper component for visualizing workflow progress
 * Displays a horizontal progress indicator with steps
 */
export default function Stepper({ currentState, enableYNAB, enableSettleUp }) {
  // Define steps based on enabled services
  const steps = [];

  steps.push({ key: "prepare", label: "Prepare" });

  if (enableYNAB) {
    steps.push({ key: "ynab", label: "YNAB" });
  }

  if (enableSettleUp) {
    steps.push({ key: "settleup", label: "SettleUp" });
  }

  steps.push({ key: "complete", label: "Complete" });

  // Map state machine states to step statuses
  const getStepStatus = (stepKey) => {
    // Check for prepare step
    if (stepKey === "prepare") {
      if (currentState === "idle") return StepStatus.PENDING;
      if (currentState === "preparing") return StepStatus.ACTIVE;
      return StepStatus.COMPLETED;
    }

    // Check for YNAB step
    if (stepKey === "ynab") {
      if (
        currentState === "idle" ||
        currentState === "preparing"
      )
        return StepStatus.PENDING;
      if (currentState === "syncingYNAB") return StepStatus.ACTIVE;
      // Check if we have YNAB errors
      if (
        currentState === "ynabComplete" ||
        currentState === "syncingSettleUp" ||
        currentState === "checkResults" ||
        currentState === "success" ||
        currentState === "error"
      ) {
        // Will determine if error in parent component based on context
        return StepStatus.COMPLETED;
      }
      return StepStatus.PENDING;
    }

    // Check for SettleUp step
    if (stepKey === "settleup") {
      const beforeSettleUp = ["idle", "preparing", "syncingYNAB", "ynabComplete"];
      if (beforeSettleUp.includes(currentState)) return StepStatus.PENDING;
      if (currentState === "syncingSettleUp") return StepStatus.ACTIVE;
      if (
        currentState === "checkResults" ||
        currentState === "success" ||
        currentState === "error"
      ) {
        return StepStatus.COMPLETED;
      }
      return StepStatus.PENDING;
    }

    // Check for complete step
    if (stepKey === "complete") {
      if (currentState === "success") return StepStatus.COMPLETED;
      if (currentState === "error") return StepStatus.ERROR;
      return StepStatus.PENDING;
    }

    return StepStatus.PENDING;
  };

  return (
    <div className="w-full py-4" role="progressbar" aria-label="Sync progress">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <Step
            key={step.key}
            label={step.label}
            status={getStepStatus(step.key)}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

Stepper.propTypes = {
  currentState: PropTypes.string.isRequired,
  enableYNAB: PropTypes.bool,
  enableSettleUp: PropTypes.bool,
};

export { StepStatus };
