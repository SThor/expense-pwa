import React from "react";

export default function ReviewSection({
  amountMilliunits,
  swileMilliunits,
  payee,
  category,
  description,
  target,
  account,
  settleUpCategory,
}) {
  if (!amountMilliunits) return null;
  return (
    <div className="bg-sky-100 rounded p-3 mb-4 text-sm">
      <div className="font-semibold mb-1">Review Transaction:</div>
      <div>Total: <span className="font-mono">{(amountMilliunits / -1000).toFixed(2)} €</span></div>
      {account.swile && (
        <div>Swile paid: <span className="font-mono">{(swileMilliunits / -1000).toFixed(2)} €</span></div>
      )}
      <div>Payee: <span className="font-mono">{payee || '-'}</span></div>
      <div>Category: <span className="font-mono">{category || '-'}</span></div>
      <div>Description: <span className="font-mono">{description || '-'}</span></div>
      <div>Apps: <span className="font-mono">{[target.ynab && 'YNAB', target.settleup && 'SettleUp'].filter(Boolean).join(', ')}</span></div>
      <div>Accounts: <span className="font-mono">{[account.bourso && 'BoursoBank', account.swile && 'Swile'].filter(Boolean).join(', ') || '-'}</span></div>
      {target.settleup && (
        <div>SettleUp Emoji: <span className="font-mono">{settleUpCategory}</span></div>
      )}
    </div>
  );
}
