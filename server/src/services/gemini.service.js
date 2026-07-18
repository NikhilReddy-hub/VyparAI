const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const FESTIVAL_CALENDAR = [
  { name: 'Rongali Bihu', month: 4, day: 14, duration: 7, products: ['tea', 'rice', 'mustard oil', 'sweets', 'silk'] },
  { name: 'Kongali Bihu', month: 10, day: 18, duration: 3, products: ['rice', 'oil', 'dal'] },
  { name: 'Bhogali Bihu / Magh Bihu', month: 1, day: 14, duration: 5, products: ['rice', 'sesame', 'coconut', 'sweets', 'pithas'] },
  { name: 'Durga Puja', month: 10, day: 2, duration: 10, products: ['sweets', 'oil', 'sugar', 'clothing', 'fireworks'] },
  { name: 'Diwali', month: 11, day: 1, duration: 5, products: ['oil', 'sugar', 'sweets', 'fireworks', 'dry fruits'] },
  { name: 'Eid ul-Fitr', month: 4, day: 10, duration: 3, products: ['sugar', 'rice', 'oil', 'sweets', 'vermicelli'] },
  { name: 'Christmas', month: 12, day: 25, duration: 3, products: ['sugar', 'chocolate', 'dry fruits', 'biscuits'] },
];

function getUpcomingFestivals(daysAhead = 30) {
  const today = new Date();
  return FESTIVAL_CALENDAR.filter(f => {
    const festDate = new Date(today.getFullYear(), f.month - 1, f.day);
    if (festDate < today) festDate.setFullYear(today.getFullYear() + 1);
    const diff = (festDate - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= daysAhead;
  });
}

// AI Business Brain — Decision-Making Agent
async function runBusinessBrain(query, businessContext) {
  const upcomingFestivals = getUpcomingFestivals(30);
  const budget = businessContext.budget || 50000;
  const inventory = businessContext.inventory || [];
  
  // 1. Perform deterministic calculations on each product in inventory
  const calculatedProcurements = inventory.map(prod => {
    const leadTime = prod.leadTime || 3;
    const currentStock = prod.currentStock || 0;
    const avgDailySales = prod.avgDailySales || 1.5;
    const profitMargin = prod.sellingPrice > 0 ? ((prod.sellingPrice - prod.purchasePrice) / prod.sellingPrice * 100) : 25;
    
    // Check festival impact
    let festivalMultiplier = 1.0;
    let festivalName = null;
    for (const fest of upcomingFestivals) {
      const match = fest.products.some(p => prod.name.toLowerCase().includes(p));
      if (match) {
        festivalMultiplier = 2.0;
        festivalName = fest.name;
        break;
      }
    }

    const daysUntilStockout = avgDailySales > 0 ? Math.max(0, Math.round(currentStock / avgDailySales)) : 99;
    const safetyStock = Math.round(avgDailySales * leadTime * 1.5);
    const targetStock = Math.round((safetyStock + (avgDailySales * 30)) * festivalMultiplier);
    
    // Recommended procurement
    let recommendedQty = 0;
    if (daysUntilStockout <= leadTime + 2 || currentStock <= prod.reorderLevel) {
      recommendedQty = Math.max(0, targetStock - currentStock);
    }

    const estimatedCost = recommendedQty * prod.purchasePrice;
    const expectedRevenue = recommendedQty * prod.sellingPrice;
    const expectedProfit = expectedRevenue - estimatedCost;

    let confidence = 95;
    if (daysUntilStockout <= 2) confidence -= 5;
    if (festivalName) confidence += 4; // Higher confidence if festival demand is highly predictable

    return {
      productName: prod.name,
      currentStock,
      avgDailySales,
      leadTime,
      daysUntilStockout,
      festivalName,
      recommendedQty,
      estimatedCost,
      expectedRevenue,
      expectedProfit,
      profitMargin: profitMargin.toFixed(1),
      confidence: Math.min(99, Math.max(50, confidence))
    };
  })
  .filter(p => p.recommendedQty > 0) // only suggest items that need restocking
  .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout); // Prioritize soonest stockouts

  // Cap recommendations to stay within budget
  let runningCost = 0;
  const filteredProcurements = [];
  for (const item of calculatedProcurements) {
    if (runningCost + item.estimatedCost <= budget) {
      runningCost += item.estimatedCost;
      filteredProcurements.push(item);
    }
  }

  // Calculate totals
  const totalCost = filteredProcurements.reduce((sum, item) => sum + item.estimatedCost, 0);
  const totalProfit = filteredProcurements.reduce((sum, item) => sum + item.expectedProfit, 0);
  const averageConfidence = filteredProcurements.length > 0
    ? Math.round(filteredProcurements.reduce((sum, item) => sum + item.confidence, 0) / filteredProcurements.length)
    : 85;

  const festivalContext = upcomingFestivals.length > 0
    ? `Upcoming festivals: ${upcomingFestivals.map(f => f.name).join(', ')}`
    : 'No major festivals upcoming.';

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const prompt = `You are VyaparAI Business Operating Agent. Write a clean narrative summary and action recommendations based on this data.

OWNER QUERY: "${query}"
AVAILABLE BUDGET: ₹${budget}
FESTIVALS: ${festivalContext}

MATHEMATICAL CALCULATED RESTOCK ACTIONS:
${JSON.stringify(filteredProcurements, null, 2)}

Create a structured response in JSON format. Do not invent any pricing or quantity numbers. Explain the "reason" for each suggested restock using the daysUntilStockout, festival multiplier, or leadTime.

Return JSON:
{
  "decision": "Brief decision summary matching budget constraints",
  "actions": [
    {
      "action": "Restock [ProductName]",
      "reason": "Explain WHY based on daysUntilStockout, average sales, or Bihu/Durga Puja spike.",
      "quantity": "Calculated recommendedQty with unit (e.g. 120 kg or 50 packets)",
      "estimatedCost": 12000,
      "estimatedReturn": 16000,
      "priority": "high/medium/low",
      "do": true
    }
  ],
  "warnings": ["Warning about stockout days or cash constraints"],
  "insights": ["Specific insight about safety stock levels or festival demand"],
  "festivalAlert": "Alert details if Bihu or other festival is near",
  "narrative": "A concise 2-3 sentence overview explaining how this selection maximizes profit within the ₹${budget} budget."
}`;

  let geminiOutput = {
    decision: `Procurement plan formulated for ₹${totalCost} within budget.`,
    actions: filteredProcurements.map(item => ({
      action: `Restock ${item.productName}`,
      reason: `Depletion rate is ${item.avgDailySales} units/day. Out of stock in ${item.daysUntilStockout} days.`,
      quantity: `${item.recommendedQty} units`,
      estimatedCost: item.estimatedCost,
      estimatedReturn: item.expectedRevenue,
      priority: item.daysUntilStockout <= item.leadTime ? 'high' : 'medium',
      do: true
    })),
    warnings: filteredProcurements.filter(i => i.daysUntilStockout <= i.leadTime).map(i => `${i.productName} is in danger of running out before supplier delivery.`),
    insights: [`Restocking focus is on fast moving goods with ${filteredProcurements[0]?.profitMargin || 25}% margin.`],
    festivalAlert: upcomingFestivals.length > 0 ? `${upcomingFestivals[0].name} approaching.` : null,
    narrative: `Identified ${filteredProcurements.length} key restock opportunities matching your query. Priority given to items running out soonest.`
  };

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      geminiOutput = JSON.parse(jsonMatch[1]);
    }
  } catch (err) {
    console.error("Gemini failed in runBusinessBrain, using local calculations fallback:", err.message);
  }

  return {
    ...geminiOutput,
    totalEstimatedCost: totalCost,
    totalEstimatedProfit: totalProfit,
    confidence: averageConfidence
  };
}

// Generate daily business health score
async function generateBusinessHealth(metrics) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const upcomingFestivals = getUpcomingFestivals(14);

  const prompt = `You are VyaparAI Health Analyzer. Calculate a comprehensive business health score.

METRICS:
${JSON.stringify(metrics, null, 2)}

UPCOMING FESTIVALS: ${upcomingFestivals.map(f => f.name).join(', ') || 'None in 14 days'}

Return JSON:
{
  "overallScore": 85,
  "scores": {
    "inventory": { "score": 90, "label": "Excellent", "details": "..." },
    "cashFlow": { "score": 75, "label": "Good", "details": "..." },
    "customerSatisfaction": { "score": 88, "label": "Excellent", "details": "..." },
    "staffProductivity": { "score": 92, "label": "Outstanding", "details": "..." },
    "profitability": { "score": 80, "label": "Good", "details": "..." }
  },
  "suggestions": ["Recover ₹18,000 pending payments", "Order Cooking Oil — stock critical"],
  "alerts": ["Rice stock will finish in 4 days"],
  "voiceSummary": "Good morning! Yesterday sales were ₹X. Profit increased Y%. Three customers haven't paid. Rice stock will finish in 4 days.",
  "narrative": "Your business is performing well today with a score of 85/100..."
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
    return JSON.parse(jsonMatch ? jsonMatch[1] : text);
  } catch {
    return { overallScore: 75, scores: {}, suggestions: [], voiceSummary: 'Business data processed.' };
  }
}

// AI Stock Prediction - upgraded mathematical + AI reasoning pipeline
async function predictStockDemand(product, salesHistory = [], upcomingDays = 14) {
  const upcomingFestivals = getUpcomingFestivals(upcomingDays);
  
  // 1. Calculations
  const leadTimeDays = product.leadTime || 3; // Default supplier delivery lead time is 3 days
  const avgSales = product.avgDailySales || 1.5;
  const currentStock = product.currentStock || 0;
  
  // Calculate stockout days
  const daysUntilStockout = avgSales > 0 ? Math.max(0, Math.round(currentStock / avgSales)) : 99;
  
  // Check if upcoming festival impacts this product
  let festivalMultiplier = 1.0;
  let activeFestival = null;
  for (const fest of upcomingFestivals) {
    const matchesProduct = fest.products.some(p => product.name.toLowerCase().includes(p) || (product.category && product.category.name && product.category.name.toLowerCase().includes(p)));
    if (matchesProduct) {
      festivalMultiplier = 2.0; // Festival demand spike
      activeFestival = fest.name;
      break;
    }
  }

  // Safety Stock formula: Average Daily Sales * Lead Time * Safety Factor (1.5)
  const safetyStock = Math.round(avgSales * leadTimeDays * 1.5);
  
  // Recommended Purchase Qty: Target Stock - Current Stock
  // Target Stock is Safety Stock + (Avg Daily Sales * 30 days) * Festival Multiplier
  const targetStock = Math.round((safetyStock + (avgSales * 30)) * festivalMultiplier);
  const recommendedQty = Math.max(0, targetStock - currentStock);
  
  // Reorder Date calculation
  const today = new Date();
  const reorderDate = new Date();
  const daysToReorder = Math.max(0, daysUntilStockout - leadTimeDays);
  reorderDate.setDate(today.getDate() + daysToReorder);
  
  const stockoutDate = new Date();
  stockoutDate.setDate(today.getDate() + daysUntilStockout);

  // Confidence calculations based on variability and lead times
  let confidence = 95;
  if (daysUntilStockout <= 2) confidence -= 10; // High urgency reduces projection confidence
  if (salesHistory.length < 30) confidence -= 15; // Low historical data

  // Net revenue/profit expectations
  const estCost = recommendedQty * product.purchasePrice;
  const estRevenue = recommendedQty * product.sellingPrice;
  const estProfit = estRevenue - estCost;

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const prompt = `You are VyaparAI Stock Forecaster. Generate a brief business explanation for this mathematical forecast.
  
PRODUCT: ${product.name}
CURRENT STOCK: ${currentStock} units
AVG DAILY SALES: ${avgSales} units/day
LEAD TIME: ${leadTimeDays} days
DAYS TO STOCKOUT: ${daysUntilStockout} days
RECOMMENDED PROCUREMENT: ${recommendedQty} units
ESTIMATED COST: ₹${estCost}
ESTIMATED PROFIT: ₹${estProfit}
ACTIVE FESTIVAL: ${activeFestival || 'None'} (Multiplier: ${festivalMultiplier}x)

Provide a 2-3 sentence business explanation highlighting:
1. Sales trend explanation (e.g., stable, spike due to ${activeFestival || 'festivals'})
2. Urgency warning based on stockout date
3. Why this specific quantity (${recommendedQty}) was recommended.

Return a JSON string:
{
  "explanation": "Human readable explanation goes here",
  "urgency": "critical/high/medium/low"
}`;

  let geminiOutput = { explanation: `Based on daily sales average of ${avgSales} units. Reorder recommended before ${reorderDate.toDateString()}.`, urgency: 'medium' };
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      geminiOutput = JSON.parse(jsonMatch[1]);
    }
  } catch (err) {
    console.error("Gemini failed in predictStockDemand, using local template:", err.message);
  }

  return {
    daysUntilStockout,
    recommendedRestock: recommendedQty,
    confidence: Math.max(50, confidence),
    festivalImpact: activeFestival ? `${activeFestival} next week — expect ${festivalMultiplier}x demand` : 'Stable daily demand',
    trend: avgSales > 1.0 ? 'increasing' : 'stable',
    urgency: daysUntilStockout < leadTimeDays ? 'critical' : daysUntilStockout <= 5 ? 'high' : 'medium',
    insight: geminiOutput.explanation,
    reorderDate: reorderDate.toISOString().split('T')[0],
    stockoutDate: stockoutDate.toISOString().split('T')[0],
    estimatedCost: estCost,
    estimatedRevenue: estRevenue,
    estimatedProfit: estProfit
  };
}

// Customer Churn Prediction - Upgraded data-driven calculation + AI explanation
async function predictCustomerChurn(customer, purchaseHistory = []) {
  // 1. Calculations
  const lastPurchaseDate = customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate) : new Date(Date.now() - 30 * 86400000);
  const daysSinceLastPurchase = Math.max(0, Math.round((new Date() - lastPurchaseDate) / (1000 * 60 * 60 * 24)));
  
  let churnProbability = 10;
  if (daysSinceLastPurchase > 30) churnProbability += (daysSinceLastPurchase - 30) * 1.2; // Increase risk over time
  if (customer.outstandingBalance >= customer.creditLimit * 0.9) churnProbability += 20; // High debt risk
  if (customer.totalOrders < 3) churnProbability += 15; // Low frequency risk
  
  churnProbability = Math.min(99, Math.max(5, Math.round(churnProbability)));
  
  let segment = 'regular';
  if (daysSinceLastPurchase > 90) segment = 'lost';
  else if (churnProbability > 55) segment = 'at-risk';
  else if (customer.totalPurchased > 50000) segment = 'vip';

  const avgOrderValue = customer.totalOrders > 0 ? (customer.totalPurchased / customer.totalOrders) : 0;
  const targetOffer = segment === 'at-risk' ? "10% off combo purchase to re-engage" : segment === 'lost' ? "Clear balance for custom bonus points" : "Regular customer bonus";

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const prompt = `You are VyaparAI CRM Analyst. Generate a brief customer relationship summary based on this logic:
  
CUSTOMER: ${customer.name}
DAYS SINCE LAST ORDER: ${daysSinceLastPurchase} days
CHURN PROBABILITY: ${churnProbability}%
SEGMENT: ${segment}
OUTSTANDING DEBT: ₹${customer.outstandingBalance}

Write a 2-sentence summary explaining:
1. The customer's activity trend (why their churn risk is ${churnProbability}%)
2. Recommended follow-up action.

Return JSON:
{
  "explanation": "Human readable summary goes here",
  "action": "Immediate WhatsApp warning/discount offer/loyalty upgrade"
}`;

  let geminiOutput = { explanation: `Last purchased ${daysSinceLastPurchase} days ago. Overall relationship index is stable.`, action: 'Send loyalty point reminder.' };
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      geminiOutput = JSON.parse(jsonMatch[1]);
    }
  } catch (err) {
    console.error("Gemini failed in predictCustomerChurn:", err.message);
  }

  return {
    churnProbability,
    segment,
    lifetimeValue: customer.totalPurchased,
    predictedNextPurchase: new Date(Date.now() + 14*86400000).toISOString().split('T')[0],
    suggestedOffer: targetOffer,
    aiScore: 100 - churnProbability,
    insight: geminiOutput.explanation,
    action: geminiOutput.action
  };
}

// AI Negotiation Assistant - Upgraded with pricing math
async function getNegotiationAdvice(product, supplier, currentPrice) {
  // 1. Math preprocessing
  const previousPrices = supplier.priceHistory?.filter(p => p.product === product._id || p.productName === product.name).map(p => p.price) || [];
  const avgHistoryPrice = previousPrices.length > 0 ? (previousPrices.reduce((s, p) => s + p, 0) / previousPrices.length) : (product.purchasePrice * 0.95);
  const marketAvg = supplier.marketPrices?.find(m => m.product === product._id || m.productName === product.name)?.marketAvgPrice || (product.purchasePrice * 0.98);

  const suggestedNegotiationPrice = Number((Math.min(marketAvg, avgHistoryPrice) * 1.01).toFixed(2));
  const maxAcceptablePrice = Number((product.sellingPrice * 0.85).toFixed(2));
  const potentialSaving = Math.max(0, Math.round((currentPrice - suggestedNegotiationPrice) * 100));

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const prompt = `You are VyaparAI Negotiation Assistant. Generate a negotiation script for this shopkeeper:
  
PRODUCT: ${product.name}
SUPPLIER: ${supplier.name}
CURRENT QUOTE: ₹${currentPrice}
HISTORICAL AVG: ₹${avgHistoryPrice}
MARKET AVERAGE: ₹${marketAvg}
TARGET OFFER: ₹${suggestedNegotiationPrice}

Write a professional negotiation counter-script (1-2 sentences) citing last month's prices or market rates.

Return JSON:
{
  "negotiationScript": "Write script here"
}`;

  let geminiOutput = { negotiationScript: `We bought this for ₹${avgHistoryPrice} recently. Can we settle on ₹${suggestedNegotiationPrice} for this volume order?` };
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      geminiOutput = JSON.parse(jsonMatch[1]);
    }
  } catch (err) {
    console.error("Gemini failed in getNegotiationAdvice:", err.message);
  }

  return {
    lastMonthPrice: avgHistoryPrice,
    marketAvgPrice: marketAvg,
    suggestedNegotiationPrice,
    maxAcceptablePrice,
    negotiationScript: geminiOutput.negotiationScript,
    reasoning: `Target counter price set at 1.01x of market average to maintain supplier goodwill.`,
    potentialSaving,
    recommendation: currentPrice > maxAcceptablePrice ? 'negotiate' : 'accept'
  };
}

// AI Theft & Discrepancy Detection - Upgraded deterministic logic
async function detectTheft(product, expectedStock, actualStock, recentTransactions = []) {
  const discrepancy = expectedStock - actualStock;
  if (discrepancy <= 0) return null;

  // Anomaly score: percentage discrepancy relative to expected stock
  const anomalyScore = expectedStock > 0 ? Math.round((discrepancy / expectedStock) * 100) : 100;
  const totalValue = discrepancy * product.sellingPrice;
  
  let theftRisk = 'low';
  if (anomalyScore > 15 && totalValue > 1000) theftRisk = 'high';
  else if (anomalyScore > 5 || totalValue > 500) theftRisk = 'medium';

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const prompt = `You are VyaparAI Loss Prevention Agent. Write a loss prevention warning report for this discrepancy:
  
PRODUCT: ${product.name}
EXPECTED STOCK: ${expectedStock} units
ACTUAL STOCK: ${actualStock} units
DISCREPANCY: ${discrepancy} units (Value: ₹${totalValue})
THEFT RISK PROFILE: ${theftRisk}

Write a brief 1-2 sentence warning explaining why this discrepancy is suspicious and what internal actions to take (e.g. check checkout video, verify manual adjustments).

Return JSON:
{
  "report": "Analysis text goes here",
  "recommendation": "Audit request"
}`;

  let geminiOutput = { report: `Discrepancy of ${discrepancy} units detected without active sales invoices.`, recommendation: 'Verify stock adjustments.' };
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      geminiOutput = JSON.parse(jsonMatch[1]);
    }
  } catch (err) {
    console.error("Gemini failed in detectTheft:", err.message);
  }

  return {
    theftRisk,
    discrepancyType: theftRisk === 'high' ? 'theft' : 'shrinkage',
    confidence: anomalyScore,
    flaggedPeriod: "Last 24 hours",
    recommendation: geminiOutput.recommendation,
    report: geminiOutput.report
  };
}

// AI Purchase Planner
async function generatePurchasePlan(budget, inventory, salesData) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const festivals = getUpcomingFestivals(30);

  const prompt = `Create an optimal purchase plan for an Indian retail business.

AVAILABLE BUDGET: ₹${budget}
CURRENT INVENTORY: ${JSON.stringify(inventory.map(p => ({
    name: p.name, stock: p.currentStock, reorderLevel: p.reorderLevel,
    avgDailySales: p.avgDailySales, purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice,
    daysUntilStockout: p.daysUntilStockout
  })))}
RECENT SALES TRENDS: ${JSON.stringify(salesData)}
UPCOMING FESTIVALS: ${JSON.stringify(festivals)}

Return JSON:
{
  "purchaseList": [
    {
      "productName": "Rice",
      "quantity": 200,
      "unit": "kg",
      "estimatedCost": 9800,
      "reason": "Stock will finish in 3 days",
      "priority": "critical",
      "festivalBoost": true
    }
  ],
  "totalCost": 41250,
  "totalBudgetUsed": 41250,
  "remainingBudget": 8750,
  "expectedRevenue": 128000,
  "expectedProfit": 39000,
  "profitMargin": 30.5,
  "summary": "Optimal purchase plan prioritizing fast-moving items and festival demand"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
    return JSON.parse(jsonMatch ? jsonMatch[1] : text);
  } catch {
    return { purchaseList: [], totalCost: 0, summary: 'Unable to generate plan.' };
  }
}

// AI Growth Coach
async function generateGrowthInsights(analyticsData) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const prompt = `You are an AI Growth Coach for an Indian retail business. Analyze performance and give specific, actionable growth recommendations.

ANALYTICS DATA: ${JSON.stringify(analyticsData)}

Return JSON:
{
  "insights": [
    { "type": "opportunity", "message": "Tea sales ↑27% vs last month — increase stock by 15%", "impact": "₹8,500 extra profit" },
    { "type": "warning", "message": "Rice sales ↓11% — investigate pricing", "impact": "₹3,200 revenue at risk" }
  ],
  "growthActions": [
    {
      "action": "Increase Tea stock by 15%",
      "reason": "Trending upward + Bihu approaching",
      "expectedRevenuIncrease": 8500,
      "effort": "low"
    }
  ],
  "monthlyProfitProjection": 48000,
  "keyMetric": "Weekend sales are 40% higher — consider extended hours",
  "coachMessage": "Your business is on a growth trajectory! Focus on Tea and avoid over-stocking Sugar."
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
    return JSON.parse(jsonMatch ? jsonMatch[1] : text);
  } catch {
    return { insights: [], growthActions: [], coachMessage: 'Keep tracking your data for insights.' };
  }
}

// AI Chat (general queries)
async function chat(message, businessContext) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const prompt = `You are VyaparAI Assistant for ${businessContext.businessName || 'Sharma General Stores'} in Assam, India.
You help business owners with inventory, sales, customers, and operations.

BUSINESS DATA: ${JSON.stringify(businessContext)}

Answer this query concisely and helpfully. Use ₹ for amounts. Be specific with numbers from the data.

QUERY: "${message}"

Respond in 2-3 sentences max unless a list/report is requested.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = {
  runBusinessBrain, generateBusinessHealth, predictStockDemand,
  predictCustomerChurn, getNegotiationAdvice, detectTheft,
  generatePurchasePlan, generateGrowthInsights, chat,
  getUpcomingFestivals, FESTIVAL_CALENDAR
};
