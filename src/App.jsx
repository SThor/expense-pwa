import { useState } from "react";
import YnabApiTestForm from './components/YnabApiTestForm';
import ToggleButton from "./components/ToggleButton";

export default function App() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState({ ynab: true, settleup: false });
  const [account, setAccount] = useState({ bourso: false, swile: false });
  const [apiResult, setApiResult] = useState(""); // <-- New state for API result

  function handleSubmit(e) {
    e.preventDefault();
    alert(
      `Would submit: $${amount} "${description}" to: ${[
        target.ynab && "YNAB",
        target.settleup && "SettleUp"
      ]
        .filter(Boolean)
        .join(", ")}`
    );
    // TODO: Add logic to call YNAB & SettleUp APIs here
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sky-50">
      <div className="flex flex-row w-full max-w-4xl gap-8">
        <div className="flex-1">
          <div className="bg-white shadow rounded p-8 w-full max-w-md mb-10">
            <h1 className="text-2xl font-bold mb-4 text-sky-700">Quick Expense Entry</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                className="input input-bordered w-full px-3 py-2 border rounded"
                type="number"
                step="0.01"
                placeholder="Amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
              <input
                className="input input-bordered w-full px-3 py-2 border rounded"
                type="text"
                placeholder="Description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
              <div className="flex gap-4">
                <ToggleButton
                  active={target.ynab}
                  color="#5C6CFA"
                  label="YNAB"
                  icon="/ynab-icon.png"
                  onClick={() => setTarget(t => ({ ...t, ynab: !t.ynab }))}
                />
                <ToggleButton
                  active={target.settleup}
                  color="#f2774a"
                  label="SettleUp"
                  icon="/settleup-icon.png"
                  onClick={() => setTarget(t => ({ ...t, settleup: !t.settleup }))}
                />
                <ToggleButton
                  active={account.bourso}
                  color="#d20073"
                  label="BoursoBank"
                  icon="/boursobank-icon.png"
                  onClick={() => setAccount(a => ({ ...a, bourso: !a.bourso }))}
                />
                <ToggleButton
                  active={account.swile}
                  gradientColors={[
                    "#FF0080", "#7928CA", "#007AFF", "#00FFE7",
                    "#00FF94", "#FFD600", "#FF4B1F", "#FF0080"
                  ]}
                  label="Swile"
                  icon="/swile-icon.png"
                  onClick={() => setAccount(a => ({ ...a, swile: !a.swile }))}
                />
              </div>
              <button
                className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded w-full"
                type="submit"
              >
                Add Transaction
              </button>
            </form>
          </div>

          {/* YNAB API test form for development/testing */}
          <div className="bg-white shadow rounded p-8 w-full max-w-md">
            <YnabApiTestForm result={apiResult} setResult={setApiResult} />
          </div>
        </div>
        {/* Side panel for API results */}
        <div className="w-96 min-w-[32rem] bg-white shadow rounded p-6 flex flex-col mt-2" style={{ height: 'auto', alignSelf: 'stretch' }}>
          <h2 className="text-lg font-bold mb-2 text-sky-700">API Result</h2>
          <div className="text-sm break-words whitespace-pre-wrap flex-1 min-h-[2rem] overflow-auto">
            {apiResult ? apiResult : <span className="text-gray-400">No result yet.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}