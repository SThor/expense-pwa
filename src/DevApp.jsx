import { useState } from "react";
import App from "./App";
import YnabApiTestForm from './components/YnabApiTestForm';
import { YnabProvider } from "./YnabContext";

export default function DevApp() {
  const [showAppOnly, setShowAppOnly] = useState(false);
  const [apiResult, setApiResult] = useState("");

  if (showAppOnly) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sky-50">
        <button className="underline text-sky-700 mb-4 self-start ml-8 mt-8" onClick={() => setShowAppOnly(false)}>
          ← Back to DevApp
        </button>
        <App />
      </div>
    );
  }

  return (
    <YnabProvider>
      <div className="min-h-screen flex flex-col items-center justify-center bg-sky-50">
        <div className="flex flex-row w-full max-w-7xl gap-12 px-4 items-stretch h-[calc(100vh-4rem)] mt-8 mb-4">
          {/* App column */}
          <div className="flex-1 flex flex-col gap-8 max-w-lg min-w-[26rem] justify-center h-full">
            <App />
          </div>
          {/* Dev API Form column */}
          <div className="flex-1 flex flex-col gap-8 max-w-lg min-w-[26rem] justify-center h-full">
            <div className="bg-white shadow rounded p-8 w-full h-full flex flex-col overflow-auto">
              <button className="underline text-sky-700 mb-8 mt-2 self-start ml-8" onClick={() => setShowAppOnly(true)}>
                Show App only
              </button>
              <YnabApiTestForm result={apiResult} setResult={setApiResult} />
            </div>
          </div>
          {/* API Result column */}
          <div className="flex-1 flex flex-col gap-8 max-w-lg min-w-[26rem] justify-center h-full">
            <div className="bg-white shadow rounded p-6 flex flex-col w-full h-full overflow-auto" style={{ alignSelf: 'stretch' }}>
              <h2 className="text-lg font-bold mb-2 text-sky-700">API Result</h2>
              <div className="text-sm break-words whitespace-pre-wrap flex-1 min-h-[2rem] overflow-auto">
                {apiResult ? apiResult : <span className="text-gray-400">No result yet.</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </YnabProvider>
  );
}
