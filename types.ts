
export interface ChitGroup {
  id: string;
  name: string;
  totalValue: number;
  totalMonths: number;
  memberCount: number; // Locked to totalMonths
  regularInstallment: number; // e.g., 5000
  prizedInstallment: number;   // e.g., 6000
  startDate: string; // ISO Date (YYYY-MM-DD)
  endDate: string;   // ISO Date (YYYY-MM-DD)
  allotmentDay: number; // Day of the month (1-31)
  status: 'Active' | 'Closed';
  upiId?: string; // Optional per-group UPI ID
}

export interface Member {
  id: string;
  groupId: string;
  name: string;
  phone: string;
  address: string;
  email: string;
  idProofType: string;
  idProofNumber: string;
  nomineeName: string;
  nomineeRelation: string;
  joiningDate: string;
  isPrized: boolean;
  prizedMonth?: number; // The month they won the chit
  status: 'Active' | 'Inactive';
}

export interface Payment {
  id: string;
  memberId: string;
  groupId: string;
  monthNumber: number;
  amountPaid: number;
  expectedAmount: number;
  paymentDate: string;
  paymentMode: 'Cash' | 'UPI' | 'Cheque' | 'Other';
  receiptNumber: string;
  remarks: string;
  transactionRef?: string;
}

export type Page = 'Dashboard' | 'ChitGroups' | 'Candidates' | 'Allotment' | 'Collection' | 'Reports' | 'Settings';
export type ReportType = 'Candidate' | 'Due' | 'Consolidated' | 'Individual';
