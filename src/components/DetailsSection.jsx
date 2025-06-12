import React, { forwardRef } from "react";
import EmojiCategoryButton from "./EmojiCategoryButton";
import GroupedAutocomplete from "./GroupedAutocomplete";
import SuggestedCategoryPill from "./SuggestedCategoryPill";
import { DEFAULT_SETTLEUP_CATEGORY } from "../constants";

const DetailsSection = forwardRef(function DetailsSection(
  {
    formState,
    setFormState,
    groupedPayees,
    groupedCategories,
    categories,
    categoryGroups,
    suggestedCategoryIds,
    handleCategoryChange,
  },
  ref
) {
  return (
    <div ref={ref}>
      <div>
        <label htmlFor="payee-autocomplete" className="block text-sm font-medium text-sky-700 mb-1">Payee</label>
        <div className="flex items-center gap-2">
          <EmojiCategoryButton value={formState.settleUpCategory} onChange={val => setFormState({ ...formState, settleUpCategory: val })} />
          <GroupedAutocomplete
            id="payee-autocomplete"
            value={formState.payee}
            onChange={(val, item) => {
              setFormState({
                ...formState,
                payee: val,
                payeeId: item && item.value ? item.value : "",
                settleUpCategory: val ? formState.settleUpCategory : DEFAULT_SETTLEUP_CATEGORY
              });
            }}
            groupedItems={groupedPayees}
            placeholder="Payee"
            onCreate={(val) => {
              setFormState({ ...formState, payee: val, payeeId: "" });
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
                    selected={formState.categoryId === catId}
                    onClick={() => {
                      setFormState({ ...formState, category: cat.name, categoryId: catId });
                    }}
                  />
                );
              })
              .filter(Boolean)}
          </div>
        </div>
      )}
      <div>
        <label htmlFor="category-autocomplete" className="block text-sm font-medium text-sky-700 mb-1">Category</label>
        <GroupedAutocomplete
          id="category-autocomplete"
          value={formState.category}
          onChange={handleCategoryChange}
          groupedItems={groupedCategories}
          placeholder="Category"
        />
      </div>
      <div>
        <label htmlFor="description-input" className="block text-sm font-medium text-sky-700 mb-1">Description</label>
        <input
          id="description-input"
          className="input input-bordered w-full px-3 py-2 border rounded"
          type="text"
          placeholder="Description"
          value={formState.description}
          onChange={(e) => setFormState({ ...formState, description: e.target.value })}
        />
      </div>
    </div>
  );
});

export default DetailsSection;
