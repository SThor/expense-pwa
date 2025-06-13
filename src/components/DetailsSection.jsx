import PropTypes from "prop-types";
import { forwardRef } from "react";

import { DEFAULT_SETTLEUP_CATEGORY } from "../constants";
import { formStatePropType } from "../propTypes";

import EmojiCategoryButton from "./EmojiCategoryButton.jsx";
import GroupedAutocomplete from "./GroupedAutocomplete.jsx";
import SuggestedCategoryPill from "./SuggestedCategoryPill.jsx";

const DetailsSection = forwardRef(function DetailsSection(props, ref) {
  const {
    formState,
    setFormState,
    groupedPayees,
    groupedCategories,
    categories,
    categoryGroups,
    suggestedCategoryIds,
  } = props;

  return (
    <div ref={ref}>
      <div>
        <label
          htmlFor="payee-autocomplete"
          className="block text-sm font-medium text-sky-700 mb-1"
        >
          Payee
        </label>
        <div className="flex items-center gap-2">
          <EmojiCategoryButton
            value={formState.settleUpCategory}
            onChange={(val) =>
              setFormState({ ...formState, settleUpCategory: val })
            }
          />
          <GroupedAutocomplete
            id="payee-autocomplete"
            value={formState.payee}
            onChange={(val, item) => {
              setFormState({
                ...formState,
                payee: val,
                payeeId: item && item.value ? item.value : "",
                // Reset settleUpCategory if payee is cleared
                settleUpCategory: val
                  ? formState.settleUpCategory
                  : DEFAULT_SETTLEUP_CATEGORY,
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
                  g.categories.some((c) => c.id === catId),
                );
                return (
                  <SuggestedCategoryPill
                    key={catId}
                    cat={cat}
                    group={group}
                    selected={formState.categoryId === catId}
                    onClick={() => {
                      setFormState({
                        ...formState,
                        category: cat.name,
                        categoryId: catId,
                      });
                    }}
                  />
                );
              })
              .filter(Boolean)}
          </div>
        </div>
      )}
      <div>
        <label
          htmlFor="category-autocomplete"
          className="block text-sm font-medium text-sky-700 mb-1"
        >
          Category
        </label>
        <GroupedAutocomplete
          id="category-autocomplete"
          value={formState.category}
          onChange={(val, item) => {
            let newSettleUpCategory = formState.settleUpCategory;
            if (
              newSettleUpCategory === DEFAULT_SETTLEUP_CATEGORY &&
              item &&
              item.label
            ) {
              // Regex to match emoji at the start
              const emojiMatch = item.label.match(/^\p{Emoji}/u);
              if (emojiMatch) {
                newSettleUpCategory = emojiMatch[0];
              }
            }
            setFormState({
              ...formState,
              category: val,
              categoryId: item && item.value ? item.value : "",
              settleUpCategory: newSettleUpCategory,
            });
          }}
          groupedItems={groupedCategories}
          placeholder="Category"
        />
      </div>
      <div>
        <label
          htmlFor="description-input"
          className="block text-sm font-medium text-sky-700 mb-1"
        >
          Description
        </label>
        <input
          id="description-input"
          className="input input-bordered w-full px-3 py-2 border rounded"
          type="text"
          placeholder="Description"
          value={formState.description}
          onChange={(e) =>
            setFormState({ ...formState, description: e.target.value })
          }
        />
      </div>
    </div>
  );
});

DetailsSection.propTypes = {
  formState: formStatePropType.isRequired,
  setFormState: PropTypes.func.isRequired,
  groupedPayees: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.any.isRequired,
        }),
      ).isRequired,
    }),
  ).isRequired,
  groupedCategories: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.any.isRequired,
        }),
      ).isRequired,
    }),
  ).isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.any.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  categoryGroups: PropTypes.arrayOf(
    PropTypes.shape({
      categories: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.any.isRequired,
        }),
      ).isRequired,
      name: PropTypes.string,
    }),
  ).isRequired,
  suggestedCategoryIds: PropTypes.arrayOf(PropTypes.any).isRequired,
};

export default DetailsSection;
