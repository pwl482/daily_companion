export type PaymentType = 'income' | 'expense';

export type RecurrenceFrequency = 'monthly' | 'weekly' | 'bi-weekly' | 'yearly' | 'custom_cron';

export interface RecurringSubEntry {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD or empty for ongoing
  frequency: RecurrenceFrequency;
  cronExpr?: string; // Standard or custom cron format e.g. "0 0 1 * *"
  dayOfMonth?: number; // 1-31 for monthly
  dayOfWeek?: number; // 0-6 (0=Sun, 1=Mon, etc.)
  amount: number;
  notes?: string;
}

export interface RecurringPayment {
  id: string;
  title: string;
  category: string; // 'rent' | 'internet' | 'power' | 'mobility' | 'income' | 'insurance' | 'subscription' | 'other'
  type: PaymentType;
  subEntries: RecurringSubEntry[]; // Rate history periods (supports cost changes over time)
  createdAt: string;
}

export interface OneTimePaymentSplit {
  id: string;
  primaryCategory: string; // e.g. "Groceries", "Sports", "Entertainment", "Health", "Shopping"
  subCategory: string; // e.g. "Default", "Vacation", "Snacks", "Equipment"
  amount: number;
  notes?: string;
}

export interface OneTimePayment {
  id: string;
  date: string; // YYYY-MM-DD
  merchant: string;
  notes?: string;
  splits: OneTimePaymentSplit[];
  createdAt: string;
}

export interface UnavailableInterval {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  allDay: boolean;
  reason: string; // e.g. "Vacation in Spain", "Shift duty", "Doctor appointment"
}

export interface Person {
  id: string;
  name: string;
  color: string;
  email?: string;
  phone?: string;
  relation?: string;
  unavailableIntervals: UnavailableInterval[];
}

export type EventStatus = 'planned' | 'unscheduled' | 'completed' | 'cancelled';

export interface EventRecurrence {
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'custom_cron';
  cronExpr?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  untilDate?: string;
}

export interface PlannedEvent {
  id: string;
  title: string;
  description?: string;
  status: EventStatus;
  startDate?: string; // YYYY-MM-DD (undefined/empty if unscheduled)
  endDate?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  allDay: boolean;
  isRecurring: boolean;
  recurrence?: EventRecurrence;
  attendeeIds: string[]; // Person IDs
  location?: string;
  colorTag?: string;
  createdAt: string;
}

export type TicketPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TicketSwimlane = 'todo' | 'in_progress' | 'blocked' | 'done';

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  priority: TicketPriority;
  dueDate?: string; // YYYY-MM-DD
  swimlane: TicketSwimlane;
  createdAt: string;
  completedAt?: string;
}

export interface AppData {
  recurringPayments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
  people: Person[];
  events: PlannedEvent[];
  tickets: Ticket[];
}
