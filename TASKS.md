# PokeData Development Tasks

A structured task list for the PokeData application development. This file helps track planned features, improvements, and bug fixes.

## Status Legend
- 🔴 **Pending**: Not started
- 🟡 **In Progress**: Currently being worked on
- 🟢 **Completed**: Finished and tested

## Active Tasks

### Features

| Status | Priority | Task Description | Notes |
|--------|----------|-----------------|-------|
| 🟢 | High | Convert Card Name field to use SearchableSelect component | Provides dropdown of all cards in a set |
| 🔴 | High | Add card images in price results | Display the card image alongside pricing info |
| 🔴 | Medium | Implement price history graphs | Show price trends over time |
| 🔴 | Medium | Add collection management feature | Allow users to track cards they own |
| 🔴 | Low | Support for multiple pricing sources | Add more price sources beyond the current ones |

### Improvements

| Status | Priority | Task Description | Notes |
|--------|----------|-----------------|-------|
| 🔴 | High | Improve error handling | Better user feedback when API calls fail |
| 🟢 | Medium | Filter Zero-Value Pricing Results | Hide pricing sources that return $0 or null values |
| 🟢 | Low | Format Price Decimal Places | Display all prices with 2 decimal places |
| 🔴 | Medium | Enhance loading indicators | More visual feedback during loading states |
| 🔴 | Medium | Optimize caching strategy | Reduce API calls and improve performance |
| 🔴 | Low | Add dark mode support | For better viewing in low-light conditions |
| 🔴 | Low | Implement responsive design improvements | Better support for mobile devices |

### Bug Fixes

| Status | Priority | Task Description | Notes |
|--------|----------|-----------------|-------|
| 🔴 | High | Fix API response handling inconsistencies | Some responses aren't properly parsed |
| 🔴 | Medium | Address SearchableSelect dropdown positioning | Dropdown sometimes appears off-screen |

### Documentation

| Status | Priority | Task Description | Notes |
|--------|----------|-----------------|-------|
| 🔴 | Medium | Create user documentation | How-to guide for using the app |
| 🔴 | Medium | Improve code documentation | Add more detailed comments |
| 🔴 | Low | Create development setup guide | Instructions for new contributors |

## Completed Tasks

| Date | Task Description | Notes |
|------|-----------------|-------|
| 2025-03-16 | Convert Card Name field to use SearchableSelect component | Implemented dynamic loading of cards when a set is selected |
| 2025-03-16 | Filter Zero-Value Pricing Results | Added logic to filter out pricing sources with $0 or null values |
| 2025-03-16 | Format Price Decimal Places | Implemented toFixed(2) formatting for consistent decimal display |

## Next Release Goals

- Complete all high-priority tasks
- Address at least 50% of medium-priority tasks
- Implement comprehensive error handling

## Long-term Vision

- Full collection management system
- Price alerts and notifications
- Integration with trading platforms
- Community features for trading and selling
