When handling data persistence
- Prioritize Trickle Database over LocalStorage for all multi-device entities (Classes, Students, Teachers, Attendance).
- Use composite objectTypes for nested data (e.g., `student:classId`, `attendance:classId`).
- Always strip metadata (`id`, `objectId`, `createdAt`, `updatedAt`) from the data object before calling `trickleCreateObject` or `trickleUpdateObject`, as Trickle uses its own managed internal fields.
- Ensure data is re-fetched or synchronized after updates to maintain UI consistency across different user sessions.