# Changelog

## [1.1.0] - 2025-07-23

### New Features

- Loading screen and euro loading spinner components to prevent login page flash during auto-login
- Comprehensive test suite for LoginPage, AppContext, AmountInput, and ReviewPage components
- Input constraint validation for AmountInput component (min/max support)
- YNAB token management in AppContext with enhanced authentication flow

### Bug Fixes

- Swile amount validation: now properly capped between 0€ and transaction amount
- Smart Bourso split logic: eliminates unnecessary split transactions when Swile covers full amount
- YNAB API key input display issues

### Improvements

- Refactored transaction creation logic for better maintainability
- Improved error handling and validation throughout the application
- Enhanced UI components with better accessibility
- Removed unnecessary labels in ToggleButton component
- Cleaned-up redundant split transaction logic for full Swile coverage scenarios
- Updated dependencies: ESLint 9.31.0, TailwindCSS 4.1.11, PostCSS 8.5.6

## [1.0.0] - 2025-07-04

Initial public release of Expense PWA

### Added

- YNAB integration: add expenses directly to your YNAB budget
- SettleUp integration: sync shared expenses with SettleUp groups
- Swile support: handle Swile meal voucher amounts
- Smart category suggestions based on transaction history
- Location-based payee suggestions
- Real-time sync between platforms
- Modern, responsive UI with Tailwind CSS and Framer Motion
- PWA features: offline support, installable on any device
- Firebase Auth for secure authentication
- Version display system based on git
- Automated build, test, and deployment workflows
