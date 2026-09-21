export interface EventMetadata {
  id: string;
  title: string;
  slug?: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  venue: string;
  category?: string;
  isPaid: boolean;
  ticketPrice: number;
  status: string;
  collaborators?: string;
  coordinatorName?: string;
  coordinatorPhone?: string;
}

export interface RegistrationRecord {
  id: string;
  eventId: string;
  fullName: string;
  email: string;
  phone: string;
  institution?: string;
  designation?: string;
  ticketType: string;
  groupSize: number;
  groupName?: string;
  groupMembers?: string[];
  totalAmount: number;
  paymentStatus: 'FREE' | 'PENDING' | 'PAID' | 'VERIFIED' | string;
  paymentReference?: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | string;
  checkedIn: boolean;
  checkedInAt?: string;
  alreadyCheckedIn?: boolean;
  event?: EventMetadata;
}

export interface ScanHistoryItem {
  id: string;
  time: string;
  name: string;
  status: string;
  amount: number;
}

export interface AuthState {
  token: string | null;
  user: {
    id: string;
    email: string;
    role: string;
    fullName?: string;
  } | null;
  serverUrl: string;
}
