When handling student class enrollment
- Always normalize join codes (trim and toUpperCase) before comparison.
- Use case-insensitive comparison for Student IDs when checking enrollment status.
- Add a slight delay (e.g., 100ms) after saving to storage before refreshing the UI to ensure data persistence consistency across all browsers.
- Ensure state feedback (success/error messages) is cleared immediately when user starts typing a new code.