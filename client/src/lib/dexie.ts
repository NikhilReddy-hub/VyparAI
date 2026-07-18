import Dexie, { type Table } from 'dexie';

export interface LocalProduct {
  _id: string;
  name: string;
  sku: string;
  barcode: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  isDeadStock?: boolean;
  avgDailySales?: number;
}

export interface LocalCustomer {
  _id: string;
  name: string;
  phone: string;
  outstandingBalance: number;
  creditLimit: number;
  loyaltyPoints: number;
  aiScore: number;
  churnProbability: number;
  segment: string;
}

export interface LocalInvoice {
  _id: string;
  invoiceNumber: string;
  customer: string;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  items: any[];
}

export interface LocalStaff {
  _id: string;
  name: string;
  role: string;
  employeeId: string;
  totalSales: number;
  performanceScore: number;
  attendance: any[];
}

export interface LocalSupplier {
  _id: string;
  name: string;
  phone: string;
  outstandingBalance: number;
}

export class VyaparOfflineDatabase extends Dexie {
  products!: Table<LocalProduct>;
  customers!: Table<LocalCustomer>;
  invoices!: Table<LocalInvoice>;
  staff!: Table<LocalStaff>;
  suppliers!: Table<LocalSupplier>;

  constructor() {
    super('VyaparOfflineDatabase');
    this.version(1).stores({
      products: '_id, name, sku, barcode, currentStock',
      customers: '_id, name, phone, outstandingBalance',
      invoices: '_id, invoiceNumber, customer, paymentStatus',
      staff: '_id, name, employeeId',
      suppliers: '_id, name, phone'
    });
  }
}

export const db = new VyaparOfflineDatabase();
export default db;
