# DnD Refactor Log - 2025-11-23

**Date**: 2025-11-23 00:21:43 EST
**Topic**: Expenses List Drag-and-Drop Refactor

## Summary
We undertook a significant refactor of the expenses list drag-and-drop (DnD) functionality to improve the mobile experience and fix visual glitches. The goal was to implement a "press and hold" gesture for mobile dragging and fix a broken placeholder.

## Changes Made

### 1. Press and Hold Implementation (Mobile)
-   **Objective**: Prevent accidental drags while scrolling on mobile.
-   **Implementation**:
    -   Configured `dnd-kit`'s `TouchSensor` with a delay. Initially 250ms, later reduced to 200ms.
    -   Added `isPressed` state to `DraggableExpenseItem`.
    -   Added visual feedback: Item scales down (0.98) and changes background color after 100ms of pressing.
    -   Added `touch-action: manipulation` to the draggable item to help the browser distinguish taps/scrolls.

### 2. Placeholder Fix
-   **Problem**: The manual `ExpensePlaceholder` component was causing layout shifts and overlapping items.
-   **Fix**:
    -   Removed `ExpensePlaceholder.tsx`.
    -   Implemented "live reordering" in `handleDragOver`. The list order updates immediately as you drag, allowing `dnd-kit` to manage the gap naturally.
    -   Added a **Skeleton Placeholder** inside `DraggableExpenseItem`. When `isDragging` is true, the original item renders as a dashed-border skeleton instead of disappearing, providing a clear visual cue of the drop position.

### 3. Mobile Safari Troubleshooting
-   **Issue**: DnD was not working on iPhone Safari (scrolling instead of dragging, or not activating).
-   **Attempts**:
    -   **Iteration 1**: Increased `TouchSensor` tolerance to 8px.
    -   **Iteration 2**: Forced `TouchSensor` usage on mobile (ignoring `PointerSensor`). Increased tolerance to 20px.
    -   **Iteration 3 (Current)**: Reduced delay to **200ms** and set tolerance to **5px** (strict). The logic is to capture the drag *before* the scroll starts, requiring the user to hold their finger still.

### 4. Cleanup
-   Removed the "Pull to Refresh" feature as it was conflicting with the drag gesture and was too sensitive.
-   Simplified `ExpenseItem` by removing the dedicated drag handle (entire card is draggable).

## Current Status
-   **Desktop/Web**: Works well.
-   **Mobile (Safari)**: Still problematic. The user reports that it "simply scrolls the screen" instead of dragging. The conflict between the browser's native scroll and the `dnd-kit` delay/tolerance is persistent.

## Final Implementation: Dedicated Drag Handle
**Date**: 2025-11-23 00:30:00 EST

### Decision
We moved away from the "press and hold" gesture because it conflicted with the native scroll behavior on iOS Safari. Even with delays and tolerance adjustments, the experience was flaky. We opted for a **dedicated drag handle** (grip icon) which provides a clear, conflict-free interaction model.

### Changes
1.  **Drag Handle**: Added a `GripVertical` icon to `ExpenseItem`. This is the *only* activator for the drag operation.
2.  **Sensor Config**: Reverted `dnd-kit` sensors to their standard configuration (no custom delays needed).
3.  **Cleanup**: Removed `isPressed` state and `setTimeout` logic from `DraggableExpenseItem`.

### Result
-   **Scrolling**: Works natively by touching anywhere on the card body.
-   **Dragging**: Works instantly by touching the grip handle.
-   **Conflict**: Resolved.

