import React from "react";
import EmojiCategoryButton from "./EmojiCategoryButton";
import GroupedAutocomplete from "./GroupedAutocomplete";
import SuggestedCategoryPill from "./SuggestedCategoryPill";

export default function DetailsSection({
  payee,
  setPayee,
  payeeId,
  setPayeeId,
  groupedPayees,
  settleUpCategory,
  setSettleUpCategory,
  DEFAULT_SETTLEUP_CATEGORY,
  suggestedCategoryIds,
  categories,
  categoryGroups,
  category,
  setCategory,
  categoryId,
  setCategoryId,
  groupedCategories,
  handleCategoryChange,
  description,
  setDescription,
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-sky-700 mb-1">Payee</label>
        <div className="flex items-center gap-2">
          <EmojiCategoryButton value={settleUpCategory} onChange={setSettleUpCategory} />
          <GroupedAutocomplete
            value={payee}
            onChange={(val, item) => {
              setPayee(val);
              setPayeeId(item && item.value ? item.value : "");
              if (!val) setSettleUpCategory(DEFAULT_SETTLEUP_CATEGORY);
            }}
            groupedItems={groupedPayees}
            placeholder="Payee"
            onCreate={(val) => {
              setPayee(val);
              setPayeeId("");
            }}
          />
        </div>
      </div>
      {suggestedCategoryIds.length > 0 && (
        <div>
          <div className="text-sm text-gray-600 mb-2 font-semibold">
            Suggested categories:
          </div>
          <div className="flex flex-wrap gap-2 mb-1">
            {suggestedCategoryIds
              .map((catId) => {
                const cat = categories.find((c) => c.id === catId);
                if (!cat) return null;
                const group = categoryGroups.find((g) =>
                  g.categories.some((c) => c.id === catId)
                );
                return (
                  <SuggestedCategoryPill
                    key={catId}
                    cat={cat}
                    group={group}
                    selected={categoryId === catId}
                    onClick={() => {
                      setCategory(cat.name);
                      setCategoryId(catId);
                    }}
                  />
                );
              })
              .filter(Boolean)}
          </div>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-sky-700 mb-1">Category</label>
        <GroupedAutocomplete
          value={category}
          onChange={handleCategoryChange}
          groupedItems={groupedCategories}
          placeholder="Category"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-sky-700 mb-1">Description</label>
        <input
          className="input input-bordered w-full px-3 py-2 border rounded"
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </>
  );
}
