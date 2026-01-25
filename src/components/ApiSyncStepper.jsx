import PropTypes from "prop-types";
import React from "react";
import { MdCheck, MdClose, MdCircle, MdMoreHoriz } from "react-icons/md";

const ApiSyncStepper = ({ state, context }) => {
  const currentState = state?.value || "idle";
  const formState = context?.formState;
  const results = context?.results || {};
  const errors = context?.errors || {};

  // Simplified step state determination
  const getStepState = (stepName) => {
    switch (stepName) {
      case "entry":
        return currentState === "idle" ? "current" : "success";

      case "ynab":
        if (!formState?.target?.ynab) return "disabled";
        // Check if we're in any syncing state
        if (
          currentState === "syncing" ||
          (typeof currentState === "object" && currentState.syncing)
        ) {
          // Try to get nested state from different possible structures
          const ynabState =
            state?.value?.syncing?.ynab ||
            (state?.value && typeof state.value === "object"
              ? state.value.syncing?.ynab
              : null);
          if (ynabState === "submitting") return "current";
          if (ynabState === "success") return "success";
          if (ynabState === "error") return "error";
          // If YNAB is targeted and we're syncing, show as current
          return "current";
        }
        if (results.ynab && !errors.ynab) return "success";
        if (errors.ynab) return "error";
        return "inactive";

      case "settleup":
        if (!formState?.target?.settleup) return "disabled";
        // Check if we're in any syncing state
        if (
          currentState === "syncing" ||
          (typeof currentState === "object" && currentState.syncing)
        ) {
          // Try to get nested state from different possible structures
          const settleupState =
            state?.value?.syncing?.settleup ||
            (state?.value && typeof state.value === "object"
              ? state.value.syncing?.settleup
              : null);
          if (settleupState === "submitting") return "current";
          if (settleupState === "success") return "success";
          if (settleupState === "error") return "error";
          // If SettleUp is targeted and we're syncing, show as current
          return "current";
        }
        if (results.settleup && !errors.settleup) return "success";
        if (errors.settleup) return "error";
        return "inactive";

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

  // Simplified color and line logic
  const getColor = (stepState) => {
    const colors = {
      current: "#3b82f6", // blue
      success: "#22c55e", // green
      error: "#ef4444", // red
      disabled: "#9ca3af", // gray
      inactive: "#9ca3af", // same gray as disabled
    };
    return colors[stepState] || colors.inactive;
  };

  const getOpacity = (stepState) => {
    return stepState === "inactive" ? 0.6 : 1;
  };

  // New line color logic
  const getLineColor = (startStep, endStep) => {
    const startColor = getColor(startStep);
    const endColor = getColor(endStep);

    // If both have same color, use that color
    if (startColor === endColor) {
      return startColor;
    }

    // Otherwise use end step color
    return endColor;
  };

  const getEntryToSplitColor = () => {
    // Priority to active branch if only one is active
    const ynabActive = steps.ynab !== "disabled";
    const settleupActive = steps.settleup !== "disabled";

    if (ynabActive && !settleupActive) {
      return getColor(steps.ynab);
    }
    if (settleupActive && !ynabActive) {
      return getColor(steps.settleup);
    }

    // If both active or both inactive, use entry color
    return getColor(steps.entry);
  };

  const getBranchToJoinColor = (branchStep) => {
    // If branch is disabled/inactive, keep branch color
    if (branchStep === "disabled" || branchStep === "inactive") {
      return getColor(branchStep);
    }

    // Otherwise use complete color
    return getColor(steps.complete);
  };

  const getJoinToCompleteColor = () => {
    // Use complete color
    return getColor(steps.complete);
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
    const opacity = stepState === "disabled" ? 0.5 : getOpacity(stepState);

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
    <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
  );

  const createLine = (x1, y1, x2, y2, stroke, strokeWidth = 3) => (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={stroke}
      strokeWidth={strokeWidth}
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

  // Calculate all line colors using new logic
  const entryToSplitColor = getEntryToSplitColor();
  const ynabBranchColor = getColor(steps.ynab);
  const settleupBranchColor = getColor(steps.settleup);
  const ynabToJoinColor = getBranchToJoinColor(steps.ynab);
  const settleupToJoinColor = getBranchToJoinColor(steps.settleup);
  const joinToCompleteColor = getJoinToCompleteColor();

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
      <div className="bg-white rounded-lg p-8 mb-4">
        <h3 className="text-lg font-semibold mb-6 text-gray-800">
          API Sync Progress
        </h3>

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
          <g opacity={steps.ynab === "disabled" ? 0.5 : getOpacity(steps.ynab)}>
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
          <g
            opacity={
              steps.settleup === "disabled" ? 0.5 : getOpacity(steps.settleup)
            }
          >
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
      </div>

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
