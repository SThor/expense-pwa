import { useState } from "react";
import { useAppContext } from "../AppContext";

export default function SettleUpApiTestForm({ result, setResult }) {
  const {
    settleUpToken: token,
    setSettleUpToken: setToken,
    settleUpUserId: userId,
    setSettleUpUserId: setUserId,
    settleUpLoading: loadingToken,
    settleUpError: tokenError,
  } = useAppContext();
  const [groups, setGroups] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testGroup, setTestGroup] = useState(null);

  // List groups for the authenticated user
  const handleListGroups = async () => {
    if (!token || !userId) {
      setResult("Please load token first.");
      return;
    }
    setLoading(true);
    setResult("Loading groups...");
    try {
      const url = `https://settle-up-sandbox.firebaseio.com/userGroups/${userId}.json?auth=${token}`;
      const res = await fetch(url);
      const data = await res.json();
      setGroups(data);
      setResult(null);
    } catch (err) {
      setResult("Error fetching groups: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Find group named "test group"
  const handleFindTestGroup = async () => {
    if (!token || !userId || !groups) {
      setResult("Please load token and list groups first.");
      return;
    }
    setLoading(true);
    setResult("Searching for group named 'test group'...");
    try {
      const groupIds = Object.keys(groups);
      let found = null;
      for (const groupId of groupIds) {
        const url = `https://settle-up-sandbox.firebaseio.com/groups/${groupId}.json?auth=${token}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.name && data.name.trim().toLowerCase() === "test group") {
          found = { groupId, ...data };
          break;
        }
      }
      setTestGroup(found);
      setResult(found ? null : "No group named 'test group' found.");
    } catch (err) {
      setResult("Error searching for group: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-sky-700">Firebase Auth Token</label>
        <div className="flex gap-2">
          <input className="input input-bordered w-full px-3 py-2 border rounded" value={token} onChange={e => setToken(e.target.value)} placeholder="Paste token or load from .env" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-sky-700">User ID (Firebase UID)</label>
        <input className="input input-bordered w-full px-3 py-2 border rounded" value={userId} onChange={e => setUserId(e.target.value)} placeholder="Will be auto-filled from token" />
      </div>
      <button
        type="button"
        className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded w-full transition-colors"
        onClick={handleListGroups}
        disabled={loading || !token || !userId || loadingToken}
      >
        List My Groups
      </button>
      <button
        type="button"
        className="bg-sky-700 hover:bg-sky-800 text-white font-semibold px-4 py-2 rounded w-full transition-colors mt-2"
        onClick={handleFindTestGroup}
        disabled={loading || !token || !userId || !groups || loadingToken}
      >
        Find "test group"
      </button>
      {tokenError && <div className="text-sm text-red-700 whitespace-pre-wrap">{tokenError}</div>}
      {result && <div className="text-sm text-sky-700 whitespace-pre-wrap">{result}</div>}
      {groups && (
        <div className="mt-4">
          <div className="font-bold text-sky-700 mb-2">Groups:</div>
          <pre className="bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-x-auto max-h-60">{JSON.stringify(groups, null, 2)}</pre>
        </div>
      )}
      {testGroup && (
        <div className="mt-4">
          <div className="font-bold text-green-700 mb-2">Found "test group":</div>
          <pre className="bg-green-50 border border-green-200 rounded p-2 text-xs overflow-x-auto max-h-60">{JSON.stringify(testGroup, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
