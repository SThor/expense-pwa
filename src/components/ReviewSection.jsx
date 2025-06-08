import React, { forwardRef } from "react";

const ReviewSection = forwardRef(function ReviewSection(props, ref) {
  if (!props.amountMilliunits) return null;
  return (
    <div ref={ref} className="bg-sky-100 rounded p-3 mb-4 text-sm">
      <div className="font-semibold mb-1">Review Transaction:</div>
      <div>
        Total:{" "}
        <span className="font-mono">
          {(props.amountMilliunits / -1000).toFixed(2)} €
        </span>
      </div>
      {props.account.swile && (
        <div>
          Swile paid:{" "}
          <span className="font-mono">
            {(props.swileMilliunits / -1000).toFixed(2)} €
          </span>
        </div>
      )}
      <div>
        Payee: <span className="font-mono">{props.payee || "-"}</span>
      </div>
      <div>
        Category: <span className="font-mono">{props.category || "-"}</span>
      </div>
      <div>
        Description: <span className="font-mono">{props.description || "-"}</span>
      </div>
      <div>
        Apps:{" "}
        <span className="font-mono">
          {[props.target.ynab && "YNAB", props.target.settleup && "SettleUp"]
            .filter(Boolean)
            .join(", ")}
        </span>
      </div>
      <div>
        Accounts:{" "}
        <span className="font-mono">
          {[props.account.bourso && "BoursoBank", props.account.swile && "Swile"]
            .filter(Boolean)
            .join(", ") || "-"}
        </span>
      </div>
      {props.target.settleup && (
        <div>
          SettleUp Emoji:{" "}
          <span className="font-mono">{props.settleUpCategory}</span>
        </div>
      )}
    </div>
  );
});

export default ReviewSection;
