import PropTypes from "prop-types";

export const formStatePropType = PropTypes.shape({
  payee: PropTypes.string,
  payeeId: PropTypes.string,
  settleUpCategory: PropTypes.string,
  account: PropTypes.shape({
    swile: PropTypes.bool,
    bourso: PropTypes.bool,
  }),
  target: PropTypes.shape({
    ynab: PropTypes.bool,
    settleup: PropTypes.bool,
  }),
  amountMilliunits: PropTypes.number,
  swileMilliunits: PropTypes.number,
  categoryId: PropTypes.string,
  category: PropTypes.string,
  description: PropTypes.string,
});
