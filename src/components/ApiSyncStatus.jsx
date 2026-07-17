import PropTypes from "prop-types";
import { MdCheck, MdClose, MdHourglassEmpty } from "react-icons/md";

import { API_STATUS } from "../hooks/useApiSync";

// ─── Brand colors ──────────────────────────────────────────────────────────────

const YNAB_COLOR = "#5C6CFA";
const SETTLEUP_COLOR = "#f2774a";

// ─── Inline spinner SVG ────────────────────────────────────────────────────────

function Spinner({ color }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      style={{ display: "inline", verticalAlign: "middle" }}
      aria-hidden="true"
    >
      <style>
        {`
          @keyframes api-spin { to { transform: rotate(360deg); } }
          .api-spinner { transform-origin: 7px 7px; animation: api-spin 0.8s linear infinite; }
        `}
      </style>
      <circle cx="7" cy="7" r="5.5" stroke={color} strokeOpacity="0.25" strokeWidth="2" />
      <path
        className="api-spinner"
        d="M7 1.5A5.5 5.5 0 0 1 12.5 7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

Spinner.propTypes = {
  color: PropTypes.string.isRequired,
};

// ─── Status icon ───────────────────────────────────────────────────────────────

function StatusIcon({ status, color }) {
  const style = { verticalAlign: "middle", color };
  if (status === API_STATUS.FETCHING || status === API_STATUS.ENTERING) {
    return <Spinner color={color} />;
  }
  if (status === API_STATUS.SUCCESS) return <MdCheck style={style} />;
  if (status === API_STATUS.FETCH_ERROR || status === API_STATUS.ENTER_ERROR) {
    return <MdClose style={style} />;
  }
  if (status === API_STATUS.READY) return <MdHourglassEmpty style={style} />;
  return null;
}

StatusIcon.propTypes = {
  status: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};

// ─── Status labels ─────────────────────────────────────────────────────────────

const LABELS = {
  [API_STATUS.FETCHING]: "fetching data…",
  [API_STATUS.FETCH_ERROR]: "failed to fetch",
  [API_STATUS.READY]: "ready",
  [API_STATUS.ENTERING]: "submitting…",
  [API_STATUS.SUCCESS]: "done",
  [API_STATUS.ENTER_ERROR]: "submission failed",
};

// ─── Single API chip ───────────────────────────────────────────────────────────

function ApiChip({ name, syncState, color, onRetry }) {
  const { status, error } = syncState;
  const label = LABELS[status];
  if (!label) return null; // idle or skipped → hidden

  const canRetry =
    status === API_STATUS.FETCH_ERROR || status === API_STATUS.ENTER_ERROR;

  return (
    <span className="inline-flex items-center gap-1 text-sm" style={{ color }}>
      <StatusIcon status={status} color={color} />
      <span>
        {name} {label}
      </span>
      {canRetry && (
        <button
          type="button"
          onClick={(event) => {
            event.currentTarget.disabled = true;
            onRetry();
          }}
          title={error || undefined}
          className="underline text-xs ml-1 cursor-pointer bg-transparent border-none p-0"
          style={{ color }}
        >
          retry
        </button>
      )}
    </span>
  );
}

ApiChip.propTypes = {
  name: PropTypes.string.isRequired,
  syncState: PropTypes.shape({
    status: PropTypes.string.isRequired,
    error: PropTypes.string,
  }).isRequired,
  color: PropTypes.string.isRequired,
  onRetry: PropTypes.func.isRequired,
};

// ─── Main component ────────────────────────────────────────────────────────────

/**
 * Compact inline dual-API status summary.
 * Renders nothing when both APIs are idle/skipped.
 *
 * Example:  [spinner] YNAB submitting…  |  [check] SettleUp done
 */
export default function ApiSyncStatus({
  ynab,
  settleup,
  onRetryYnab,
  onRetrySettleup,
}) {
  const showYnab =
    ynab.status !== API_STATUS.IDLE && ynab.status !== API_STATUS.SKIPPED;
  const showSettleup =
    settleup.status !== API_STATUS.IDLE &&
    settleup.status !== API_STATUS.SKIPPED;

  if (!showYnab && !showSettleup) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-sm">
      {showYnab && (
        <ApiChip
          name="YNAB"
          syncState={ynab}
          color={YNAB_COLOR}
          onRetry={onRetryYnab}
        />
      )}
      {showYnab && showSettleup && (
        <span className="text-gray-300 select-none" aria-hidden="true">
          |
        </span>
      )}
      {showSettleup && (
        <ApiChip
          name="SettleUp"
          syncState={settleup}
          color={SETTLEUP_COLOR}
          onRetry={onRetrySettleup}
        />
      )}
    </div>
  );
}

ApiSyncStatus.propTypes = {
  ynab: PropTypes.shape({
    status: PropTypes.string.isRequired,
    error: PropTypes.string,
  }).isRequired,
  settleup: PropTypes.shape({
    status: PropTypes.string.isRequired,
    error: PropTypes.string,
  }).isRequired,
  onRetryYnab: PropTypes.func.isRequired,
  onRetrySettleup: PropTypes.func.isRequired,
};
