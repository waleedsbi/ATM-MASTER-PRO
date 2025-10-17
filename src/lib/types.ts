export interface ATM {
  id: string;
  location: string;
  bank: string;
  status: "Active" | "Inactive" | "Maintenance";
  lastMaintenanceDate: string;
  maintenancePlan: "Quarterly" | "Biannually" | "Annually";
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarId: string;
  tasksCompleted: number;
  avgResolutionTime: number; // in hours
}

export interface MaintenanceTask {
  id: string;
  atmId: string;
  technicianId: string | null;
  description: string;
  scheduledDate: string;
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  priority: "Low" | "Medium" | "High";
}

export interface Employee {
  id: string;
  nameAr: string;
  nameEn: string;
  city: string;
  hireDate: string;
  mobile: string;
  avatarId: string;
}

export interface Bank {
  id: string;
  nameAr: string;
  nameEn: string;
  governorate: string;
  city: string;
  address: string;
  mobile: string;
  logoId: string;
}

export interface BankContract {
  id: string;
  bankName: string;
  startDate: string;
  endDate: string;
  machineNumber: string;
  contractValue: number;
  statement: string;
  fileUrl?: string;
}

export interface ATMData {
    id: string;
    bankName: string;
    startDate: string;
    governorate: string;
    city: string;
    atmModel: string;
    atmSerial: string;
    atmCode: string;
    atmAddress: string;
}

export interface WorkPlan {
  id: string;
  bankName: string;
  startDate: string;
  endDate: string;
  governorate: string;
  city: string;
  statement: string;
}

export interface City {
  id: string;
  nameAr: string;
  nameEn: string;
}

export interface Governorate {
  id: string;
  nameAr: string;
  nameEn: string;
  cities: City[];
}

export type WorkPlanReportStatus = 'Pending' | 'Accepted' | 'Rejected';

export interface Note {
    id: string;
    text: string;
    date: string;
    user: 'العميل' | 'المراجع';
}

export interface ClientComment {
  id: number;
  workPlanId: number;
  atmCode: string;
  imageUrl?: string;
  imageType?: 'before' | 'after';
  commentText: string;
  commentBy: string;
  commentByRole: 'client' | 'reviewer' | 'admin';
  parentCommentId?: number;
  isRead: boolean;
  status: 'open' | 'resolved' | 'pending';
  createdAt: string;
  updatedAt: string;
  replies?: ClientComment[];
}

export interface WorkPlanReport {
  id: string;
  startDate: string;
  endDate: string;
  orderNumber: number;
  executionDate: string;
  atmCode: string;
  atmSerial: string;
  atmAddress: string;
  representative: string;
  status: WorkPlanReportStatus;
  beforeImages?: string[];
  afterImages?: string[];
  notes?: Note[];
  comments?: ClientComment[];
  workPlanId?: number; // Reference to the original work plan ID
  bankName?: string;
  governorate?: string;
  city?: string;
  statement?: string;
}
    