import PropTypes from "prop-types";
import React from "react";
import { MdCheck, MdClose, MdCircle, MdMoreHoriz } from "react-icons/md";

// Color constants
const COLORS = {
  current: "#3b82f6", // blue
  success: "#22c55e", // green
  error: "#ef4444", // red
  disabled: "#9ca3af", // gray
  inactive: "#9ca3af", // same gray (but semantically different)
};

const ApiSyncStepper = ({ state, context }) => {
  const currentState = state?.value || "idle";
  const formState = context?.formState;
  const results = context?.results || {};
  const errors = context?.errors || {};

  // Helper function for API step state logic (ynab/settleup)
  const getApiStepState = (apiName) => {
    if (!formState?.target?.[apiName]) return "disabled";

    // Check if we're in any syncing state
    if (
      currentState === "syncing" ||
      (typeof currentState === "object" && currentState.syncing)
    ) {
      // Try to get nested state from different possible structures
      const apiState =
        state?.value?.syncing?.[apiName] ||
        (state?.value && typeof state.value === "object"
          ? state.value.syncing?.[apiName]
          : null);
      if (apiState === "submitting") return "current";
      if (apiState === "success") return "success";
      if (apiState === "error") return "error";
      // If API is targeted and we're syncing, show as current
      return "current";
    }
    if (results[apiName] && !errors[apiName]) return "success";
    if (errors[apiName]) return "error";
    return "inactive";
  };

  // Simplified step state determination
  const getStepState = (stepName) => {
    switch (stepName) {
      case "entry":
        return currentState === "idle" ? "current" : "success";

      case "ynab":
      case "settleup":
        return getApiStepState(stepName);

      case "complete":
        return ["success", "error", "partialSuccess"].includes(currentState)
          ? currentState === "success"
            ? "success"
            : currentState === "error"
              ? "error"
              : "inactive"
          : "inactive";

      default:
        return "inactive";
    }
  };

  const steps = {
    entry: getStepState("entry"),
    ynab: getStepState("ynab"),
    settleup: getStepState("settleup"),
    complete: getStepState("complete"),
  };

  // Simplified color logic
  const getColor = (stepState) => {
    return COLORS[stepState] || COLORS.inactive;
  };

  const getOpacity = (stepState) => {
    return stepState === "disabled" ? 0.5 : 1;
  };

  // Line color based on destination step
  const getLineColor = (endStepState, branchIsDisabled = false) => {
    // If on a disabled branch, use disabled color
    if (branchIsDisabled) return getColor("disabled");
    // Otherwise use the destination step's color
    return getColor(endStepState);
  };

  const StepIcon = ({ stepState, size = 24 }) => {
    const iconProps = { size, color: "white" };

    switch (stepState) {
      case "success":
        return <MdCheck {...iconProps} />;
      case "error":
        return <MdClose {...iconProps} />;
      case "current":
        return <MdMoreHoriz {...iconProps} />;
      default:
        return <MdCircle {...iconProps} size={12} />;
    }
  };

  StepIcon.propTypes = {
    stepState: PropTypes.string,
    size: PropTypes.number,
  };

  const StepCircle = ({ stepState, label, x, y }) => {
    const color = getColor(stepState);
    // Only apply disabled opacity to API steps after entry completes
    const isApiStep = label === "YNAB" || label === "SettleUp";
    const opacity =
      isApiStep && steps.entry !== "success" ? 1 : getOpacity(stepState);

    return (
      <g opacity={opacity}>
        {/* Pulse animation for current state */}
        {stepState === "current" && (
          <circle cx={x} cy={y} r="24" fill={color} opacity="0.3">
            <animate
              attributeName="r"
              from="20"
              to="28"
              dur="1.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              from="0.3"
              to="0"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        )}

        {/* Main circle */}
        <circle
          cx={x}
          cy={y}
          r="20"
          fill={color}
          stroke="white"
          strokeWidth="3"
        />

        {/* Icon using foreignObject to embed React component */}
        <foreignObject x={x - 12} y={y - 12} width="24" height="24">
          <div className="flex items-center justify-center w-full h-full">
            <StepIcon stepState={stepState} />
          </div>
        </foreignObject>

        {/* Label */}
        <text
          x={x}
          y={y + 45}
          textAnchor="middle"
          fill="#374151"
          fontSize="14"
          fontWeight="500"
        >
          {label}
        </text>
      </g>
    );
  };

  StepCircle.propTypes = {
    stepState: PropTypes.string,
    label: PropTypes.string,
    x: PropTypes.number,
    y: PropTypes.number,
  };

  // Helper function to create path elements
  const createPath = (d, stroke, strokeWidth = 3) => (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  );

  const createLine = (x1, y1, x2, y2, stroke, strokeWidth = 3) => (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  );

  // SVG layout configuration
  const layout = {
    width: 800,
    height: 280,
    entryX: 100,
    splitX: 220,
    branchX: 400,
    joinX: 580,
    completeX: 700,
    centerY: 140,
    ynabY: 80,
    settleupY: 200,
    cornerRadius: 15,
  };

  // Calculate line colors based on destination steps
  const getEntryToSplitColor = () => {
    const activeBranches = [steps.ynab, steps.settleup].filter(
      (step) => step !== "disabled",
    );

    // If no active branches, use disabled color
    if (activeBranches.length === 0) return getColor("disabled");

    // If only one active branch, use its color
    if (activeBranches.length === 1) return getColor(activeBranches[0]);

    // Both active - return color by priority: error > current > success > inactive
    const statePriority = ["error", "current", "success", "inactive"];

    for (const state of statePriority) {
      if (activeBranches.includes(state)) return getColor(state);
    }

    return getColor(steps.entry); // fallback
  };

  const entryToSplitColor = getEntryToSplitColor();
  const ynabBranchColor = getLineColor(steps.ynab, steps.ynab === "disabled");
  const settleupBranchColor = getLineColor(
    steps.settleup,
    steps.settleup === "disabled",
  );
  const ynabToJoinColor = getLineColor(
    steps.complete,
    steps.ynab === "disabled",
  );
  const settleupToJoinColor = getLineColor(
    steps.complete,
    steps.settleup === "disabled",
  );
  const joinToCompleteColor = getLineColor(steps.complete);

  // Extract error information
  const errorList = [];
  ["ynab", "settleup"].forEach((api) => {
    const error = context?.errors?.[api];
    if (error) {
      errorList.push({
        api: api === "ynab" ? "YNAB" : "SettleUp",
        message:
          typeof error === "string" ? error : error.message || "Unknown error",
      });
    }
  });

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="w-full h-auto"
      >
        {/* Main horizontal line from Entry to split */}
        {createLine(
          layout.entryX + 20,
          layout.centerY,
          layout.splitX - layout.cornerRadius,
          layout.centerY,
          entryToSplitColor,
        )}

        {/* YNAB branch */}
        <g opacity={steps.entry === "success" ? getOpacity(steps.ynab) : 1}>
          {/* Split to YNAB - use YNAB color for the corner */}
          {createPath(
            `M ${layout.splitX - layout.cornerRadius} ${layout.centerY} 
               Q ${layout.splitX} ${layout.centerY}, ${layout.splitX} ${layout.centerY - layout.cornerRadius}`,
            ynabBranchColor,
          )}
          {createLine(
            layout.splitX,
            layout.centerY - layout.cornerRadius,
            layout.splitX,
            layout.ynabY + layout.cornerRadius,
            ynabBranchColor,
          )}
          {createPath(
            `M ${layout.splitX} ${layout.ynabY + layout.cornerRadius}
               Q ${layout.splitX} ${layout.ynabY}, ${layout.splitX + layout.cornerRadius} ${layout.ynabY}`,
            ynabBranchColor,
          )}
          {createLine(
            layout.splitX + layout.cornerRadius,
            layout.ynabY,
            layout.branchX - 20,
            layout.ynabY,
            ynabBranchColor,
          )}

          {/* YNAB to join - use branch-to-join color */}
          {createLine(
            layout.branchX + 20,
            layout.ynabY,
            layout.joinX - layout.cornerRadius,
            layout.ynabY,
            ynabToJoinColor,
          )}
          {createPath(
            `M ${layout.joinX - layout.cornerRadius} ${layout.ynabY}
               Q ${layout.joinX} ${layout.ynabY}, ${layout.joinX} ${layout.ynabY + layout.cornerRadius}`,
            ynabToJoinColor,
          )}
          {createLine(
            layout.joinX,
            layout.ynabY + layout.cornerRadius,
            layout.joinX,
            layout.centerY - layout.cornerRadius,
            ynabToJoinColor,
          )}
          {/* Corner from YNAB vertical to center horizontal */}
          {createPath(
            `M ${layout.joinX} ${layout.centerY - layout.cornerRadius}
               Q ${layout.joinX} ${layout.centerY}, ${layout.joinX + layout.cornerRadius} ${layout.centerY}`,
            ynabToJoinColor,
          )}
        </g>

        {/* SettleUp branch */}
        <g opacity={steps.entry === "success" ? getOpacity(steps.settleup) : 1}>
          {/* Split to SettleUp - use SettleUp color for the corner */}
          {createPath(
            `M ${layout.splitX - layout.cornerRadius} ${layout.centerY}
               Q ${layout.splitX} ${layout.centerY}, ${layout.splitX} ${layout.centerY + layout.cornerRadius}`,
            settleupBranchColor,
          )}
          {createLine(
            layout.splitX,
            layout.centerY + layout.cornerRadius,
            layout.splitX,
            layout.settleupY - layout.cornerRadius,
            settleupBranchColor,
          )}
          {createPath(
            `M ${layout.splitX} ${layout.settleupY - layout.cornerRadius}
               Q ${layout.splitX} ${layout.settleupY}, ${layout.splitX + layout.cornerRadius} ${layout.settleupY}`,
            settleupBranchColor,
          )}
          {createLine(
            layout.splitX + layout.cornerRadius,
            layout.settleupY,
            layout.branchX - 20,
            layout.settleupY,
            settleupBranchColor,
          )}

          {/* SettleUp to join - use branch-to-join color */}
          {createLine(
            layout.branchX + 20,
            layout.settleupY,
            layout.joinX - layout.cornerRadius,
            layout.settleupY,
            settleupToJoinColor,
          )}
          {createPath(
            `M ${layout.joinX - layout.cornerRadius} ${layout.settleupY}
               Q ${layout.joinX} ${layout.settleupY}, ${layout.joinX} ${layout.settleupY - layout.cornerRadius}`,
            settleupToJoinColor,
          )}
          {createLine(
            layout.joinX,
            layout.settleupY - layout.cornerRadius,
            layout.joinX,
            layout.centerY + layout.cornerRadius,
            settleupToJoinColor,
          )}
          {/* Corner from SettleUp vertical to center horizontal */}
          {createPath(
            `M ${layout.joinX} ${layout.centerY + layout.cornerRadius}
               Q ${layout.joinX} ${layout.centerY}, ${layout.joinX + layout.cornerRadius} ${layout.centerY}`,
            settleupToJoinColor,
          )}
        </g>

        {/* Final line to complete */}
        {createLine(
          layout.joinX + layout.cornerRadius,
          layout.centerY,
          layout.completeX - 20,
          layout.centerY,
          joinToCompleteColor,
        )}

        {/* Step circles */}
        <StepCircle
          stepState={steps.entry}
          label="Entry"
          x={layout.entryX}
          y={layout.centerY}
        />
        <StepCircle
          stepState={steps.ynab}
          label="YNAB"
          x={layout.branchX}
          y={layout.ynabY}
        />
        <StepCircle
          stepState={steps.settleup}
          label="SettleUp"
          x={layout.branchX}
          y={layout.settleupY}
        />
        <StepCircle
          stepState={steps.complete}
          label="Complete"
          x={layout.completeX}
          y={layout.centerY}
        />
      </svg>

      {/* Error Display */}
      {errorList.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2">Errors</h4>
          {errorList.map((error, idx) => (
            <div key={idx} className="text-red-700 text-sm mb-1">
              <span className="font-medium">{error.api}:</span> {error.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

ApiSyncStepper.propTypes = {
  state: PropTypes.shape({
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        syncing: PropTypes.shape({
          ynab: PropTypes.string,
          settleup: PropTypes.string,
        }),
      }),
    ]),
  }),
  context: PropTypes.shape({
    formState: PropTypes.shape({
      target: PropTypes.shape({
        ynab: PropTypes.bool,
        settleup: PropTypes.bool,
      }),
    }),
    results: PropTypes.object,
    errors: PropTypes.object,
  }),
};

export default ApiSyncStepper;
