import { getActionLabel, getStatusLabel } from "@/lib/accessibility";

/**
 * Hook that provides ARIA labels for common UI actions
 * Makes it easy to add proper accessibility labels throughout the app
 */
export function useAriaLabels() {
  return {
    /**
     * Get an ARIA label for an action button
     * @example getActionLabel("edit", "Pipeline 1") => "Edit Pipeline 1"
     * @example getActionLabel("delete") => "Delete"
     */
    getActionLabel,

    /**
     * Get an ARIA label for a status indicator
     * @example getStatusLabel("active") => "Status: Active"
     * @example getStatusLabel("running") => "Status: Running"
     */
    getStatusLabel,

    /**
     * Get an ARIA label for a create button
     */
    getCreateLabel: (itemType: string) => `Create new ${itemType}`,

    /**
     * Get an ARIA label for a refresh button
     */
    getRefreshLabel: (itemType?: string) =>
      itemType ? `Refresh ${itemType} list` : "Refresh",

    /**
     * Get an ARIA label for a search input
     */
    getSearchLabel: (itemType: string) => `Search ${itemType}`,

    /**
     * Get an ARIA label for a filter dropdown
     */
    getFilterLabel: (filterType: string) => `Filter by ${filterType}`,

    /**
     * Get an ARIA label for a table row action menu
     */
    getRowMenuLabel: (itemName?: string) =>
      itemName ? `Actions for ${itemName}` : "Row actions",

    /**
     * Get an ARIA label for pagination
     */
    getPaginationLabel: (page: number, total: number) =>
      `Page ${page} of ${total}`,

    /**
     * Get an ARIA label for a dialog
     */
    getDialogLabel: (action: string, itemType: string) =>
      `${action} ${itemType} dialog`,

    /**
     * Get an ARIA label for a form field
     */
    getFieldLabel: (fieldName: string, isRequired: boolean) =>
      isRequired ? `${fieldName} (required)` : fieldName,
  };
}
