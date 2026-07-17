import PropTypes from "prop-types";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import ApiSyncStatus from "./components/ApiSyncStatus.jsx";
import { API_STATUS } from "./hooks/useApiSync";
import "./index.css";

const SAMPLE_STATES = [
  {
    title: "Idle",
    ynab: { status: API_STATUS.IDLE, error: null },
    settleup: { status: API_STATUS.IDLE, error: null },
  },
  {
    title: "Fetching",
    ynab: { status: API_STATUS.FETCHING, error: null },
    settleup: { status: API_STATUS.FETCHING, error: null },
  },
  {
    title: "Mixed",
    ynab: { status: API_STATUS.READY, error: null },
    settleup: { status: API_STATUS.FETCHING, error: null },
  },
  {
    title: "Enter error",
    ynab: { status: API_STATUS.SUCCESS, error: null },
    settleup: {
      status: API_STATUS.ENTER_ERROR,
      error: "Temporary network issue",
    },
  },
  {
    title: "Fetch error",
    ynab: { status: API_STATUS.FETCH_ERROR, error: "YNAB auth expired" },
    settleup: { status: API_STATUS.SUCCESS, error: null },
  },
  {
    title: "Success",
    ynab: { status: API_STATUS.SUCCESS, error: null },
    settleup: { status: API_STATUS.SUCCESS, error: null },
  },
];

function PreviewCard({ title, ynab, settleup }) {
  return (
    <section
      style={{
        border: "1px solid rgba(148,163,184,0.25)",
        borderRadius: 16,
        padding: 20,
        background: "rgba(15,23,42,0.72)",
        boxShadow: "0 20px 50px rgba(15,23,42,0.18)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#94a3b8",
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <ApiSyncStatus
        ynab={ynab}
        settleup={settleup}
        onRetryYnab={() => {}}
        onRetrySettleup={() => {}}
      />
    </section>
  );
}

PreviewCard.propTypes = {
  title: PropTypes.string.isRequired,
  ynab: PropTypes.shape({
    status: PropTypes.string.isRequired,
    error: PropTypes.string,
  }).isRequired,
  settleup: PropTypes.shape({
    status: PropTypes.string.isRequired,
    error: PropTypes.string,
  }).isRequired,
};

function App() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background:
          "radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 34%), linear-gradient(180deg, #0f172a 0%, #111827 100%)",
        color: "#e5e7eb",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <header style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#94a3b8",
              marginBottom: 8,
            }}
          >
            Preview
          </div>
          <h1 style={{ fontSize: 34, lineHeight: 1.05, margin: 0 }}>
            ApiSyncStatus
          </h1>
          <p
            style={{
              maxWidth: 720,
              color: "#cbd5e1",
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            Static preview of the inline status component with the current brand
            colors, spinner, success, and error states.
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {SAMPLE_STATES.map((sample) => (
            <PreviewCard key={sample.title} {...sample} />
          ))}
        </div>
      </div>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
