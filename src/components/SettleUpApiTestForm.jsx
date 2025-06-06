import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../AppContext";
import AmountInput from "./AmountInput";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { MdArrowDropDown } from "react-icons/md";
import EmojiCategoryButton from "./EmojiCategoryButton";
import { getMostCommonCategoryFromTransactions } from "../utils/settleupUtils";

export default function SettleUpApiTestForm({ result, setResult }) {
  const {
    settleUpToken: token,
    settleUpUserId: userId,
    settleUpLoading: loadingToken,
    settleUpError: tokenError,
  } = useAppContext();
  const [groups, setGroups] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testGroup, setTestGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [amountMilliunits, setAmountMilliunits] = useState(0);
  const [desc, setDesc] = useState("");
  const [payerId, setPayerId] = useState("");
  const [forWhomIds, setForWhomIds] = useState([]);
  const [currency, setCurrency] = useState("");
  const [category, setCategory] = useState("∅"); // default to null symbol
  // Autofill state
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [autofilledCategory, setAutofilledCategory] = useState("");
  const userChangedCategory = useRef(false);
  // Emoji picker dropdown state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef();

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return;
    function handleClick(e) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [showEmojiPicker]);

  // List groups for the authenticated user
  const handleListGroups = async () => {
    console.log('[SettleUp] handleListGroups called', { token, userId });
    if (!token || !userId) {
      setResult("Please load token first.");
      return;
    }
    setLoading(true);
    setResult("Loading groups...");
    try {
      const url = `https://settle-up-sandbox.firebaseio.com/userGroups/${userId}.json?auth=${token}`;
      console.log('[SettleUp] Fetching userGroups:', url);
      const res = await fetch(url);
      const data = await res.json();
      console.log('[SettleUp] userGroups response:', data);
      setGroups(data || {});
      setResult(null);
    } catch (err) {
      setResult("Error fetching groups: " + err.message);
      console.error('[SettleUp] Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  // Find group named "test group" or fallback to first group
  const handleFindTestGroup = async () => {
    console.log('[SettleUp] handleFindTestGroup called', { token, userId, groups });
    if (!token || !userId || !groups) {
      setResult("Please load token and list groups first.");
      return;
    }
    setLoading(true);
    setResult("Searching for group named 'test group'...");
    try {
      const groupIds = Object.keys(groups);
      console.log('[SettleUp] groupIds:', groupIds);
      let found = null;
      for (const groupId of groupIds) {
        const url = `https://settle-up-sandbox.firebaseio.com/groups/${groupId}.json?auth=${token}`;
        console.log('[SettleUp] Fetching group:', url);
        const res = await fetch(url);
        const data = await res.json();
        console.log('[SettleUp] group data:', data);
        if (data && data.name && data.name.trim().toLowerCase() === "test group") {
          found = { groupId, ...data };
          break;
        }
      }
      if (!found && groupIds.length > 0) {
        // Fallback: use first group
        const groupId = groupIds[0];
        const url = `https://settle-up-sandbox.firebaseio.com/groups/${groupId}.json?auth=${token}`;
        console.log('[SettleUp] Fallback fetching group:', url);
        const res = await fetch(url);
        const data = await res.json();
        console.log('[SettleUp] fallback group data:', data);
        found = { groupId, ...data };
        setResult("No group named 'test group' found. Using your first group instead.");
      } else {
        setResult(found ? null : "No group named 'test group' found.");
      }
      setTestGroup(found);
    } catch (err) {
      setResult("Error searching for group: " + err.message);
      console.error('[SettleUp] Error searching for group:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load groups on mount if token/userId available
  useEffect(() => {
    console.log('SettleUpApiTestForm context:', { loadingToken, tokenError, token, userId });
    if (!loadingToken && !tokenError && token && userId) {
      handleListGroups();
    }
  }, [loadingToken, tokenError, token, userId]);

  // When groups are loaded, find test group
  useEffect(() => {
    if (groups && token && userId) {
      handleFindTestGroup();
    }
  }, [groups, token, userId]);

  // Fetch members when testGroup changes
  async function fetchMembers(groupId) {
    if (!token || !groupId) return;
    try {
      const url = `https://settle-up-sandbox.firebaseio.com/members/${groupId}.json?auth=${token}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data) {
        const arr = Object.entries(data).map(([id, m]) => ({ id, ...m }));
        setMembers(arr);
        // Default: all active members for forWhom, first for payer
        setForWhomIds(arr.filter(m => m.active !== false).map(m => m.id));
        setPayerId(arr[0]?.id || "");
      }
    } catch (e) {
      setResult("Error fetching members: " + e.message);
    }
  }
  // Fetch group currency when testGroup changes
  function updateCurrency(group) {
    setCurrency(group?.convertedToCurrency || "EUR");
  }
  // React to testGroup
  useEffect(() => {
    if (testGroup && testGroup.groupId) {
      fetchMembers(testGroup.groupId);
      updateCurrency(testGroup);
    } else {
      setMembers([]);
      setCurrency("");
    }
  }, [testGroup]);

  // Check permissions for the current user in the group
  async function checkWritePermission(groupId) {
    if (!token || !userId || !groupId) return;
    try {
      const permUrl = `https://settle-up-sandbox.firebaseio.com/permissions/${groupId}.json?auth=${token}`;
      const res = await fetch(permUrl);
      const perms = await res.json();
      console.log('[SettleUp] permissions for group:', perms);
      if (!perms || !perms[userId] || (perms[userId].level !== 20 && perms[userId].level !== 30)) {
        setResult(
          <div className="text-red-700">
            You do not have write permission for this group.<br />
            Please ask the group owner to grant you write access in the Settle Up app.
          </div>
        );
      } else {
        console.log('[SettleUp] User has write permission.');
      }
    } catch (e) {
      setResult('Error checking permissions: ' + e.message);
      console.error('[SettleUp] Error checking permissions:', e);
    }
  }

  // When testGroup is loaded, check write permission and membership
  useEffect(() => {
    async function checkMemberships() {
      if (testGroup && testGroup.groupId && token && userId) {
        await checkWritePermission(testGroup.groupId);
        // Check if user is a member
        const membersUrl = `https://settle-up-sandbox.firebaseio.com/members/${testGroup.groupId}.json?auth=${token}`;
        const membersRes = await fetch(membersUrl);
        const members = await membersRes.json();
        const isMember = members && Object.values(members).some(m => m && m.active !== false && m.name && m.name.toLowerCase().includes('paul'));
        console.log('[SettleUp] members for group:', members);
        if (!isMember) {
          setResult(
            <div className="text-red-700">
              Your user is not a member of this group.<br />
              Please add yourself as a member in the Settle Up app.
            </div>
          );
        }
        // Check if userGroup node exists
        const userGroupUrl = `https://settle-up-sandbox.firebaseio.com/userGroups/${userId}/${testGroup.groupId}.json?auth=${token}`;
        const userGroupRes = await fetch(userGroupUrl);
        const userGroup = await userGroupRes.json();
        console.log('[SettleUp] userGroup node:', userGroup);
        if (!userGroup || Object.keys(userGroup).length === 0) {
          setResult(
            <div className="text-red-700">
              Your user is not linked to this group in userGroups.<br />
              Please join the group in the Settle Up app.
            </div>
          );
        }
      }
    }
    checkMemberships();
  }, [testGroup, token, userId]);

  // Handle transaction submit
  async function handleAddTransaction(e) {
    e.preventDefault();
    setResult("");
    if (!token || !testGroup?.groupId || amountMilliunits === 0 || !payerId || forWhomIds.length === 0) {
      setResult("❌ Please fill all required fields before submitting.");
      return;
    }
    // Convert milliunits to string amount (e.g. 1234 -> "1.23")
    const amount = (-amountMilliunits / 1000).toFixed(2);
    const now = Date.now();
    const tx = {
      category: category === "∅" ? "" : category,
      currencyCode: currency || "EUR",
      dateTime: now,
      items: [
        {
          amount: amount, // already string
          forWhom: forWhomIds.map(id => ({ memberId: id, weight: "1" }))
        }
      ],
      purpose: desc,
      type: "expense",
      whoPaid: [
        { memberId: payerId, weight: "1" }
      ],
      fixedExchangeRate: false, // add optional field as in docs
      exchangeRates: undefined, // not needed if currency matches group
      receiptUrl: undefined // not needed
    };
    console.log('[SettleUp] transaction payload:', tx);
    try {
      const url = `https://settle-up-sandbox.firebaseio.com/transactions/${testGroup.groupId}.json?auth=${token}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tx)
      });
      const data = await res.json();
      if (data && data.name) {
        setResult(
          <div>
            <div className="flex items-center gap-2 text-green-700 font-semibold">
              <span>✅ Transaction sent!</span>
              <span className="text-xs text-gray-500">(ID: {data.name})</span>
            </div>
            <pre className="mt-2 bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-x-auto max-h-40">{JSON.stringify(tx, null, 2)}</pre>
          </div>
        );
        setAmountMilliunits(0);
        setDesc("");
      } else {
        setResult("Error adding transaction: " + JSON.stringify(data));
      }
    } catch (e) {
      setResult("Error adding transaction: " + e.message);
    }
  }

  // Autofill category based on previous transactions with same description
  useEffect(() => {
    if (!desc || !testGroup?.groupId || !token) return;
    setAutofillLoading(true);
    setAutofilledCategory("");
    // Debounce: only fetch after user stops typing for 500ms
    const handler = setTimeout(async () => {
      try {
        const url = `https://settle-up-sandbox.firebaseio.com/transactions/${testGroup.groupId}.json?auth=${token}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data) {
          setAutofillLoading(false);
          return;
        }
        const transactions = Object.values(data);
        // Use shared utility with 'contains' match
        const mostCommon = getMostCommonCategoryFromTransactions(transactions, desc, 'purpose', 'contains');
        if (mostCommon) {
          setAutofilledCategory(mostCommon);
          if (!userChangedCategory.current) {
            setCategory(mostCommon);
          }
        }
        setAutofillLoading(false);
      } catch (e) {
        setAutofillLoading(false);
      }
    }, 500);
    return () => clearTimeout(handler);
    // eslint-disable-next-line
  }, [desc, testGroup?.groupId, token]);

  // Track if user manually changes category after autofill
  function handleCategoryChange(e) {
    setCategory(e.target.value);
    userChangedCategory.current = true;
  }
  // Reset userChangedCategory when desc changes
  useEffect(() => {
    userChangedCategory.current = false;
  }, [desc]);

  // UI
  if (loadingToken) {
    return <div className="text-sky-700">Loading Settle Up credentials...</div>;
  }
  if (tokenError) {
    return <div className="text-red-700 whitespace-pre-wrap">{tokenError}</div>;
  }

  return (
    <div className="space-y-4 w-full">
      {testGroup && (
        <div className="mt-4">
          {/* Transaction form */}
          <form className="space-y-3 mt-4" onSubmit={handleAddTransaction} autoComplete="off">
            <h3 className="text-md font-bold text-sky-700 mb-1">Add Transaction to Group</h3>
            <AmountInput value={amountMilliunits} onChange={setAmountMilliunits} />
            <div className="flex items-center gap-2">
              <EmojiCategoryButton value={category} onChange={setCategory} />
              <input
                className="input input-bordered w-full px-3 py-2 border rounded"
                type="text"
                placeholder="Description"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                style={{ height: 40 }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-700 mb-1">Payer</label>
              <select
                className="input input-bordered w-full px-3 py-2 border rounded"
                value={payerId}
                onChange={e => setPayerId(e.target.value)}
                required
              >
                <option value="">Select payer</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-700 mb-1">For Whom (split)</label>
              <div className="flex flex-wrap gap-2">
                {members.map(m => (
                  <label key={m.id} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={forWhomIds.includes(m.id)}
                      onChange={e => {
                        if (e.target.checked) setForWhomIds(ids => [...ids, m.id]);
                        else setForWhomIds(ids => ids.filter(id => id !== m.id));
                      }}
                    />
                    <span>{m.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded w-full"
              type="submit"
              disabled={amountMilliunits === 0 || !payerId || forWhomIds.length === 0}
            >
              Add Transaction
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
