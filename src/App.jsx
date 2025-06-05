import { useState } from "react";

export default function App() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState({ ynab: true, settleup: false });

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
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={target.ynab}
                onChange={e => setTarget(t => ({ ...t, ynab: e.target.checked }))}
              />
              <span>YNAB</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={target.settleup}
                onChange={e => setTarget(t => ({ ...t, settleup: e.target.checked }))}
              />
              <span>SettleUp</span>
            </label>
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