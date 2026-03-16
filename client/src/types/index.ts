// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Chit types
export interface PayoutSchedule {
  month: number;
  payoutAmount: number;
}

export interface ChitGroup {
  _id: string;
  name: string;
  monthlyContribution: number;
  duration: number;
  totalMembers: number;
  collectionDay: number;
  payoutSchedule: PayoutSchedule[];
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'cancelled';
  totalCollected: number;
  totalPayouts: number;
  createdAt: Date;
  updatedAt: Date;
}

// Member types
export interface Member {
  _id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  aadhaarNumber: string;
  profilePhoto: string | null;
  digitalSignatureImage: string | null;
  chitGroupId: string;
  withdrawMonth: number;
  totalPaid: number;
  totalPayoutReceived: number;
  isActive: boolean;
  joinedAt: Date;
  leftAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Payment types
export interface Payment {
  _id: string;
  memberId: string;
  chitGroupId: string;
  month: number;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'bank_transfer' | 'upi' | 'cheque';
  receivedBy: string;
  receiptNumber: string;
  notes: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Payment status types
export interface PaymentStatus {
  month: number;
  paid: boolean;
  amount: number;
  date: Date | null;
}

// Dashboard types
export interface DashboardStats {
  totalChits: number;
  totalMembers: number;
  totalCollected: number;
  pendingPayments: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface ChitForm {
  name: string;
  monthlyContribution: number;
  duration: number;
  totalMembers: number;
  startDate: Date;
  payoutSchedule: PayoutSchedule[];
}

export interface MemberForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  aadhaarNumber: string;
  chitGroupId: string;
  withdrawMonth: number;
  profilePhoto?: File;
  digitalSignatureImage?: File;
}

export interface PaymentForm {
  memberId: string;
  chitGroupId: string;
  month: number;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'upi' | 'cheque';
  receivedBy: string;
  notes?: string;
}

// Notification types
export interface NotificationTemplate {
  id: string;
  name: string;
  sms: string;
  whatsapp: string;
}

export interface NotificationData {
  memberId: string;
  message: string;
  mediaUrl?: string;
}

// File upload types
export interface UploadResponse {
  fileName: string;
  filePath: string;
  url: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}