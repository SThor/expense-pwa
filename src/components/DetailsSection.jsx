import PropTypes from "prop-types";
import { forwardRef } from "react";

import { fetchSettleUpTransactions } from "../api/settleup.js";
import { useAuth } from "../AuthProvider.jsx";
import { DEFAULT_SETTLEUP_CATEGORY } from "../constants";
import { formStatePropType } from "../propTypes";
import { getMostCommonCategoryFromTransactions } from "../utils/settleupUtils";

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

  const { token: settleUpToken } = useAuth();

  // Fonction commune pour extraire l'emoji et mettre à jour la catégorie
  const updateCategoryWithEmoji = (categoryName, categoryId) => {
    setFormState((prev) => {
      let newSettleUpCategory = prev.settleUpCategory;
      // Toujours extraire l'emoji si la catégorie en a un
      if (categoryName) {
        const emojiMatch = categoryName.match(/^\p{Emoji}/u);
        if (emojiMatch) {
          newSettleUpCategory = emojiMatch[0];
        }
      }
      return {
        ...prev,
        category: categoryName,
        categoryId: categoryId,
        settleUpCategory: newSettleUpCategory,
      };
    });
  };
  // Fonction pour l'autocomplétion SettleUp
  const triggerSettleUpAutocomplete = async (payeeName) => {
    if (!payeeName || !formState.settleUpGroup?.groupId || !settleUpToken)
      return;

    try {
      const data = await fetchSettleUpTransactions(
        settleUpToken,
        formState.settleUpGroup.groupId,
      );
      if (!data) return;
      const transactions = Object.values(data);
      const mostCommon = getMostCommonCategoryFromTransactions(
        transactions,
        payeeName,
      );
      if (mostCommon) {
        setFormState((prev) => ({ ...prev, settleUpCategory: mostCommon }));
      }
    } catch {
      // ignore autofill errors
    }
  };

  return (
    <div ref={ref}>
      <div>
        <label
          htmlFor="date-input"
          className="block text-sm font-medium text-sky-700 mb-1"
        >
          Date
        </label>
        <input
          id="date-input"
          type="date"
          className="unified-border input input-bordered w-full px-3 py-2"
          value={(() => {
            const d = formState.date instanceof Date ? formState.date : null;
            return d ? d.toISOString().slice(0, 10) : "";
          })()}
          onChange={(e) => {
            const val = e.target.value; // YYYY-MM-DD or ""
            if (!val) {
              setFormState((prev) => ({ ...prev, date: new Date() }));
              return;
            }
            // Parse at local midday to avoid any DST/UTC off-by-one surprises
            const d = new Date(`${val}T12:00:00`);
            setFormState((prev) => ({ ...prev, date: d }));
          }}
        />
      </div>
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
              setFormState((prev) => ({ ...prev, settleUpCategory: val }))
            }
          />
          <GroupedAutocomplete
            id="payee-autocomplete"
            value={formState.payee}
            onChange={(label, value) => {
              setFormState((prev) => ({
                ...prev,
                payee: label,
                payeeId: value,
                // Reset settleUpCategory if payee is cleared
                settleUpCategory: label
                  ? prev.settleUpCategory
                  : DEFAULT_SETTLEUP_CATEGORY,
              }));
              if (label) {
                triggerSettleUpAutocomplete(label);
              }
            }}
            groupedItems={groupedPayees}
            placeholder="Payee"
            onCreate={(val) => {
              setFormState((prev) => ({ ...prev, payee: val, payeeId: "" }));
            }}
            inputClassName="unified-border input input-bordered w-full px-3 py-2"
            placement="auto"
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
                      updateCategoryWithEmoji(cat.name, catId);
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
          onChange={(label, value) => {
            updateCategoryWithEmoji(label, value);
          }}
          groupedItems={groupedCategories}
          placeholder="Category"
          inputClassName="unified-border input input-bordered w-full px-3 py-2"
          placement="auto"
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
          className="unified-border input input-bordered w-full px-3 py-2"
          type="text"
          placeholder="Description"
          value={formState.description}
          onChange={(e) =>
            setFormState((prev) => ({ ...prev, description: e.target.value }))
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
