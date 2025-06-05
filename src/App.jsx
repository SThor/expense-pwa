import { useState } from "react";
import ToggleButton from "./components/ToggleButton";
import { FaPiggyBank, FaUsers } from "react-icons/fa"; // Example icons

export default function App() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState({ ynab: true, settleup: false });
  const [account, setAccount] = useState({ bourso: false, swile: false });

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
      <div className="bg-white shadow rounded p-8 w-full max-w-md">
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
    </div>
  );
}