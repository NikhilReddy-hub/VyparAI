require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Supplier = require('../src/models/Supplier');
const Customer = require('../src/models/Customer');
const Invoice = require('../src/models/Invoice');
const Staff = require('../src/models/Staff');
const Activity = require('../src/models/Activity');
const BusinessHealth = require('../src/models/BusinessHealth');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vyapar-ai';

const seed = async () => {
  try {
    console.log('🌱 Starting Database Seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Connected to MongoDB');

    // Clean existing database
    const collections = [User, Product, Category, Supplier, Customer, Invoice, Staff, Activity, BusinessHealth];
    for (const model of collections) {
      try {
        await model.deleteMany({});
      } catch (err) {
        console.warn(`⚠️ Warning: Could not clear ${model.modelName} (may require auth): ${err.message}`);
      }
    }
    console.log('🧹 Collection clearing attempted');

    // 1. Create Users
    const owner = await User.create({
      name: 'Nayan Jyoti Sharma',
      email: 'owner@vyapar.ai',
      password: 'password123',
      role: 'owner',
      phone: '9864012345',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      department: 'Management'
    });

    const manager = await User.create({
      name: 'Pranab Das',
      email: 'manager@vyapar.ai',
      password: 'password123',
      role: 'manager',
      phone: '8876054321',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      department: 'Operations'
    });

    const staffUser1 = await User.create({
      name: 'Jitul Gogoi',
      email: 'jitul@vyapar.ai',
      password: 'password123',
      role: 'staff',
      phone: '7002012345',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      department: 'Sales Counter'
    });

    const staffUser2 = await User.create({
      name: 'Rumi Borah',
      email: 'rumi@vyapar.ai',
      password: 'password123',
      role: 'staff',
      phone: '9101054321',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      department: 'Customer Service'
    });

    console.log('👥 Users Created (Owner, Manager, 2 Staff)');

    // 2. Create Categories
    const catGroceries = await Category.create({ name: 'Daily Groceries', color: '#10b981', description: 'Essential household grains and goods' });
    const catTea = await Category.create({ name: 'Assam Tea Reserves', color: '#84cc16', description: 'Premium Orthodox and CTC Teas' });
    const catOils = await Category.create({ name: 'Oils & Ghee', color: '#f59e0b', description: 'Cooking oils and organic ghee' });
    const catSpices = await Category.create({ name: 'Spices & Jolokia', color: '#ef4444', description: 'Assamese spices and Ghost Pepper specialties' });
    const catSnacks = await Category.create({ name: 'Local Sweets & Snacks', color: '#8b5cf6', description: 'Pithas, Ladoos, and local snacks' });

    console.log('🏷️ Categories Created');

    // 3. Create Suppliers
    const supAgri = await Supplier.create({
      name: 'Guwahati Agri-Wholesale Syndicate',
      contactPerson: 'Mukesh Kalita',
      phone: '9435012345',
      email: 'contact@guwahatiagri.com',
      gstin: '18AABCG9812A1Z1',
      address: { street: 'Fancy Bazaar', city: 'Guwahati', pincode: '781001' },
      paymentTerms: '15 days',
      creditLimit: 250000,
      outstandingBalance: 45000,
      totalPurchased: 450000,
      rating: 4.8
    });

    const supTea = await Supplier.create({
      name: 'Dibrugarh Tea Estates Ltd.',
      contactPerson: 'Saurav Hazarika',
      phone: '9435598765',
      email: 'supply@dibrugarhtea.in',
      gstin: '18AAACD4321B2Z2',
      address: { street: 'Tea Auction Road', city: 'Dibrugarh', pincode: '786001' },
      paymentTerms: '30 days',
      creditLimit: 500000,
      outstandingBalance: 0,
      totalPurchased: 890000,
      rating: 4.9
    });

    console.log('🚛 Suppliers Created');

    // 4. Create Products
    const pTea = await Product.create({
      name: 'Assam CTC Tea Premium (Gold)',
      sku: 'TEA-CTC-GOLD-01',
      barcode: '8901234560012',
      category: catTea._id,
      supplier: supTea._id,
      purchasePrice: 120,
      sellingPrice: 180,
      mrp: 200,
      gstRate: 5,
      hsnCode: '0902',
      currentStock: 450,
      unit: 'packet',
      reorderLevel: 80,
      avgDailySales: 24,
      daysUntilStockout: 18,
      isDeadStock: false,
      createdBy: owner._id,
      batches: [{ batchNumber: 'B-TEA-99', quantity: 450, purchaseDate: new Date(), expiryDate: new Date(Date.now() + 365*24*60*60*1000), purchasePrice: 120 }]
    });

    const pRice = await Product.create({
      name: 'Johabir Organic Rice',
      sku: 'RICE-JOHA-5KG',
      barcode: '8901234560029',
      category: catGroceries._id,
      supplier: supAgri._id,
      purchasePrice: 420,
      sellingPrice: 580,
      mrp: 650,
      gstRate: 5,
      hsnCode: '1006',
      currentStock: 15, // Low stock on purpose
      unit: 'bag',
      reorderLevel: 25,
      avgDailySales: 8,
      daysUntilStockout: 2,
      isDeadStock: false,
      createdBy: owner._id,
      batches: [{ batchNumber: 'B-JOHA-08', quantity: 15, purchaseDate: new Date(), expiryDate: new Date(Date.now() + 180*24*60*60*1000), purchasePrice: 420 }]
    });

    const pOil = await Product.create({
      name: 'Kachhi Ghani Pure Mustard Oil',
      sku: 'OIL-MUST-1L',
      barcode: '8901234560036',
      category: catOils._id,
      supplier: supAgri._id,
      purchasePrice: 135,
      sellingPrice: 165,
      mrp: 180,
      gstRate: 12,
      hsnCode: '1508',
      currentStock: 110,
      unit: 'ltr',
      reorderLevel: 30,
      avgDailySales: 15,
      daysUntilStockout: 7,
      createdBy: owner._id,
    });

    const pPickle = await Product.create({
      name: 'Bhut Jolokia Hot Pickle',
      sku: 'PKL-BHUT-JOL',
      barcode: '8901234560043',
      category: catSpices._id,
      supplier: supAgri._id,
      purchasePrice: 90,
      sellingPrice: 150,
      mrp: 160,
      gstRate: 18,
      hsnCode: '2001',
      currentStock: 80,
      unit: 'pcs',
      reorderLevel: 15,
      avgDailySales: 3,
      createdBy: owner._id,
    });

    const pPitha = await Product.create({
      name: 'Assamese Til Pitha Pack',
      sku: 'SNK-TIL-PITHA',
      barcode: '8901234560050',
      category: catSnacks._id,
      supplier: supAgri._id,
      purchasePrice: 45,
      sellingPrice: 80,
      mrp: 100,
      gstRate: 5,
      hsnCode: '1905',
      currentStock: 8, // Critical stock level
      unit: 'packet',
      reorderLevel: 20,
      avgDailySales: 5,
      daysUntilStockout: 1,
      createdBy: owner._id,
    });

    // Dead Stock item for showcase
    const pDeadStock = await Product.create({
      name: 'Monsoon Rice Crackers (Old Stock)',
      sku: 'SNK-RICE-OLD',
      barcode: '8901234560098',
      category: catSnacks._id,
      supplier: supAgri._id,
      purchasePrice: 20,
      sellingPrice: 40,
      mrp: 50,
      gstRate: 18,
      hsnCode: '1905',
      currentStock: 300,
      unit: 'packet',
      reorderLevel: 10,
      avgDailySales: 0.1, // Moving extremely slow
      isDeadStock: true,
      createdBy: owner._id,
    });

    console.log('📦 Products Created (including Low Stock and Dead Stock)');

    // 5. Create Staff Profiles
    const staff1 = await Staff.create({
      user: staffUser1._id,
      employeeId: 'EMP-001',
      name: staffUser1.name,
      phone: staffUser1.phone,
      email: staffUser1.email,
      role: 'staff',
      department: 'Sales',
      joiningDate: new Date('2025-01-10'),
      salary: { basic: 15000, allowances: 2000, deductions: 500 },
      commissionRate: 2,
      totalSales: 154000,
      totalCommission: 3080,
      performanceScore: 92,
      attendance: [
        { date: new Date(Date.now() - 2*86400000), checkIn: new Date(Date.now() - 2*86400000 - 30*60000), status: 'present', hoursWorked: 8 },
        { date: new Date(Date.now() - 86400000), checkIn: new Date(Date.now() - 86400000), status: 'present', hoursWorked: 8 },
        { date: new Date(), checkIn: new Date(), status: 'present' }
      ]
    });

    const staff2 = await Staff.create({
      user: staffUser2._id,
      employeeId: 'EMP-002',
      name: staffUser2.name,
      phone: staffUser2.phone,
      email: staffUser2.email,
      role: 'staff',
      department: 'Support',
      joiningDate: new Date('2025-02-15'),
      salary: { basic: 12000, allowances: 1500, deductions: 200 },
      commissionRate: 1.5,
      totalSales: 89000,
      totalCommission: 1335,
      performanceScore: 88,
      attendance: [
        { date: new Date(Date.now() - 2*86400000), checkIn: new Date(Date.now() - 2*86400000 + 45*60000), status: 'late', hoursWorked: 7.25 },
        { date: new Date(Date.now() - 86400000), checkIn: new Date(Date.now() - 86400000), status: 'present', hoursWorked: 8 },
        { date: new Date(), checkIn: new Date(Date.now() + 15*60000), status: 'late' } // late today
      ]
    });

    console.log('👷 Staff Records Seeded');

    // 6. Create Customers
    const c1 = await Customer.create({
      name: 'Rahul Phukan',
      phone: '9854098765',
      email: 'rahul.phukan@gmail.com',
      address: { street: 'RG Baruah Road', city: 'Guwahati', pincode: '781024' },
      creditLimit: 10000,
      outstandingBalance: 4200,
      totalPurchased: 48000,
      totalOrders: 16,
      loyaltyPoints: 480,
      loyaltyTier: 'silver',
      aiScore: 88,
      churnProbability: 8,
      segment: 'regular'
    });

    const c2 = await Customer.create({
      name: 'Rimpi Boruah',
      phone: '8876123456',
      email: 'rimpi.b@yahoo.com',
      address: { street: 'Christian Basti', city: 'Guwahati', pincode: '781005' },
      creditLimit: 5000,
      outstandingBalance: 0,
      totalPurchased: 82000,
      totalOrders: 32,
      loyaltyPoints: 1240,
      loyaltyTier: 'gold',
      aiScore: 95,
      churnProbability: 3,
      segment: 'vip'
    });

    // Risky credit customer
    const c3 = await Customer.create({
      name: 'Prabal Talukdar',
      phone: '7002987654',
      email: 'prabaltalukdar@gmail.com',
      address: { street: 'Maligaon Chariali', city: 'Guwahati', pincode: '781011' },
      creditLimit: 8000,
      outstandingBalance: 7800, // Near credit limit
      totalPurchased: 15000,
      totalOrders: 4,
      loyaltyPoints: 150,
      loyaltyTier: 'bronze',
      aiScore: 35, // low credit health score
      churnProbability: 72, // AI detects churn risk due to drop in frequency
      segment: 'at-risk',
      suggestedOffer: 'Clear balance to get 5% discount coupon'
    });

    console.log('🛍️ Customer CRM Profiles Seeded');

    // 7. Create Historical Invoices to build Analytics
    const buildOldInvoice = async (invoiceNumber, customerId, daysAgo, grandTotal, items) => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      return Invoice.create({
        invoiceNumber,
        customer: customerId,
        items,
        grandTotal,
        subtotal: grandTotal * 0.9,
        totalTax: grandTotal * 0.1,
        totalDiscount: 0,
        paidAmount: grandTotal,
        dueAmount: 0,
        paymentStatus: 'paid',
        paymentMethod: 'upi',
        payments: [{ method: 'upi', amount: grandTotal, date }],
        createdAt: date,
        updatedAt: date
      });
    };

    // Rongali Bihu season invoice (April peak)
    await buildOldInvoice('INV-202604-001', c2._id, 90, 8500, [
      { product: pTea._id, productName: pTea.name, quantity: 20, sellingPrice: 180, totalAmount: 3600, gstRate: 5 },
      { product: pRice._id, productName: pRice.name, quantity: 5, sellingPrice: 580, totalAmount: 2900, gstRate: 5 },
      { product: pPitha._id, productName: pPitha.name, quantity: 25, sellingPrice: 80, totalAmount: 2000, gstRate: 5 }
    ]);

    await buildOldInvoice('INV-202606-022', c1._id, 45, 3480, [
      { product: pRice._id, productName: pRice.name, quantity: 6, sellingPrice: 580, totalAmount: 3480, gstRate: 5 }
    ]);

    await buildOldInvoice('INV-202607-009', c3._id, 10, 7800, [
      { product: pTea._id, productName: pTea.name, quantity: 10, sellingPrice: 180, totalAmount: 1800, gstRate: 5 },
      { product: pOil._id, productName: pOil.name, quantity: 20, sellingPrice: 165, totalAmount: 3300, gstRate: 12 },
      { product: pPickle._id, productName: pPickle.name, quantity: 18, sellingPrice: 150, totalAmount: 2700, gstRate: 18 }
    ]);

    // Outstanding / Active Invoice
    await Invoice.create({
      invoiceNumber: 'INV-202607-048',
      customer: c1._id,
      items: [
        { product: pRice._id, productName: pRice.name, quantity: 5, sellingPrice: 580, totalAmount: 2900, gstRate: 5, cgst: 72.5, sgst: 72.5 },
        { product: pOil._id, productName: pOil.name, quantity: 10, sellingPrice: 165, totalAmount: 1650, gstRate: 12, cgst: 99, sgst: 99 }
      ],
      subtotal: 4100,
      totalTax: 450,
      totalDiscount: 0,
      grandTotal: 4550,
      paidAmount: 350,
      dueAmount: 4200,
      paymentStatus: 'partial',
      paymentMethod: 'mixed',
      payments: [{ method: 'cash', amount: 350, date: new Date() }],
      createdBy: manager._id
    });

    console.log('📊 Sales History & Active Invoices Seeded');

    // 8. Create Timeline Activities
    await Activity.create({ type: 'customer_added', title: 'Customer Prabal Talukdar registered', description: 'Maligaon area, Guwahati', customer: c3._id });
    await Activity.create({ type: 'staff_checkin', title: 'Jitul Gogoi Checked In', description: 'Checked in at 9:02 AM. Geofence Verified.', staff: staff1._id });
    await Activity.create({ type: 'stock_update', title: 'Til Pitha stock level critical', description: 'Only 8 packets remaining on shelf.', product: pPitha._id, isAlert: true, severity: 'warning' });
    await Activity.create({ type: 'payment_received', title: 'Received ₹350 from Rahul Phukan', description: 'Cash deposit for Invoice INV-202607-048', customer: c1._id });

    console.log('⏰ Smart Timeline Seeded');

    // 9. Initial Business Health Score Setup
    await BusinessHealth.create({
      overallScore: 93,
      scores: {
        inventory: { score: 95, label: 'Excellent', details: 'Tea & Oils stock healthy. Til Pitha restock needed.' },
        cashFlow: { score: 82, label: 'Stable', details: '₹12,000 outstanding across 2 accounts.' },
        customerSatisfaction: { score: 90, label: 'Excellent', details: 'VIP retention high. Prabal at churn risk.' },
        staffProductivity: { score: 96, label: 'Outstanding', details: '95% check-in on time this week.' },
        profitability: { score: 88, label: 'High', details: 'Sales profit margins stable at 24%.' }
      },
      suggestions: [
        'Recover ₹7,800 pending payment from Prabal Talukdar (at-risk).',
        'Order Organic Johabir Rice — only 15 bags left.',
        'Clear old stock of Monsoon Rice Crackers (dead stock, 300 units remaining).'
      ],
      alerts: [
        'Rice stock will finish in 2 days.',
        'Til Pitha running low. Expiry tracking active.'
      ],
      metrics: {
        todayRevenue: 4550,
        todayProfit: 1200,
        pendingPayments: 12000,
        lowStockCount: 2,
        absentStaff: 0,
        newCustomers: 1,
        totalTransactions: 1
      },
      voiceSummary: "Good Morning, Nayan! Yesterday sales were ₹45,220 with ₹8,400 net profit. Two items are running low. Rice stock is critically low. Shall I prepare a purchase order?",
      aiNarrative: "Overall business score is at a strong 93%. Cash flow can be optimized by recovering ₹7,800 from Prabal Talukdar. Action is recommended for Rice restock."
    });

    console.log('❤️ Business Health Score Seeded');
    console.log('✨ Seeding Completed Successfully!');
    // Only disconnect/exit when run as a standalone script
    if (require.main === module) process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Error:', err.stack);
    if (require.main === module) process.exit(1);
    else throw err;
  }
};

// Export for use as a module (API trigger)
module.exports = seed;

// Run directly when called as a script
if (require.main === module) seed();
