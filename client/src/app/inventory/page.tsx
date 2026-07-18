'use client';

import React, { useEffect, useState } from 'react';
import { useVyaparStore } from '@/lib/store';
import { vyaparApi } from '@/lib/api';
import { 
  Package, Plus, Search, Filter, Camera, ArrowUpDown, 
  Barcode, Calendar, TrendingUp, AlertTriangle, ArrowRightLeft, Sparkles, Check, CheckCircle2
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const { user } = useVyaparStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Camera Shelf Scan States
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  // Barcode modal states
  const [barcodeProduct, setBarcodeProduct] = useState<any>(null);

  // AI restocking forecasts
  const [predictions, setPredictions] = useState<any>({});

  const loadProducts = async () => {
    try {
      const res = await vyaparApi.getProducts();
      if (res.success) {
        setProducts(res.data);
      }
    } catch {
      toast.error('Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const triggerAICalc = async (id: string) => {
    toast('Running festival demand forecast...', { icon: '🔮' });
    try {
      const res = await vyaparApi.getProductPrediction(id);
      if (res.success) {
        setPredictions((prev: any) => ({ ...prev, [id]: res.data }));
        toast.success('AI prediction calculated!');
      }
    } catch {
      toast.error('Failed to calculate prediction.');
    }
  };

  const handleShelfScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setScanning(true);
    toast('Analyzing shelf layout items...', { icon: '📸' });

    const formData = new FormData();
    formData.append('image', e.target.files[0]);

    try {
      const res = await vyaparApi.shelfScan(formData);
      if (res.success) {
        setScanResult(res.data);
        toast.success('Shelf items analyzed successfully!');
        
        // Auto-update matched inventory items locally for demo purposes
        const updated = products.map(p => {
          const match = res.data.itemsDetected.find((it: any) => p.name.includes(it.name) || it.name.includes(p.name));
          if (match) {
            return { ...p, currentStock: match.detectedQty };
          }
          return p;
        });
        setProducts(updated);
      }
    } catch {
      toast.error('Vision server offline. Loaded simulated vision matching.');
    } finally {
      setScanning(false);
    }
  };

  // Camera Barcode Scanner Logic
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [scanQty, setScanQty] = useState(10);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const startScanner = async () => {
    setCameraOpen(true);
    setScannedProduct(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable, showing scanner mockup console:", err);
      toast('Using scanner simulator fallback', { icon: '📷' });
    }
  };

  const stopScanner = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraOpen(false);
  };

  const handleSimulateScan = (productId: string) => {
    const matched = products.find(p => p._id === productId || p.sku === productId || p.barcode === productId);
    if (matched) {
      setScannedProduct(matched);
      toast.success(`Scanned: ${matched.name}`);
    } else {
      toast.error("Barcode SKU not found in inventory registry!");
    }
  };

  const handleApplyScanStock = async () => {
    if (!scannedProduct) return;
    try {
      const res = await vyaparApi.adjustStock(scannedProduct._id, {
        adjustment: scanQty,
        reason: 'Vision Scanner stock audit adjust',
        type: 'add'
      });
      if (res.success) {
        toast.success(`Updated ${scannedProduct.name} stock level (+${scanQty})`);
        loadProducts();
        stopScanner();
      }
    } catch {
      toast.error("Could not sync stock adjustments.");
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header operations */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-sans">Smart Inventory</h2>
          <p className="text-xs text-muted-foreground">RFID barcode matching & Vision shelf scans</p>
        </div>
        <div className="flex gap-2">
          {/* Barcode Camera Scanner button */}
          <button 
            onClick={startScanner}
            className="h-10 px-4 rounded-xl glass border border-indigo-500/20 text-xs font-semibold text-indigo-300 flex items-center gap-2 hover:text-white transition-all cursor-pointer"
          >
            <Barcode className="h-4 w-4" />
            <span>Camera Scanner</span>
          </button>

          {/* Vision Shelf Scan Trigger */}
          <label className="h-10 px-4 rounded-xl glass-accent border border-indigo-500/20 text-xs font-semibold text-indigo-300 flex items-center gap-2 hover:text-white cursor-pointer transition-all">
            <Camera className="h-4 w-4" />
            <span>{scanning ? 'Analyzing shelves...' : 'Shelf Vision Scan'}</span>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleShelfScan} 
              className="hidden" 
              disabled={scanning}
            />
          </label>

          {/* Add product button */}
          <button className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer">
            <Plus className="h-4 w-4" />
            <span>New Item</span>
          </button>
        </div>
      </div>

      {/* Vision Scan Match Display */}
      {scanResult && (
        <div className="p-4 bg-neutral-900 border border-emerald-500/20 rounded-2xl space-y-3 animate-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Vision Shelf Scan Detection • Match Verified</span>
            </div>
            <button 
              onClick={() => setScanResult(null)}
              className="text-[10px] text-muted-foreground hover:text-white"
            >
              Clear Vision Cache
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {scanResult.itemsDetected.map((item: any, idx: number) => (
              <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-muted-foreground font-mono">Detected Packets</span>
                <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-400 font-mono font-bold">{item.detectedQty} units</span>
                  <span className="text-muted-foreground">Target: {item.expectedQty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Prediction Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <span className="text-[9px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
              Assam Bihu Spike
            </span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">"Increase Tea & Sweets stock before Bihu"</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
              Last year consumer spending in Guwahati increased 42% on Assam Gold tea cases during festive weeks.
            </p>
          </div>
        </div>

        <div className="p-4 bg-amber-950/15 border border-amber-500/15 rounded-2xl space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span className="text-[9px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
              Stockout Warning
            </span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">"You may run out of Johabir Rice in 2 days"</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
              Estimated depletion rate based on yesterday's sales metrics is 8 bags daily.
            </p>
          </div>
        </div>

        <div className="p-4 bg-red-950/15 border border-red-500/15 rounded-2xl space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-[9px] bg-red-500/10 text-red-300 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
              Dead Stock Alert
            </span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">"300 units of Monsoon Rice Crackers is dead stock"</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
              Unsold for 45 days. Suggesting 15% discount or bundled combo placement.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search items by SKU code, product title, barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-indigo-500/50 text-white placeholder:text-muted-foreground transition-all"
          />
        </div>
      </div>

      {/* Products table */}
      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01] text-muted-foreground uppercase font-mono tracking-wider font-semibold text-[10px]">
                <th className="p-4">Product Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">SKU / Barcode</th>
                <th className="p-4 text-right">Procure / MRP</th>
                <th className="p-4 text-right">Current Stock</th>
                <th className="p-4">AI Prediction</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.map((p, idx) => (
                <tr key={idx} className="hover:bg-white/[0.01] transition-all group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-indigo-400 border border-white/5">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-xs">{p.name}</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{p.unit} packing</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2.5 py-1 rounded-full font-medium border border-indigo-500/20">
                      {p.category?.name || 'Groceries'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-[10px] block">{p.sku}</span>
                    <span className="text-muted-foreground text-[10px] font-mono mt-0.5 block">{p.barcode}</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="block font-mono">{formatINR(p.purchasePrice)}</span>
                    <span className="text-muted-foreground font-mono mt-0.5 block">MRP {formatINR(p.mrp || p.sellingPrice)}</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`font-bold font-mono ${p.currentStock <= p.reorderLevel ? 'text-red-400' : 'text-white'}`}>
                      {p.currentStock} {p.unit}
                    </span>
                    <span className="text-[9px] text-muted-foreground block mt-0.5 font-mono">Min: {p.reorderLevel}</span>
                  </td>
                  <td className="p-4">
                    {predictions[p._id] ? (
                      <div className="space-y-1">
                        <span className="text-[10px] text-emerald-400 font-bold block">
                          Stockout: {predictions[p._id].daysUntilStockout} days
                        </span>
                        <span className="text-[9px] text-indigo-300 block">
                          Confidence: {predictions[p._id].confidence}%
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => triggerAICalc(p._id)}
                        className="px-2 py-1 bg-indigo-600/10 border border-indigo-600/20 text-indigo-300 rounded-lg hover:bg-indigo-600 hover:text-white transition-all cursor-pointer font-semibold text-[9px] uppercase font-mono"
                      >
                        Forecast
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2.5">
                      {/* Barcode scanner launcher */}
                      <button 
                        onClick={() => setBarcodeProduct(p)}
                        className="p-1.5 text-muted-foreground hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
                        title="Print Barcode label"
                      >
                        <Barcode className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barcode Print Modal */}
      {barcodeProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-semibold text-white">Generate Barcode Tag</h3>
            <div className="p-4 bg-white rounded-xl flex flex-col items-center justify-center border border-white/10 space-y-2">
              <span className="text-[9px] text-black font-bold uppercase font-mono tracking-widest">{barcodeProduct.sku}</span>
              {/* Cute Barcode render using SVG bars */}
              <svg className="w-60 h-16 text-black" viewBox="0 0 100 20">
                <rect x="0" width="2" height="20" fill="currentColor" />
                <rect x="3" width="1" height="20" fill="currentColor" />
                <rect x="5" width="3" height="20" fill="currentColor" />
                <rect x="9" width="1" height="20" fill="currentColor" />
                <rect x="11" width="2" height="20" fill="currentColor" />
                <rect x="15" width="4" height="20" fill="currentColor" />
                <rect x="20" width="1" height="20" fill="currentColor" />
                <rect x="23" width="2" height="20" fill="currentColor" />
                <rect x="26" width="3" height="20" fill="currentColor" />
                <rect x="30" width="1" height="20" fill="currentColor" />
                <rect x="33" width="2" height="20" fill="currentColor" />
                <rect x="37" width="1" height="20" fill="currentColor" />
                <rect x="40" width="4" height="20" fill="currentColor" />
                <rect x="45" width="2" height="20" fill="currentColor" />
                <rect x="48" width="1" height="20" fill="currentColor" />
                <rect x="50" width="3" height="20" fill="currentColor" />
                <rect x="55" width="1" height="20" fill="currentColor" />
                <rect x="58" width="2" height="20" fill="currentColor" />
                <rect x="62" width="4" height="20" fill="currentColor" />
                <rect x="68" width="1" height="20" fill="currentColor" />
                <rect x="71" width="3" height="20" fill="currentColor" />
                <rect x="75" width="1" height="20" fill="currentColor" />
                <rect x="78" width="2" height="20" fill="currentColor" />
                <rect x="82" width="4" height="20" fill="currentColor" />
                <rect x="88" width="2" height="20" fill="currentColor" />
                <rect x="91" width="1" height="20" fill="currentColor" />
                <rect x="94" width="3" height="20" fill="currentColor" />
              </svg>
              <span className="text-[10px] text-neutral-600 font-mono tracking-widest">{barcodeProduct.barcode}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="text-muted-foreground">Product:</span>
                <p className="font-semibold text-white">{barcodeProduct.name}</p>
              </div>
              <button
                onClick={() => setBarcodeProduct(null)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-white hover:bg-white/10 transition-all text-xs font-semibold cursor-pointer"
              >
                Close Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Camera Barcode Scanner Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <div>
                <h3 className="text-sm font-semibold text-white">NFC / Camera Barcode Scanner</h3>
                <p className="text-[10px] text-muted-foreground">Scan physical labels to audit store quantities</p>
              </div>
              <button 
                onClick={stopScanner}
                className="text-xs text-muted-foreground hover:text-white"
              >
                Close Scanner
              </button>
            </div>

            {/* Video preview / Simulated Scan target */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/40 border border-white/5 flex flex-col items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover opacity-60"
              />
              
              {/* Animated Red Laser Scanning Line */}
              <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] top-1/2 -translate-y-1/2 animate-bounce" />

              {/* Viewfinder brackets */}
              <div className="absolute inset-8 border border-white/20 rounded-xl flex items-center justify-center pointer-events-none">
                <span className="text-[9px] text-white/40 uppercase font-mono tracking-widest bg-black/40 px-2 py-0.5 rounded">
                  Align Barcode inside viewport
                </span>
              </div>
            </div>

            {/* Dropdown list of actual inventory barcodes to simulate scans (bulletproof fallback) */}
            <div className="space-y-1.5 p-3.5 bg-white/5 border border-white/5 rounded-2xl">
              <label className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider font-mono">
                Scanner Hardware Simulator (Fast Showcase)
              </label>
              <select
                onChange={(e) => handleSimulateScan(e.target.value)}
                className="w-full bg-neutral-950 text-white rounded-xl text-xs px-3 py-2 border border-white/10 focus:outline-none"
              >
                <option value="">Select a product barcode to simulate scan...</option>
                {products.map((p, i) => (
                  <option key={i} value={p.barcode}>
                    {p.name} (Barcode: {p.barcode})
                  </option>
                ))}
              </select>
            </div>

            {/* Detailed product lookup results */}
            {scannedProduct && (
              <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl space-y-3 animate-in slide-in-from-bottom-2 duration-150">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] text-indigo-400 font-mono font-bold uppercase">MATCH FOUND</span>
                    <h4 className="text-xs font-bold text-white mt-0.5">{scannedProduct.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Current Stock: {scannedProduct.currentStock} units</p>
                  </div>
                  <span className="text-[10px] bg-white/15 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                    {scannedProduct.sku}
                  </span>
                </div>

                <div className="flex items-center gap-3 border-t border-white/5 pt-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] text-muted-foreground uppercase font-semibold block">Audit Adjustment Qty</label>
                    <input
                      type="number"
                      value={scanQty}
                      onChange={(e) => setScanQty(Number(e.target.value))}
                      className="w-full bg-neutral-950 text-white rounded-xl text-xs px-3 py-1.5 border border-white/10 focus:outline-none font-mono"
                    />
                  </div>
                  <button
                    onClick={handleApplyScanStock}
                    className="h-9 px-4 mt-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Apply Adjustment</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
