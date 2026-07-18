'use client';

import React, { useEffect, useState } from 'react';
import { useVyaparStore } from '@/lib/store';
import { vyaparApi } from '@/lib/api';
import { 
  Plus, Trash2, CreditCard, Receipt, Users, QrCode, 
  Download, Printer, Sparkles, AlertCircle, RefreshCcw
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function SalesPage() {
  const { user } = useVyaparStore();
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'credit'>('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [isInterstate, setIsInterstate] = useState(false);
  const [notes, setNotes] = useState('');

  // Generated Invoice Result
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [pRes, cRes] = await Promise.all([
        vyaparApi.getProducts(),
        vyaparApi.getCustomers()
      ]);
      if (pRes.success) setProducts(pRes.data);
      if (cRes.success) setCustomers(cRes.data);
    }
    loadData();
  }, []);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item._id === product._id);
    if (product.currentStock <= 0) {
      toast.error('Product is out of stock!');
      return;
    }
    if (existing) {
      if (existing.quantity >= product.currentStock) {
        toast.error('Cannot add more than available stock!');
        return;
      }
      setCart(cart.map(item => 
        item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1, discount: 0 }]);
    }
  };

  const updateCartQty = (id: string, qty: number) => {
    const prod = products.find(p => p._id === id);
    if (qty > (prod?.currentStock || 0)) {
      toast.error('Quantity exceeds available stock!');
      return;
    }
    setCart(cart.map(item => item._id === id ? { ...item, quantity: Math.max(1, qty) } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item._id !== id));
  };

  // Math helper calculations
  const subtotal = cart.reduce((acc, item) => {
    const itemTotal = item.sellingPrice * item.quantity;
    return acc + (itemTotal - (itemTotal * (item.discount / 100)));
  }, 0);

  const totalGst = cart.reduce((acc, item) => {
    const taxable = item.sellingPrice * item.quantity * (1 - item.discount / 100);
    return acc + (taxable * (item.gstRate / 100));
  }, 0);

  const grandTotal = Math.round(subtotal + totalGst);

  // Auto pre-fill paid amount when total changes
  useEffect(() => {
    if (paymentMethod !== 'credit') {
      setPaidAmount(grandTotal);
    } else {
      setPaidAmount(0);
    }
  }, [grandTotal, paymentMethod]);

  const handleCreateInvoice = async () => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer.');
      return;
    }
    if (cart.length === 0) {
      toast.error('Add items to cart first.');
      return;
    }

    const payload = {
      customerId: selectedCustomerId,
      isInterstate,
      items: cart.map(item => ({
        productId: item._id,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        discount: item.discount
      })),
      payments: [
        { method: paymentMethod, amount: paidAmount }
      ],
      dueAmount: Math.max(0, grandTotal - paidAmount),
      grandTotal,
      notes
    };

    toast.loading('Processing GST Invoice...');
    try {
      const res = await vyaparApi.createInvoice(payload);
      toast.dismiss();
      if (res.success) {
        setGeneratedInvoice(res.data);
        toast.success('Invoice issued successfully!');
        setCart([]);
      }
    } catch {
      toast.dismiss();
      toast.error('Procurement error. Retrying offline queue...');
    }
  };

  // PDF generation
  const downloadPDF = () => {
    const input = document.getElementById('printable-invoice-tag');
    if (!input) return;
    html2canvas(input, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice_${generatedInvoice.invoiceNumber}.pdf`);
      toast.success('PDF invoice downloaded!');
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Products list selection */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Invoice Builder</h2>
            <p className="text-xs text-muted-foreground">GST filing & quick cash checkout</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Interstate (IGST)</span>
            <button
              onClick={() => setIsInterstate(!isInterstate)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isInterstate ? "bg-indigo-600" : "bg-neutral-800"
              }`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isInterstate ? "translate-x-4" : "translate-x-0"
              }`} />
            </button>
          </div>
        </div>

        {/* Quick select items list */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {products.map((p, idx) => (
            <button
              key={idx}
              onClick={() => addToCart(p)}
              disabled={p.currentStock <= 0}
              className="glass p-4 rounded-2xl flex flex-col justify-between text-left hover:border-indigo-500/30 cursor-pointer disabled:opacity-40 transition-all"
            >
              <div>
                <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">{p.sku}</span>
              </div>
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                <span className="text-xs font-bold font-mono text-indigo-400">{formatINR(p.sellingPrice)}</span>
                <span className="text-[10px] text-muted-foreground font-mono">Stock: {p.currentStock}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* POS Cart Sidebar Summary */}
      <div className="space-y-6">
        <div className="glass p-6 rounded-2xl space-y-4">
          <h3 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">Checkout Cart</h3>
          
          {/* Customer CRM search selector */}
          <div className="space-y-1.5">
            <label className="text-[9px] text-muted-foreground uppercase font-semibold">Select Customer Ledger</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="">Choose Customer...</option>
              {customers.map((c, i) => (
                <option key={i} value={c._id}>
                  {c.name} ({c.phone}) - Bal: {formatINR(c.outstandingBalance)}
                </option>
              ))}
            </select>
          </div>

          {/* Cart list items */}
          <div className="space-y-2.5 max-h-40 overflow-y-auto">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/5">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-white truncate">{item.name}</h4>
                  <span className="text-[10px] font-mono text-muted-foreground">{formatINR(item.sellingPrice)} • GST {item.gstRate}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateCartQty(item._id, Number(e.target.value))}
                    className="w-10 bg-transparent text-xs text-center border-b border-white/10 focus:outline-none font-mono"
                  />
                  <button onClick={() => removeFromCart(item._id)} className="text-red-400 hover:text-red-300 cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* GST details breakdown */}
          <div className="space-y-2 border-t border-white/5 pt-4 text-xs font-mono">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST Tax:</span>
              <span>{formatINR(totalGst)}</span>
            </div>
            <div className="flex justify-between text-white font-bold text-sm pt-1 border-t border-white/5">
              <span>Grand Total:</span>
              <span>{formatINR(grandTotal)}</span>
            </div>
          </div>

          {/* Split Payment method */}
          <div className="space-y-2 border-t border-white/5 pt-4">
            <label className="text-[9px] text-muted-foreground uppercase font-semibold">Payment Split Method</label>
            <div className="grid grid-cols-2 gap-2">
              {(['cash', 'upi', 'card', 'credit'] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 rounded-xl text-[10px] font-bold uppercase transition-all border cursor-pointer ${
                    paymentMethod === method 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-white/5 border-white/5 text-muted-foreground hover:text-white'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
            {paymentMethod !== 'credit' && (
              <div className="space-y-1.5 mt-2">
                <label className="text-[9px] text-muted-foreground uppercase font-semibold">Paid Amount</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none font-mono"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleCreateInvoice}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xl shadow-indigo-600/25 cursor-pointer"
          >
            Generate GST Invoice
          </button>
        </div>
      </div>

      {/* Invoice Output display and downloads */}
      {generatedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">GST Invoice Issued</h3>
              <div className="flex gap-2">
                <button
                  onClick={downloadPDF}
                  className="p-2 bg-white/5 border border-white/5 rounded-xl text-indigo-400 hover:text-white transition-all cursor-pointer"
                  title="Download PDF"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="p-2 bg-white/5 border border-white/5 rounded-xl text-indigo-400 hover:text-white transition-all cursor-pointer"
                  title="Show Payment QR"
                >
                  <QrCode className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setGeneratedInvoice(null)}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>

            {/* Simulated UPI Payment QR code */}
            {showQR && (
              <div className="p-4 bg-white rounded-xl flex flex-col items-center justify-center space-y-2 border border-white/10 animate-in zoom-in-95 duration-200">
                <span className="text-[10px] text-black font-bold uppercase tracking-wider">Scan to pay via UPI</span>
                <div className="h-40 w-40 bg-neutral-100 flex items-center justify-center border border-black/10 rounded-xl relative">
                  {/* Mock beautiful QR structure */}
                  <div className="h-32 w-32 border-4 border-black p-1 flex flex-wrap relative bg-white">
                    <div className="h-8 w-8 bg-black absolute top-1 left-1" />
                    <div className="h-8 w-8 bg-black absolute top-1 right-1" />
                    <div className="h-8 w-8 bg-black absolute bottom-1 left-1" />
                    <div className="h-4 w-4 bg-black absolute top-10 left-10" />
                    {/* Tiny visual random pixels representation */}
                    <div className="h-2 w-2 bg-black absolute top-14 right-8" />
                    <div className="h-2 w-2 bg-black absolute bottom-8 right-14" />
                    <div className="h-4 w-4 bg-black absolute bottom-4 right-4" />
                  </div>
                </div>
                <span className="text-[9px] text-neutral-600 font-mono">Guwahati Shop • GPay Merchant Code</span>
              </div>
            )}

            {/* Printable Invoice element layout */}
            <div 
              id="printable-invoice-tag" 
              className="p-6 bg-white text-black rounded-xl space-y-4 border border-neutral-300 shadow font-sans text-xs leading-normal"
            >
              <div className="flex justify-between items-start border-b border-neutral-200 pb-4">
                <div>
                  <h4 className="font-extrabold text-sm uppercase">Sharma General Stores</h4>
                  <p className="text-[10px] text-neutral-500">Fancy Bazaar, Guwahati, Assam</p>
                  <p className="text-[10px] text-neutral-500">GSTIN: 18AABCS9812A1Z1</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest block">TAX INVOICE</span>
                  <p className="font-mono font-bold mt-1 text-neutral-700">{generatedInvoice.invoiceNumber}</p>
                  <p className="text-[9px] text-neutral-400 font-mono mt-0.5">{new Date(generatedInvoice.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-neutral-300 font-bold text-neutral-600">
                    <th className="pb-1">Product Description</th>
                    <th className="pb-1 text-center">Qty</th>
                    <th className="pb-1 text-right">Price</th>
                    <th className="pb-1 text-right">GST %</th>
                    <th className="pb-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {generatedInvoice.items?.map((item: any, i: number) => (
                    <tr key={i} className="py-1">
                      <td className="py-1.5 font-semibold text-neutral-800">{item.productName}</td>
                      <td className="py-1.5 text-center">{item.quantity} {item.unit}</td>
                      <td className="py-1.5 text-right font-mono">{formatINR(item.sellingPrice)}</td>
                      <td className="py-1.5 text-right font-mono">{item.gstRate}%</td>
                      <td className="py-1.5 text-right font-mono font-semibold">{formatINR(item.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Aggregations */}
              <div className="border-t border-neutral-300 pt-3 flex flex-col items-end gap-1.5 font-mono text-[10px]">
                <div className="flex justify-between w-48 text-neutral-500">
                  <span>Subtotal:</span>
                  <span>{formatINR(generatedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between w-48 text-neutral-500">
                  <span>Tax Amount (GST):</span>
                  <span>{formatINR(generatedInvoice.totalTax)}</span>
                </div>
                <div className="flex justify-between w-48 text-black font-extrabold border-t border-neutral-200 pt-1.5 text-xs">
                  <span>Grand Total:</span>
                  <span>{formatINR(generatedInvoice.grandTotal)}</span>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-3 text-center text-[8px] text-neutral-400">
                Thank you for your purchase! Goods once sold are subject to exchanges within 7 days.
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
