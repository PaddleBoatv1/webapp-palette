import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a reservation status for display
 */
export function formatStatus(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending Approval';
    case 'confirmed':
      return 'Confirmed';
    case 'in_progress':
      return 'In Progress';
    case 'awaiting_pickup':
      return 'Awaiting Pickup';
    case 'completed':
      return 'Completed';
    case 'canceled':
      return 'Canceled';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

/**
 * Get the badge variant for a reservation status
 */
export function getStatusBadgeVariant(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    case 'in_progress':
      return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100';
    case 'awaiting_pickup':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
    case 'completed':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'canceled':
      return 'bg-red-100 text-red-800 hover:bg-red-100';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  }
}
