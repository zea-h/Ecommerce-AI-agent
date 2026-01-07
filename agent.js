// Simple front-end logic for the Nexus single-page dashboard.

function $(id) {
  return document.getElementById(id);
}

// Sidebar navigation with smooth transitions
document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.getAttribute("data-panel");
    
    // Smooth panel transition
    document.querySelectorAll(".panel").forEach((p) => {
      if (p.classList.contains("active")) {
        p.style.opacity = "0";
        p.style.transform = "translateY(10px)";
        setTimeout(() => {
          p.classList.remove("active");
        }, 200);
      }
    });
    
    setTimeout(() => {
      const panel = document.getElementById(`panel-${target}`);
      if (panel) {
        panel.classList.add("active");
        panel.style.opacity = "0";
        panel.style.transform = "translateY(10px)";
        requestAnimationFrame(() => {
          panel.style.transition = "opacity 0.4s ease-out, transform 0.4s ease-out";
          panel.style.opacity = "1";
          panel.style.transform = "translateY(0)";
        });
      }
    }, 200);
  });
});

// Hero quick actions
const heroAskBtn = $("hero-ask-btn");
if (heroAskBtn) {
  heroAskBtn.addEventListener("click", () => {
    // Switch to chat and inject a message
    document.querySelector('[data-panel="chat"]').click();
    pushChat("user", "Give me today’s ecommerce plan across revenue, inventory, and risk.");
    const reply =
      "Here’s today’s high-level plan:\n" +
      "• Revenue: push a 5% bundle offer on Nimbus Pro to clear excess size runs.\n" +
      "• Inventory: schedule replenishment for running shoes (2.1 weeks of cover).\n" +
      "• Risk: tighten fraud checks on high‑value EU PayPal orders.\n" +
      "I can break this into channel‑specific tasks if you’d like.";
    pushChat("agent", reply);
  });
}

const planInvBtn = $("plan-inventory-btn");
if (planInvBtn) {
  planInvBtn.addEventListener("click", () => {
    document.querySelector('[data-panel="inventory"]').click();
    $("inv-sku").value = "SKU-ABS-01";
  });
}

// ---------- Enhanced data model ----------
const products = [
  { sku: "SKU-ABS-01", name: "Nimbus Pro Running Shoe", category: "Shoes", price: 129, margin: 0.58, stock: 45, size: ["7", "8", "9", "10", "11"], rating: 4.5, reviews: 127 },
  { sku: "SKU-ABS-02", name: "StrideLite Everyday Sneaker", category: "Shoes", price: 79, margin: 0.47, stock: 120, size: ["6", "7", "8", "9", "10", "11"], rating: 4.3, reviews: 89 },
  { sku: "SKU-ABS-03", name: "CoreFlex Training Short", category: "Apparel", price: 39, margin: 0.52, stock: 78, size: ["S", "M", "L", "XL"], rating: 4.7, reviews: 203 },
  { sku: "SKU-ABS-04", name: "AeroMax Jacket", category: "Apparel", price: 149, margin: 0.61, stock: 23, size: ["S", "M", "L", "XL", "XXL"], rating: 4.6, reviews: 156 },
  { sku: "SKU-ABS-05", name: "FlexFit Cap", category: "Accessories", price: 24, margin: 0.45, stock: 200, size: ["One Size"], rating: 4.4, reviews: 67 },
];

const orders = [
  { id: "ORD-2031", sku: "SKU-ABS-01", status: "In transit", etaDays: 2, customer: "John D.", value: 129, payment: "Credit Card", country: "US" },
  { id: "ORD-2090", sku: "SKU-ABS-02", status: "Processing", etaDays: 4, customer: "Sarah M.", value: 79, payment: "PayPal", country: "UK" },
  { id: "ORD-2001", sku: "SKU-ABS-01", status: "Delivered", etaDays: 0, customer: "Mike T.", value: 129, payment: "Credit Card", country: "US" },
  { id: "ORD-2105", sku: "SKU-ABS-03", status: "Shipped", etaDays: 3, customer: "Emma L.", value: 39, payment: "PayPal", country: "CA" },
];

const segments = [
  { name: "High‑Spenders", rule: "LTV > $1000, 3+ orders", count: 245, avgOrderValue: 156 },
  { name: "First‑Time Buyers", rule: "Exactly 1 order, joined in last 30 days", count: 892, avgOrderValue: 67 },
  { name: "At‑Risk", rule: "No orders in 90+ days, previously active", count: 1234, avgOrderValue: 89 },
  { name: "VIP Customers", rule: "LTV > $2000, 10+ orders", count: 78, avgOrderValue: 234 },
  { name: "Bargain Hunters", rule: "Only purchase on discount, avg order < $50", count: 567, avgOrderValue: 34 },
];

const abandonedCarts = [
  { id: "CART-001", items: ["SKU-ABS-01"], value: 129, abandonedHours: 12, customer: "guest_123" },
  { id: "CART-002", items: ["SKU-ABS-02", "SKU-ABS-03"], value: 118, abandonedHours: 48, customer: "user_456" },
  { id: "CART-003", items: ["SKU-ABS-04"], value: 149, abandonedHours: 6, customer: "user_789" },
];

const competitors = [
  { name: "Competitor A", product: "SKU-ABS-01", price: 125, ourPrice: 129 },
  { name: "Competitor B", product: "SKU-ABS-02", price: 75, ourPrice: 79 },
  { name: "Competitor C", product: "SKU-ABS-03", price: 35, ourPrice: 39 },
];

const warehouses = [
  { id: "WH-001", name: "Main Warehouse", location: "New York", stock: { "SKU-ABS-01": 45, "SKU-ABS-02": 120, "SKU-ABS-03": 78 } },
  { id: "WH-002", name: "West Coast Hub", location: "Los Angeles", stock: { "SKU-ABS-01": 23, "SKU-ABS-02": 67, "SKU-ABS-03": 45 } },
];

// ---------- Chat ----------
const chatWindow = $("chat-window");
const intentList = $("intent-list");

// Conversation history for context memory
let conversationHistory = [];

// OpenAI Configuration
let openaiClient = null;
const OPENAI_API_KEY = localStorage.getItem('nexus_openai_key') || '';

// Initialize OpenAI client
function initOpenAI() {
  // Wait for OpenAI to be available
  if (typeof OpenAI === 'undefined') {
    setTimeout(initOpenAI, 100);
    return false;
  }
  
  if (OPENAI_API_KEY) {
    try {
      openaiClient = new OpenAI({
        apiKey: OPENAI_API_KEY,
        dangerouslyAllowBrowser: true // Required for browser usage - API key stored in localStorage
      });
      console.log('OpenAI client initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize OpenAI:', error);
      return false;
    }
  }
  return false;
}

// Check for API key on load and update status
function updateAPIStatus() {
  const statusEl = document.getElementById('api-status');
  if (statusEl) {
    if (OPENAI_API_KEY && openaiClient) {
      statusEl.textContent = '✅ AI Powered by OpenAI';
      statusEl.style.color = 'var(--success)';
    } else {
      statusEl.innerHTML = '⚠️ Set API key: <code style="background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;">localStorage.setItem("nexus_openai_key", "your-key")</code>';
      statusEl.style.color = 'var(--warning)';
    }
  }
}

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key not found. Please set it using: localStorage.setItem("nexus_openai_key", "your-api-key")');
}

// Initialize OpenAI
initOpenAI();
updateAPIStatus();

// Allow setting API key via console or URL parameter
window.setNexusAPIKey = function(key) {
  localStorage.setItem('nexus_openai_key', key);
  location.reload();
};

// Check for API key in URL (for easy setup)
const urlParams = new URLSearchParams(window.location.search);
const apiKeyFromUrl = urlParams.get('api_key');
if (apiKeyFromUrl && !OPENAI_API_KEY) {
  localStorage.setItem('nexus_openai_key', apiKeyFromUrl);
  window.location.search = ''; // Remove from URL
  location.reload();
}

// Initialize with welcome message (only once)
let welcomeShown = false;
if (chatWindow && !welcomeShown && chatWindow.children.length === 0) {
  const welcomeMsg = OPENAI_API_KEY 
    ? "👋 **Welcome to Nexus!**\n\nI'm your AI-powered e-commerce assistant powered by OpenAI. I understand context, remember our conversations, and can help with all aspects of your e-commerce operations!\n\n**What I can help with:**\n• Customer support & order tracking\n• Inventory & demand forecasting\n• Fraud detection & risk scoring\n• Product recommendations & comparisons\n• Pricing optimization & competitor analysis\n• Marketing campaigns & content generation\n• Analytics & insights\n• And much more!\n\n**Just ask me anything in natural language!** I'll understand context and provide intelligent responses! 🚀"
    : "👋 **Welcome to Nexus!**\n\n⚠️ **OpenAI API Key Required**\n\nTo enable AI-powered responses, please set your OpenAI API key:\n\n1. Open browser console (F12)\n2. Run: `localStorage.setItem('nexus_openai_key', 'your-api-key-here')`\n3. Refresh the page\n\n**What I can help with:**\n• Customer support & order tracking\n• Inventory & demand forecasting\n• Fraud detection & risk scoring\n• Product recommendations & comparisons\n• Pricing optimization & competitor analysis\n• Marketing campaigns & content generation\n• Analytics & insights\n\nOnce configured, I'll provide intelligent, context-aware responses! 🚀";
  pushChat("agent", welcomeMsg);
  conversationHistory.push({ role: "assistant", content: welcomeMsg });
  welcomeShown = true;
}

function pushChat(role, text) {
  if (!chatWindow) return;
  const div = document.createElement("div");
  div.className = `chat-message ${role}`;
  div.style.opacity = "0";
  div.style.transform = "translateY(10px) scale(0.95)";
  
  if (role === "agent") {
    // Format text with better readability
    const formattedText = formatMessage(text);
    div.innerHTML = formattedText;
    chatWindow.appendChild(div);
    // Animate appearance
    requestAnimationFrame(() => {
      div.style.transition = "opacity 0.3s ease-out, transform 0.3s ease-out";
      div.style.opacity = "1";
      div.style.transform = "translateY(0) scale(1)";
    });
  } else {
    div.textContent = text;
    chatWindow.appendChild(div);
    requestAnimationFrame(() => {
      div.style.transition = "opacity 0.3s ease-out, transform 0.3s ease-out";
      div.style.opacity = "1";
      div.style.transform = "translateY(0) scale(1)";
    });
  }
  
  setTimeout(() => {
    chatWindow.scrollTo({
      top: chatWindow.scrollHeight,
      behavior: "smooth"
    });
  }, 100);
}

function formatMessage(text) {
  // Convert markdown-style formatting to HTML for better readability
  let formatted = text
    // Bold text (**text**)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Numbered lists (1. item)
    .replace(/(\d+)\.\s+(.+?)(?=\n|$)/g, '<div style="margin: 4px 0;"><strong>$1.</strong> $2</div>')
    // Bullet points (• item)
    .replace(/•\s+(.+?)(?=\n|$)/g, '<div style="margin: 4px 0; padding-left: 8px;">• $1</div>')
    // Headers (text with emoji at start)
    .replace(/^([🎯📦💰👥⭐💬🛡️📊✍️👋💡])\s+\*\*(.+?)\*\*/gm, '<div style="font-size: 13px; font-weight: 600; margin-bottom: 8px; margin-top: 4px;">$1 <strong>$2</strong></div>')
    // Line breaks
    .replace(/\n\n/g, '<div style="height: 8px;"></div>')
    .replace(/\n/g, '<br>');
  
  return formatted;
}

function typeMessage(element, text, index = 0) {
  if (index < text.length) {
    element.textContent = text.substring(0, index + 1);
    requestAnimationFrame(() => {
      element.style.opacity = "1";
      element.style.transform = "translateY(0) scale(1)";
    });
    setTimeout(() => typeMessage(element, text, index + 1), 20);
  } else {
    element.style.transition = "opacity 0.3s ease-out, transform 0.3s ease-out";
  }
}

function detectIntents(message) {
  const lower = message.toLowerCase();
  const intents = [];
  // Customer Support
  if (/(support|refund|return|exchange|help|issue|faq|complaint|inquiry)/.test(lower)) intents.push("support");
  // Product Recommendations & Sales
  if (/(recommend|suggest|similar|compare|upsell|cross.sell|size|fit)/.test(lower)) intents.push("recommendations");
  // Order Management
  if (/(order|tracking|where.*order|status|shipping|delivery|eta)/.test(lower)) intents.push("orders");
  // Inventory & Operations
  if (/(inventory|stock|sku|cover|demand|reorder|warehouse|supplier|low.stock|overstock)/.test(lower)) intents.push("inventory");
  // Pricing & Competition
  if (/(price|discount|promo|campaign|offer|competitor|margin|pricing|dynamic.price)/.test(lower)) intents.push("pricing/marketing");
  // Fraud & Security
  if (/(fraud|chargeback|risk|suspicious|security|verify|bot|attack)/.test(lower)) intents.push("fraud");
  // Segmentation & Marketing
  if (/(segment|cohort|audience|target|personalize|email.campaign|abandoned.cart)/.test(lower)) intents.push("segmentation");
  // Reviews & Analytics
  if (/(review|rating|sentiment|analyze|insight|report|dashboard|trend|conversion|satisfaction)/.test(lower)) intents.push("reviews");
  // Content Generation
  if (/(description|copy|email|subject|content|generate|write|create)/.test(lower)) intents.push("content");
  // Search & Discovery
  if (/(search|find|filter|sort|discover|visual.search)/.test(lower)) intents.push("search");
  // Post-Purchase
  if (/(confirm|shipping.update|warranty|follow.up|post.purchase)/.test(lower)) intents.push("post-purchase");
  // Analytics
  if (/(analytics|report|dashboard|metric|kpi|sales.report|behavior|pattern)/.test(lower)) intents.push("analytics");
  if (!intents.length) intents.push("general");
  return intents;
}

// Call OpenAI API for intelligent responses
async function callOpenAI(userMessage) {
  if (!openaiClient) {
    // Fallback to pattern matching if OpenAI not configured
    return null;
  }

  try {
    // Prepare messages for OpenAI (convert our format to OpenAI format)
    // Only include recent history to stay within token limits
    const recentHistory = conversationHistory.slice(-20); // Last 20 messages
    const messages = recentHistory.map(msg => ({
      role: msg.role === "agent" || msg.role === "assistant" ? "assistant" : msg.role,
      content: msg.content
    }));

    // Add system prompt with context about Nexus capabilities
    const systemPrompt = `You are Nexus, an advanced AI-powered e-commerce assistant. You help with:

**Customer Interaction & Support:**
- 24/7 customer inquiries, FAQs, order tracking, returns/exchanges, multi-language support

**Sales & Conversion:**
- Product recommendations, abandoned cart recovery, upsell/cross-sell, size/fit guidance, product comparisons

**Inventory & Operations:**
- Real-time stock monitoring, demand forecasting, multi-warehouse management, supplier tracking, automated reordering

**Pricing & Competition:**
- Dynamic pricing, competitor monitoring, discount optimization, margin management

**Marketing & Content:**
- Email campaigns, product descriptions, A/B testing, social media automation, customer segmentation

**Analytics & Insights:**
- Sales reports, behavior analysis, trend identification, conversion tracking, sentiment analysis

**Fraud & Security:**
- Transaction monitoring, risk scoring, account protection, bot detection

**Search & Discovery:**
- Intelligent search, visual search, smart filtering, auto-corrections

**Post-Purchase:**
- Order confirmations, shipping updates, review requests, follow-up campaigns

**Available Data:**
- Products: ${products.map(p => `${p.name} (${p.sku}) - $${p.price}`).join(', ')}
- Orders: ${orders.map(o => `${o.id} - ${o.status}`).join(', ')}
- Segments: ${segments.map(s => s.name).join(', ')}

Provide helpful, detailed, and actionable responses. Use emojis appropriately. Format responses with clear sections using markdown. Remember conversation context and provide intelligent follow-ups.`;

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini", // Using mini for faster, cost-effective responses
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const aiResponse = response.choices[0].message.content;
    
    // Check if AI response mentions actions we should take
    // (e.g., opening panels, filling forms, etc.)
    handleAIActions(userMessage, aiResponse);
    
    return aiResponse;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    if (error.message.includes('API key')) {
      return "⚠️ **API Key Error**\n\nPlease check your OpenAI API key. Set it using:\n\n`localStorage.setItem('nexus_openai_key', 'your-key-here')`\n\nThen refresh the page.";
    }
    return null; // Fallback to pattern matching
  }
}

// Handle UI actions based on AI response or user message
function handleAIActions(userMessage, aiResponse) {
  const lower = userMessage.toLowerCase();
  const responseLower = aiResponse.toLowerCase();
  
  // Check for order IDs and open order tracking
  const orderMatch = userMessage.match(/ORD[-\s]*(\d+)/i);
  if (orderMatch && (lower.includes('order') || lower.includes('track'))) {
    const orderId = `ORD-${orderMatch[1]}`;
    const order = orders.find(o => o.id === orderId);
    if (order) {
      logTask(`AI detected order tracking request for ${orderId} → Order found: ${order.status}`);
    }
  }
  
  // Check for SKU mentions and open inventory if relevant
  const skuMatch = userMessage.match(/SKU[-A-Z0-9]+/i);
  if (skuMatch && (lower.includes('inventory') || lower.includes('stock') || lower.includes('forecast') || lower.includes('demand'))) {
    const sku = skuMatch[0].toUpperCase();
    const invBtn = document.querySelector('.nav-item[data-panel="inventory"]');
    if (invBtn) {
      setTimeout(() => {
        invBtn.click();
        if ($("inv-sku")) $("inv-sku").value = sku;
        logTask(`AI detected inventory request for ${sku} → Opened Inventory panel`);
      }, 500);
    }
  }
  
  // Check for fraud mentions
  if ((lower.includes('fraud') || lower.includes('risk') || lower.includes('score')) && orderMatch) {
    const fraudBtn = document.querySelector('.nav-item[data-panel="fraud"]');
    if (fraudBtn) {
      setTimeout(() => {
        fraudBtn.click();
        if ($("fraud-order-id")) $("fraud-order-id").value = `ORD-${orderMatch[1]}`;
        logTask(`AI detected fraud check request → Opened Fraud panel`);
      }, 500);
    }
  }
  
  // Check for content generation requests
  if ((lower.includes('description') || lower.includes('copy') || lower.includes('write') || lower.includes('generate')) && 
      (lower.includes('product') || lower.includes('for'))) {
    const contentBtn = document.querySelector('.nav-item[data-panel="content"]');
    if (contentBtn) {
      setTimeout(() => {
        contentBtn.click();
        logTask(`AI detected content generation request → Opened Content panel`);
      }, 500);
    }
  }
}

function handleChat(message) {
  // Add user message to history
  conversationHistory.push({ role: "user", content: message });
  
  // Get recent conversation context (last 5 exchanges for context)
  const recentContext = conversationHistory.slice(-10); // Last 10 messages (5 exchanges)
  
  const intents = detectIntents(message);
  const lower = message.toLowerCase();
  
  // Check for follow-up questions or references to previous conversation
  const isFollowUp = /(that|this|it|those|them|above|previous|earlier|before|what|how|when|where|why|which|who)/i.test(message);
  const hasReference = recentContext.length > 2 && isFollowUp;
  
  // Extract context from previous messages
  const previousTopics = recentContext
    .filter(m => m.role === "user")
    .slice(-3)
    .map(m => m.content.toLowerCase());
  
  const previousResponses = recentContext
    .filter(m => m.role === "agent" || m.role === "assistant")
    .slice(-2)
    .map(m => m.content);

  // ----- Direct task routing from chat -----

  // Orders: if an order ID is provided, answer directly with enhanced updates
  if (intents.includes("orders")) {
    // Check if we discussed an order before (context-aware)
    let id = null;
    const idMatch = message.match(/ORD[-\s]*(\d+)/i);
    if (idMatch) {
      id = `ORD-${idMatch[1]}`;
    } else if (hasReference) {
      // Try to find order ID from previous context
      const prevOrderMatch = previousTopics.join(" ").match(/ORD[-\s]*(\d+)/i);
      if (prevOrderMatch) {
        id = `ORD-${prevOrderMatch[1]}`;
      }
    }
    
    const ord = id ? orders.find((o) => o.id === id) : null;
    if (!ord) {
      // Check if we were just discussing an order
      if (hasReference && previousTopics.some(t => /order|ORD/.test(t))) {
        return "📦 **Order Follow-up**\n\nI see you're asking about the order we discussed. Could you clarify:\n\n• Do you want to check the status again?\n• Need shipping updates?\n• Want to modify or cancel it?\n• Have a question about delivery?\n\nOr provide the order ID (e.g., ORD-2031) and I'll give you the full details!";
      }
      return "📦 **Order Tracking**\n\nI can help you track any order! Just provide the order ID (e.g., ORD-2031) and I'll give you:\n\n• Current status\n• Estimated delivery date\n• Shipping updates\n• Next steps or recommendations\n\nWhat order would you like to check?";
    }
    
    const orderDetails = getOrderStatusWithUpdates(id);
    const statusEmoji = ord.status === "Delivered" ? "✅" : ord.status === "In transit" ? "🚚" : ord.status === "Shipped" ? "📮" : "⏳";
    
    const updatesText = orderDetails.updates.map(u => `• ${u}`).join("\n");
    
    return (
      `📦 **Order ${ord.id}**\n\n` +
      `${statusEmoji} **Status:** ${ord.status}\n` +
      `📅 **ETA:** ${ord.etaDays === 0 ? "Delivered" : `${ord.etaDays} day(s)`}\n` +
      `🛍️ **Product:** ${ord.sku}\n` +
      `👤 **Customer:** ${ord.customer}\n` +
      `💰 **Value:** $${ord.value}\n` +
      `💳 **Payment:** ${ord.payment}\n` +
      `🌍 **Country:** ${ord.country}\n\n` +
      `**Shipping Updates:**\n${updatesText}\n\n` +
      `**Next Action:** ${orderDetails.nextAction}\n\n` +
      (ord.status === "Delivered"
        ? "💡 **Post-Purchase:**\n• Review request sent\n• Follow-up recommendations ready\n• Return window: 30 days"
        : ord.etaDays > 3
        ? "💡 **Recommendation:** If this is past the expected ETA, I'll contact the carrier and send a courtesy update to the customer."
        : "💡 **All Good:** This order is on track. I'll send automatic updates as it progresses.")
    );
  }

  // Fraud: if an order ID is mentioned, score it immediately
  if (intents.includes("fraud")) {
    const idMatch = message.match(/ORD[-\s]*(\d+)/i);
    const id = idMatch ? `ORD-${idMatch[1]}` : null;
    if (id) {
      const fraudBtn = document.querySelector('.nav-item[data-panel="fraud"]');
      if (fraudBtn) fraudBtn.click();
      if ($("fraud-order-id")) $("fraud-order-id").value = id;
      if ($("fraud-notes")) $("fraud-notes").value = message;
      if (typeof fraudForm !== "undefined" && fraudForm) {
        fraudForm.dispatchEvent(new Event("submit"));
      }
      return `🛡️ **Fraud Analysis Started**\n\nI'm analyzing order ${id} for fraud risk right now.\n\n**What I'm checking:**\n• Payment method patterns\n• Billing/shipping mismatches\n• Order value anomalies\n• Geographic risk signals\n\nCheck the **Fraud Radar** panel on the left to see the risk score and detailed breakdown.`;
    }
    return (
      "🛡️ **Fraud Detection**\n\nI can help you identify potentially fraudulent orders by analyzing:\n\n**Risk Signals I Monitor:**\n• Payment method (PayPal, credit cards, etc.)\n• Billing and shipping address mismatches\n• High-value orders\n• Unusual geographic patterns\n• Order velocity (multiple orders in short time)\n\n**How to Use:**\nJust mention an order ID and any concerns. For example:\n\"Score ORD-2031 for fraud - it's a high-value PayPal order from a different country\"\n\nI'll analyze it and give you a clear risk assessment! 🎯"
    );
  }

  // Inventory & demand: run forecast when SKU (+ optional weeks) appears
  if (intents.includes("inventory")) {
    let sku = null;
    let weeks = 8;
    
    const skuMatch = message.match(/SKU[-A-Z0-9]+/i);
    const weeksMatch = message.match(/(\d+)\s*(weeks?|wks?)/i);
    
    if (skuMatch) {
      sku = skuMatch[0].toUpperCase();
    } else if (hasReference) {
      // Check previous context for SKU
      const prevSkuMatch = previousTopics.join(" ").match(/SKU[-A-Z0-9]+/i);
      if (prevSkuMatch) {
        sku = prevSkuMatch[0].toUpperCase();
      }
    }
    
    if (weeksMatch) {
      weeks = parseInt(weeksMatch[1], 10);
    } else if (hasReference) {
      // Check previous context for weeks
      const prevWeeksMatch = previousTopics.join(" ").match(/(\d+)\s*(weeks?|wks?)/i);
      if (prevWeeksMatch) {
        weeks = parseInt(prevWeeksMatch[1], 10);
      }
    }
    
    if (sku) {
      const invBtn = document.querySelector('.nav-item[data-panel="inventory"]');
      if (invBtn) invBtn.click();
      if ($("inv-sku")) $("inv-sku").value = sku;
      if ($("inv-weeks")) $("inv-weeks").value = String(weeks);
      if (typeof invForm !== "undefined" && invForm) {
        invForm.dispatchEvent(new Event("submit"));
      }
      
      // Check if this is a follow-up question
      if (hasReference && previousTopics.some(t => /inventory|forecast|stock|demand/.test(t))) {
        return `📊 **Follow-up on ${sku} Forecast**\n\nI remember we were discussing ${sku}. I'm updating the forecast for the next ${weeks} weeks.\n\n**What I'm calculating:**\n• Weekly demand projections\n• Current stock coverage\n• Risk level (Critical / At Risk / Comfortable)\n• Replenishment recommendations\n\n**Previous context:** Based on our earlier discussion, I'm factoring in the trends we identified.\n\nCheck the **Inventory & Demand** panel to see the detailed forecast chart! 📈`;
      }
      
      return `📊 **Inventory Forecast Started**\n\nI'm analyzing ${sku} and forecasting demand for the next ${weeks} weeks.\n\n**What I'm calculating:**\n• Weekly demand projections\n• Current stock coverage\n• Risk level (Critical / At Risk / Comfortable)\n• Replenishment recommendations\n\nCheck the **Inventory & Demand** panel to see the detailed forecast chart and recommendations! 📈`;
    }
    return (
      "📦 **Inventory Management**\n\nI can help you manage inventory and predict demand:\n\n**What I Do:**\n• Forecast weekly demand for any SKU\n• Calculate weeks of stock coverage\n• Identify at-risk products (low stock)\n• Suggest optimal replenishment timing\n• Recommend promo strategies based on stock levels\n\n**How to Use:**\nJust ask me to forecast a specific SKU. For example:\n\"Forecast demand for SKU-ABS-01 for 12 weeks\"\n\nI'll analyze it and show you a visual forecast with actionable recommendations! 🎯"
    );
  }

  // Content: generate copy directly from chat
  if (intents.includes("content")) {
    const contentBtn = document.querySelector('.nav-item[data-panel="content"]');
    if (contentBtn) contentBtn.click();
    // Try to extract a product name after "for"
    let name = "";
    const forMatch = message.match(/for\s+([^.,]+)/i);
    if (forMatch) {
      name = forMatch[1].trim();
    } else {
      name = products[0]?.name || "Your product";
    }
    const tone =
      /premium/i.test(lower) ? "premium" : /playful|fun/i.test(lower) ? "playful" : "neutral";
    const toneLabel = tone === "premium" ? "Premium & Aspirational" : tone === "playful" ? "Playful & Energetic" : "Neutral & Factual";
    if ($("content-name")) $("content-name").value = name;
    if ($("content-features")) {
      $("content-features").value =
        "Comfortable fit, durable construction, suitable for daily ecommerce shoppers.";
    }
    if ($("content-tone")) $("content-tone").value = tone;
    generateCopy();
    return `✍️ **Product Description Generated**\n\nI've created a ${toneLabel.toLowerCase()} product description for **"${name}"**!\n\n**What I Generated:**\n• SEO-optimized product copy\n• Engaging opening line\n• Key features list\n• Customer benefits section\n\n**View it in:** The **AI Copy Studio** panel (left sidebar)\n\n**Want to adjust?** You can change the tone (premium/playful/neutral) or edit the features, and I'll rewrite it instantly! 🎨`;
  }

  // Recommendations - Context-aware
  if (intents.includes("recommendations")) {
    // Check if we discussed specific products before
    const mentionedProducts = [];
    previousTopics.forEach(topic => {
      products.forEach(p => {
        if (topic.includes(p.name.toLowerCase()) || topic.includes(p.sku.toLowerCase())) {
          mentionedProducts.push(p);
        }
      });
    });
    
    // If asking about a previously mentioned product
    if (hasReference && mentionedProducts.length > 0 && /(similar|like|other|alternative|compare)/.test(lower)) {
      const similar = products
        .filter(p => p.category === mentionedProducts[0].category && p.sku !== mentionedProducts[0].sku)
        .slice(0, 3)
        .map((p, idx) => `${idx + 1}. **${p.name}** - $${p.price} (${p.category})`)
        .join("\n");
      return (
        `🎯 **Similar Products to ${mentionedProducts[0].name}**\n\nBased on our previous discussion, here are similar options:\n\n${similar}\n\n💡 **Why these?**\n• Same category (${mentionedProducts[0].category})\n• Similar price range\n• High customer ratings\n\nWould you like to compare any of these? 🛍️`
      );
    }
    
    const focus =
      products
        .map((p, idx) => `${idx + 1}. **${p.name}**\n   • Category: ${p.category}\n   • Price: $${p.price}\n   • Margin: ${(p.margin * 100).toFixed(0)}%`)
        .join("\n\n") || "I don't have products loaded yet.";
    return (
      "🎯 **Product Recommendations**\n\nBased on your request, here are my top recommendations:\n\n" +
      focus +
      "\n\n💡 **How I Personalize:**\nIn a live store, I analyze:\n• Browsing history\n• Past purchase behavior\n• Similar customer preferences\n• Product popularity trends\n\nThis creates a personalized list tailored to each visitor! 🛍️"
    );
  }

  // Customer service - Enhanced with actual processing
  if (intents.includes("support")) {
    // If there's actual customer message content, process it
    if (message.length > 20 && !/(what|how|can|help|support)/i.test(message.substring(0, 20))) {
      const ticket = handleSupportTicket(message);
      return (
        `💬 **Support Ticket Processed**\n\n**Intent Detected:** ${ticket.intent}\n**Priority:** ${ticket.priority}\n**Needs Human Review:** ${ticket.needsHumanReview ? "Yes ⚠️" : "No ✅"}\n\n**Suggested Response:**\n"${ticket.suggestedResponse}"\n\n**Next Steps:**\n${ticket.needsHumanReview ? "• Escalated to human agent\n• Customer will be contacted within 1 hour" : "• Response ready to send\n• Auto-tagged and logged"}`
      );
    }
    return (
      "💬 **Customer Support Assistant**\n\nI can help you handle customer inquiries efficiently:\n\n**What I Do:**\n• **Auto-tag** the inquiry type (refund, sizing, shipping, etc.)\n• **Draft** professional response templates\n• **Escalate** urgent issues (legal, fraud, safety)\n• **Multi-language support** (15+ languages)\n• **24/7 availability**\n\n**How to Use:**\nJust paste the customer's message here, and I'll:\n1. Identify the intent automatically\n2. Draft a helpful response\n3. Flag if it needs human review\n4. Suggest next best actions\n\n**Example:** Paste a customer message like:\n\"I need a refund for my order, it doesn't fit\"\n\nI'll process it immediately! 📝"
    );
  }

  // Pricing / marketing / abandoned cart / campaigns
  if (intents.includes("pricing/marketing")) {
    return (
      "💰 **Pricing & Marketing Strategy**\n\nI can help you optimize pricing and create effective campaigns:\n\n**Pricing Optimization:**\n• Dynamic price adjustments based on demand\n• Margin target optimization\n• Competitor price monitoring\n• Seasonal pricing strategies\n\n**Marketing Campaigns:**\n• Personalized email flows (welcome, win-back, VIP)\n• Abandoned cart recovery with smart discounts\n• Product launch campaigns\n• Seasonal promotions\n\n**How to Use:**\nTell me your goal! For example:\n\"Create a campaign to sell through excess shorts in 2 weeks\"\n\nI'll design a complete strategy with pricing, messaging, and channel recommendations! 🎯"
    );
  }

  // Segmentation / personalized marketing
  if (intents.includes("segmentation")) {
    const segText = segments
      .map((s, idx) => `${idx + 1}. **${s.name}**\n   ${s.rule}`)
      .join("\n\n");
    return (
      "👥 **Customer Segmentation**\n\nI automatically group your customers into segments based on behavior:\n\n**Current Segments:**\n\n" +
      segText +
      "\n\n**What I Can Do:**\n• Create targeted campaigns for each segment\n• Suggest the best channels (email, SMS, push)\n• Design personalized messaging\n• Optimize send timing\n\n**How to Use:**\nTell me what you want to achieve! For example:\n\"Re-engage the At-Risk segment with a win-back campaign\"\n\nI'll create a complete campaign strategy tailored to that segment! 🎯"
    );
  }

  // Reviews & Sentiment Analysis
  if (intents.includes("reviews")) {
    const productMatch = message.match(/(SKU[-A-Z0-9]+|product|item)/i);
    if (productMatch) {
      const product = products.find(p => p.sku === productMatch[0] || message.toLowerCase().includes(p.name.toLowerCase()));
      if (product) {
        return (
          `⭐ **Review Analysis for ${product.name}**\n\n**Current Stats:**\n• Rating: ${product.rating}/5.0 ⭐\n• Total Reviews: ${product.reviews}\n• Sentiment: ${product.rating >= 4.5 ? "Highly Positive" : product.rating >= 4.0 ? "Positive" : "Mixed"}\n\n**Key Insights:**\n• **Strengths:** Comfort, durability, value for money\n• **Common Themes:** Quality construction, good fit, fast shipping\n• **Areas for Improvement:** Size availability, color options\n\n**Action Items:**\n1. Highlight comfort & durability in product page\n2. Expand size range based on demand\n3. Consider adding more color variants\n\nI can analyze specific review text if you paste it here! 📊`
        );
      }
    }
    return (
      "⭐ **Review Analysis**\n\nI can analyze customer reviews to give you actionable insights:\n\n**What I Analyze:**\n• Overall sentiment (positive / mixed / negative)\n• Common themes and patterns\n• Product strengths and weaknesses\n• Customer pain points\n\n**What You Get:**\n• Sentiment score breakdown\n• Top 3 recurring themes\n• Specific action items for:\n  - Customer experience improvements\n  - Product page copy updates\n  - Product development priorities\n\n**How to Use:**\nJust paste 5–10 recent reviews for any product, or ask \"Analyze reviews for SKU-ABS-01\" and I'll give you a comprehensive analysis! 📊"
    );
  }

  // Abandoned Cart Recovery
  if (intents.includes("segmentation") && /abandoned|cart/.test(lower)) {
    const cartCount = abandonedCarts.length;
    const totalValue = abandonedCarts.reduce((sum, c) => sum + c.value, 0);
    const cartsList = abandonedCarts.slice(0, 3).map(c => 
      `• Cart ${c.id}: $${c.value} (${c.abandonedHours}h ago)`
    ).join("\n");
    return (
      `🛒 **Abandoned Cart Recovery**\n\n**Current Status:**\n• Active abandoned carts: ${cartCount}\n• Total potential revenue: $${totalValue}\n• Average time since abandonment: ${Math.round(abandonedCarts.reduce((s, c) => s + c.abandonedHours, 0) / cartCount)} hours\n\n**Recent Abandoned Carts:**\n${cartsList}\n\n**Recovery Strategy:**\n1. **Immediate (0-6h):** Send reminder email with urgency\n2. **Short-term (6-24h):** Offer 5% discount code\n3. **Medium-term (24-48h):** Send personalized recommendations\n4. **Long-term (48h+):** Win-back campaign with 10% discount\n\n**Automated Actions:**\n• Email sequences triggered automatically\n• SMS reminders for high-value carts\n• Personalized product recommendations\n\nI can create a recovery campaign for specific carts or segments! 💰`
    );
  }

  // Search & Discovery
  if (intents.includes("search")) {
    const searchTerm = message.replace(/(search|find|look.for|show)/gi, "").trim();
    if (searchTerm && searchTerm.length > 2) {
      const matches = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matches.length > 0) {
        const results = matches.map(p => 
          `• **${p.name}** (${p.sku}) - $${p.price} - ${p.stock} in stock`
        ).join("\n");
        return (
          `🔍 **Search Results for "${searchTerm}"**\n\nFound ${matches.length} product(s):\n\n${results}\n\n**Search Features:**\n• Intelligent filtering by category, price, availability\n• Visual search capabilities (coming soon)\n• Auto-correction for typos\n• Related product suggestions\n\n**Try:** \"Filter shoes under $100\" or \"Show all apparel in stock\" 🎯`
        );
      }
    }
    return (
      "🔍 **Search & Discovery**\n\nI can help customers find products quickly:\n\n**Search Capabilities:**\n• **On-site search optimization** - Intelligent ranking\n• **Visual search** - Find products by image\n• **Smart filtering** - Category, price, size, availability\n• **Auto-corrections** - Handle typos and variations\n• **Search suggestions** - Popular and related terms\n\n**How to Use:**\nAsk me to search for anything! For example:\n• \"Search for running shoes\"\n• \"Find products under $50\"\n• \"Show all items in stock\"\n• \"Filter by category: Apparel\"\n\nI'll return relevant results with smart sorting! 🎯"
    );
  }

  // Post-Purchase Engagement
  if (intents.includes("post-purchase")) {
    return (
      "📧 **Post-Purchase Engagement**\n\nI automate the entire post-purchase journey:\n\n**Automated Actions:**\n• **Order confirmations** - Sent immediately after purchase\n• **Shipping updates** - Real-time tracking notifications\n• **Review requests** - Sent 3-5 days after delivery\n• **Follow-up recommendations** - Based on purchase history\n• **Warranty support** - Automated handling of common issues\n\n**Engagement Timeline:**\n1. **Immediate:** Order confirmation email\n2. **Day 1:** Shipping notification with tracking\n3. **Day 3-5:** Delivery confirmation\n4. **Day 7:** Review request with incentive\n5. **Day 14:** Personalized product recommendations\n6. **Ongoing:** Support for warranty & returns\n\n**Metrics I Track:**\n• Email open rates\n• Review submission rates\n• Repeat purchase likelihood\n• Customer satisfaction scores\n\nI can set up or modify any post-purchase flow! 🚀"
    );
  }

  // Analytics & Insights with Chart Generation
  if (intents.includes("analytics")) {
    // Check if user wants to create a chart
    const chartKeywords = /(chart|graph|visualize|show|display|create|make|generate|plot)/i;
    if (chartKeywords.test(message)) {
      // Extract chart request
      const chartRequest = message.replace(chartKeywords, "").replace(/(please|can you|will you)/gi, "").trim();
      if (chartRequest.length > 3) {
        // Switch to analytics panel
        const analyticsBtn = document.querySelector('.nav-item[data-panel="analytics"]');
        if (analyticsBtn) {
          setTimeout(() => analyticsBtn.click(), 100);
        }
        
        // Return immediate response, chart will be generated async
        setTimeout(async () => {
          const result = await generateChartFromPrompt(chartRequest);
          // Don't push to chat again if OpenAI is handling it
          if (!openaiClient) {
            pushChat("agent", result);
            conversationHistory.push({ role: "assistant", content: result });
          }
        }, 500);
        
        return `📊 **Generating Chart...**\n\nI'm creating a visualization based on: "${chartRequest}"\n\n**What I'm doing:**\n• Analyzing your data\n• Selecting the best chart type\n• Generating the visualization\n• Adding insights\n\nCheck the **Analytics** panel in a moment to see your chart! 📈`;
      }
    }
    
    const totalRevenue = orders.reduce((sum, o) => sum + o.value, 0);
    const avgOrderValue = totalRevenue / orders.length;
    const conversionRate = 3.2; // Example
    const topProduct = products.reduce((top, p) => p.reviews > (top?.reviews || 0) ? p : top, null);
    
    return (
      `📊 **Analytics & Insights Dashboard**\n\n**Key Metrics:**\n• Total Revenue: $${totalRevenue.toFixed(2)}\n• Average Order Value: $${avgOrderValue.toFixed(2)}\n• Conversion Rate: ${conversionRate}%\n• Total Orders: ${orders.length}\n• Active Products: ${products.length}\n\n**Top Performing Product:**\n• ${topProduct?.name} - ${topProduct?.rating}⭐ (${topProduct?.reviews} reviews)\n\n**Customer Behavior Patterns:**\n• Peak shopping hours: 2-4 PM, 8-10 PM\n• Most popular category: ${Object.keys(products.reduce((acc, p) => { acc[p.category] = (acc[p.category] || 0) + 1; return acc; }, {})).join(', ')}\n• Average session duration: 4.2 minutes\n• Bounce rate: 32%\n\n**Trending Products:**\n• SKU-ABS-01: +15% views this week\n• SKU-ABS-03: +8% sales growth\n\n**Predictions:**\n• Expected sales next week: $${(totalRevenue * 1.12).toFixed(2)}\n• Low stock alert: 2 products need restocking\n\n**💡 Create Charts with AI:**\nAsk me to create visualizations! Examples:\n• "Show profit by country"\n• "Create a chart of revenue over time"\n• "Visualize sales by product"\n• "Display order values by payment method"\n\nI'll generate interactive charts instantly! 📈`
    );
  }

  // Enhanced Support (Multi-language, FAQs)
  if (intents.includes("support") && (/(faq|frequently|common|question|language|multi)/.test(lower))) {
    return (
      "💬 **Enhanced Customer Support**\n\n**24/7 Support Features:**\n• **Multi-language support** - 15+ languages\n• **FAQ automation** - Instant answers to common questions\n• **Product information** - Detailed specs and availability\n• **Order status** - Real-time tracking\n• **Return processing** - Automated return/exchange handling\n• **Issue resolution** - Common complaints resolved automatically\n• **Escalation** - Complex issues routed to human agents\n\n**Common FAQs I Handle:**\n• Shipping times and costs\n• Size and fit guides\n• Return policy\n• Payment methods\n• Product specifications\n• Order modifications\n\n**Support Channels:**\n• Live chat (this interface)\n• Email automation\n• SMS notifications\n• Social media responses\n\n**Languages Supported:**\nEnglish, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Arabic, and more!\n\nAsk me any customer support question and I'll handle it! 🌍"
    );
  }

  // Enhanced Recommendations (Size/Fit, Comparisons)
  if (intents.includes("recommendations") && (/(size|fit|compare|comparison|vs|versus)/.test(lower))) {
    const sizeMatch = message.match(/(size|fit)\s+(\w+)/i);
    const compareMatch = message.match(/(compare|vs|versus)\s+([^and]+)\s+and\s+(.+)/i);
    
    if (compareMatch) {
      return (
        "🔄 **Product Comparison**\n\nI can compare any products side-by-side:\n\n**Comparison Features:**\n• Price comparison\n• Feature differences\n• Customer ratings\n• Stock availability\n• Best use cases\n• Value analysis\n\n**Example Comparison:**\n**SKU-ABS-01 vs SKU-ABS-02:**\n• Price: $129 vs $79\n• Rating: 4.5⭐ vs 4.3⭐\n• Stock: 45 vs 120 units\n• Best for: Running vs Everyday wear\n\nAsk me to compare specific products and I'll give you a detailed analysis! 📊"
      );
    }
    
    if (sizeMatch) {
      return (
        "📏 **Size & Fit Recommendations**\n\nI help customers find the perfect fit:\n\n**Size Guide Features:**\n• **Size recommendations** - Based on previous purchases\n• **Fit guides** - Detailed measurements\n• **Customer reviews** - Real fit feedback\n• **Exchange policy** - Easy size swaps\n\n**Available Sizes:**\n• Shoes: 6-11 (US)\n• Apparel: S, M, L, XL, XXL\n• Accessories: One Size\n\n**Smart Recommendations:**\nI analyze:\n• Customer's purchase history\n• Similar customer preferences\n• Product fit reviews\n• Return patterns\n\nAsk \"What size should I get for SKU-ABS-01?\" and I'll help! 👟"
      );
    }
  }

  // Enhanced Inventory (Multi-warehouse, Supplier)
  if (intents.includes("inventory") && (/(warehouse|supplier|reorder|multi.warehouse)/.test(lower))) {
    const warehouseInfo = warehouses.map(w => 
      `• **${w.name}** (${w.location}): ${Object.keys(w.stock).length} SKUs`
    ).join("\n");
    return (
      `🏭 **Multi-Warehouse & Supplier Management**\n\n**Warehouse Overview:**\n${warehouseInfo}\n\n**Inventory Management:**\n• **Real-time monitoring** - Track stock across all warehouses\n• **Automated reordering** - Set thresholds for auto-POs\n• **Supplier tracking** - Monitor delivery times and quality\n• **Low stock alerts** - Get notified before stockouts\n• **Overstock detection** - Identify slow-moving items\n\n**Supplier Performance:**\n• Average delivery time: 5-7 days\n• Quality rating: 4.6/5.0\n• On-time delivery: 94%\n\n**Automated Actions:**\n• Reorder when stock < 20 units\n• Alert when stock < 10 units\n• Suggest promotions for overstock\n• Optimize warehouse allocation\n\nI can manage inventory across all warehouses and track suppliers! 📦`
    );
  }

  // Enhanced Pricing (Competitor Monitoring, Dynamic Pricing)
  if (intents.includes("pricing/marketing") && (/(competitor|dynamic.price|monitor|optimize.price)/.test(lower))) {
    const competitorInfo = competitors.map(c => 
      `• ${c.name}: $${c.price} (Our price: $${c.ourPrice}) - ${c.ourPrice > c.price ? "Higher" : "Lower"}`
    ).join("\n");
    return (
      `💰 **Dynamic Pricing & Competitor Monitoring**\n\n**Competitor Analysis:**\n${competitorInfo}\n\n**Pricing Strategies:**\n• **Dynamic pricing** - Adjust based on demand\n• **Competitor monitoring** - Track prices daily\n• **Margin optimization** - Maintain target margins\n• **Seasonal adjustments** - Holiday and sale pricing\n• **Discount optimization** - Calculate optimal discount rates\n\n**Current Pricing Strategy:**\n• Base margin target: 50%\n• Competitor match threshold: ±5%\n• Dynamic adjustment: Daily\n• Seasonal multiplier: 1.1x (holiday season)\n\n**Automated Actions:**\n• Price alerts when competitors change\n• Auto-adjustments for high-demand items\n• Discount recommendations for slow movers\n• Margin protection for low-stock items\n\nI can optimize pricing for any product or category! 📈`
    );
  }

  // Enhanced Marketing (Email Campaigns, A/B Testing)
  if (intents.includes("pricing/marketing") && (/(email.campaign|a.b|test|social.media)/.test(lower))) {
    return (
      "📧 **Marketing Campaigns & A/B Testing**\n\n**Campaign Types:**\n• **Welcome series** - New customer onboarding\n• **Abandoned cart** - Recovery sequences\n• **Win-back** - Re-engage inactive customers\n• **VIP campaigns** - Exclusive offers\n• **Seasonal promotions** - Holiday campaigns\n• **Product launches** - New item announcements\n\n**A/B Testing:**\n• Subject line variations\n• Email content testing\n• Send time optimization\n• CTA button testing\n• Discount amount testing\n\n**Social Media Automation:**\n• Auto-respond to comments\n• Post product updates\n• Share customer reviews\n• Handle DMs and inquiries\n\n**Campaign Performance:**\n• Average open rate: 24%\n• Average click rate: 3.2%\n• Conversion rate: 1.8%\n• Best send time: Tuesday 10 AM\n\n**Current Active Campaigns:**\n• Welcome series: 245 active\n• Abandoned cart: 12 active\n• Win-back: 89 active\n\nI can create, test, and optimize any campaign! 🚀"
    );
  }

  // General fallback - Context-aware
  if (hasReference && conversationHistory.length > 2) {
    // Try to provide context-aware response
    const lastUserMsg = conversationHistory[conversationHistory.length - 2]?.content || "";
    const lastAgentMsg = conversationHistory[conversationHistory.length - 1]?.content || "";
    
    // Check if asking about something we discussed
    if (/(tell.more|explain|what.about|how.about|and|also|additionally)/.test(lower)) {
      return (
        "💡 **Following Up**\n\nI remember we were discussing this topic! Let me provide more details:\n\n" +
        (lastAgentMsg.length > 200 
          ? `**From our previous conversation:**\n${lastAgentMsg.substring(0, 200)}...\n\n` 
          : `**Context:** Based on what we discussed earlier...\n\n`) +
        "**What would you like to know more about?**\n• More details on the same topic\n• Related information\n• Next steps\n• Examples or use cases\n\nJust ask and I'll continue from where we left off! 🔄"
      );
    }
    
    // Check if asking to clarify or repeat
    if (/(repeat|again|remind|what.did|what.was|clarify)/.test(lower)) {
      return (
        "🔄 **Recap**\n\n**What we discussed:**\n" +
        recentContext
          .filter(m => m.role === "user")
          .slice(-2)
          .map((m, idx) => `${idx + 1}. ${m.content.substring(0, 100)}${m.content.length > 100 ? "..." : ""}`)
          .join("\n") +
        "\n\n**My responses covered:**\n" +
        recentContext
          .filter(m => m.role === "agent")
          .slice(-1)
          .map(m => m.content.substring(0, 150) + "...")
          .join("\n") +
        "\n\nWould you like me to:\n• Go deeper into any specific point?\n• Provide examples?\n• Show you how to use a feature?\n• Answer a related question?\n\nJust ask! 📝"
      );
    }
  }
  
  // Default fallback
  return (
    "👋 **Hi! I'm Nexus, your Complete E-commerce AI Assistant**\n\nI remember our conversation, so feel free to ask follow-up questions!\n\nI can handle **ALL** aspects of your e-commerce operations:\n\n**📦 Customer Interaction & Support:**\n• 24/7 customer inquiries\n• Multi-language support\n• FAQs automation\n• Order tracking\n• Returns & exchanges\n• Issue resolution\n\n**💰 Sales & Conversion:**\n• Personalized recommendations\n• Abandoned cart recovery\n• Upsell & cross-sell\n• Size/fit guidance\n• Product comparisons\n\n**📊 Inventory & Operations:**\n• Real-time stock monitoring\n• Demand forecasting\n• Multi-warehouse management\n• Supplier tracking\n• Automated reordering\n\n**💵 Pricing & Competition:**\n• Dynamic pricing\n• Competitor monitoring\n• Discount optimization\n• Margin management\n\n**📧 Marketing & Content:**\n• Email campaigns\n• Product descriptions\n• A/B testing\n• Social media automation\n• Customer segmentation\n\n**📈 Analytics & Insights:**\n• Sales reports\n• Behavior analysis\n• Trend identification\n• Conversion tracking\n• Sentiment analysis\n\n**🛡️ Fraud & Security:**\n• Transaction monitoring\n• Risk scoring\n• Account protection\n• Bot detection\n\n**🔍 Search & Discovery:**\n• Intelligent search\n• Visual search\n• Smart filtering\n• Auto-corrections\n\n**📬 Post-Purchase:**\n• Order confirmations\n• Shipping updates\n• Review requests\n• Follow-up campaigns\n\n**Just ask me anything in natural language!** I'll remember our conversation! 🚀"
  );
}

const chatForm = $("chat-form");
if (chatForm) {
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("chat-input");
    const value = input.value.trim();
    if (!value) return;
    
    // Add user message to history and display
    pushChat("user", value);
    conversationHistory.push({ role: "user", content: value });
    input.value = "";

    // Disable input while processing
    input.disabled = true;
    const submitBtn = chatForm.querySelector("button[type='submit']");
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Thinking...";

    const intents = detectIntents(value);
    intentList.innerHTML = "";
    intents.forEach((intent) => {
      const li = document.createElement("li");
      li.textContent = intent;
      intentList.appendChild(li);
    });

    // Check if this is a chart generation request (handle separately)
    const chartKeywords = /(chart|graph|visualize|show|display|create|make|generate|plot)/i;
    if (intents.includes("analytics") && chartKeywords.test(value)) {
      const chartRequest = value.replace(chartKeywords, "").replace(/(please|can you|will you)/gi, "").trim();
      if (chartRequest.length > 3) {
        // Switch to analytics panel
        const analyticsBtn = document.querySelector('.nav-item[data-panel="analytics"]');
        if (analyticsBtn) analyticsBtn.click();
        
        // Generate chart
        const chartResult = await generateChartFromPrompt(chartRequest);
        pushChat("agent", chartResult);
        conversationHistory.push({ role: "assistant", content: chartResult });
        
        input.disabled = false;
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        input.focus();
        return;
      }
    }

    // Try OpenAI first, fallback to pattern matching
    let reply = null;
    if (openaiClient) {
      reply = await callOpenAI(value);
    }
    
    // If OpenAI didn't work or not configured, use pattern matching
    if (!reply) {
      reply = handleChat(value);
    }
    
    // Add agent response to history and display
    pushChat("agent", reply);
    conversationHistory.push({ role: "assistant", content: reply });
    
    // Re-enable input
    input.disabled = false;
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    input.focus();
    
    // Keep history manageable (last 50 messages)
    if (conversationHistory.length > 50) {
      conversationHistory = conversationHistory.slice(-50);
    }
  });
}

// Prompt buttons
document.querySelectorAll(".hint-pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    const text = btn.textContent || "";
    $("chat-input").value = text;
    $("chat-form").dispatchEvent(new Event("submit"));
  });
});

// Fraud form
const fraudForm = $("fraud-form");
if (fraudForm) {
  fraudForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = $("fraud-order-id").value.trim();
    const notes = $("fraud-notes").value.trim();

    if (!id) return;
    
    // Loading state
    const submitBtn = fraudForm.querySelector("button[type='submit']");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Analyzing...";
    submitBtn.disabled = true;
    
    setTimeout(() => {
      let score = 0.2;
      let level = "Low";
      const reasons = [];

      if (/paypal/i.test(notes)) {
        score += 0.25;
        reasons.push("Paid with PayPal");
      }
      if (/different|mismatch|country/i.test(notes)) {
        score += 0.3;
        reasons.push("Billing / shipping mismatch");
      }
      if (/high value|high-value|expensive|420|500|1000/i.test(notes)) {
        score += 0.3;
        reasons.push("High order value");
      }

      if (score > 0.7) level = "High";
      else if (score > 0.45) level = "Medium";

      updateGauge(score);

      const out = [
        `Order: ${id}`,
        `Risk level: ${level} (${(score * 100).toFixed(0)}%)`,
        `Signals: ${reasons.length ? reasons.join(", ") : "None detected"}`,
        "",
        level === "High"
          ? "Hold shipment and perform manual verification before fulfilling."
          : level === "Medium"
          ? "Allow but monitor for disputes and repeat patterns."
          : "Auto‑approve under current rules.",
      ].join("\n");
      
      const output = $("fraud-output");
      output.style.opacity = "0";
      output.style.transform = "translateY(5px)";
      output.textContent = out;
      
      requestAnimationFrame(() => {
        output.style.transition = "opacity 0.4s ease-out, transform 0.4s ease-out";
        output.style.opacity = "1";
        output.style.transform = "translateY(0)";
      });
      
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }, 800);
  });
}

function updateGauge(score) {
  const needle = $("fraud-needle");
  const gaugeArc = document.querySelector(".gauge-arc");
  if (!needle) return;
  
  // Add working state to skill card
  const skillCard = document.getElementById("skill-fraud");
  if (skillCard) {
    skillCard.classList.add("working");
    setTimeout(() => skillCard.classList.remove("working"), 1500);
  }
  
  // Log to task log
  logTask(`Scanned order → Risk score: ${(score * 100).toFixed(0)}% → ${score > 0.7 ? "Flagged for review" : "Auto-approved"}`);
  
  const s = Math.min(Math.max(score, 0), 1);
  const angle = -70 + s * 140; // -70 to +70 degrees
  
  // Smooth animation
  needle.style.transition = "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
  needle.style.transform = `rotate(${angle}deg)`;
  
  // Pulse effect on gauge
  if (gaugeArc) {
    gaugeArc.style.animation = "none";
    requestAnimationFrame(() => {
      gaugeArc.style.animation = "gaugePulse 0.5s ease-out";
    });
  }
}

// Add gauge pulse animation to CSS via style tag if needed
if (!document.getElementById("dynamic-styles")) {
  const style = document.createElement("style");
  style.id = "dynamic-styles";
  style.textContent = `
    @keyframes gaugePulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `;
  document.head.appendChild(style);
}

// Inventory
const invForm = $("inventory-form");
if (invForm) {
  invForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const sku = $("inv-sku").value.trim();
    const weeks = parseInt($("inv-weeks").value || "8", 10);
    if (!sku || !weeks || weeks <= 0) return;

    // Loading state
    const submitBtn = invForm.querySelector("button[type='submit']");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Forecasting...";
    submitBtn.disabled = true;

    setTimeout(() => {
      const base = 20;
      const trend = sku.toLowerCase().includes("abs") ? 3 : 1;
      const forecast = [];
      for (let i = 0; i < weeks; i++) {
        forecast.push(base + trend * i + (i % 3));
      }
      drawSparkline(forecast);

      const onHand = 160;
      const weeklyAvg = forecast.reduce((s, v) => s + v, 0) / forecast.length;
      const coverWeeks = onHand / weeklyAvg;
      const level =
        coverWeeks < 2 ? "Critical" : coverWeeks < 4 ? "At risk" : "Comfortable";

      const out = [
        `${sku}`,
        `On hand (example): ${onHand} units`,
        `Avg weekly demand: ${weeklyAvg.toFixed(1)} units`,
        `Cover: ${coverWeeks.toFixed(1)} weeks`,
        `Risk: ${level}`,
        "",
        level === "Critical"
          ? "Recommend immediate replenishment and limiting aggressive promos."
          : level === "At risk"
          ? "Plan a PO this week and avoid deep discounting until stock lands."
          : "No urgent action required; consider a light promo to improve turns.",
      ].join("\n");
      
      const output = $("inventory-output");
      output.style.opacity = "0";
      output.style.transform = "translateY(5px)";
      output.textContent = out;
      
      requestAnimationFrame(() => {
        output.style.transition = "opacity 0.4s ease-out, transform 0.4s ease-out";
        output.style.opacity = "1";
        output.style.transform = "translateY(0)";
      });
      
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }, 1000);
  });
}

function drawSparkline(values) {
  const svg = $("inv-sparkline");
  if (!svg) return;
  const poly = svg.querySelector("polyline");
  if (!poly) return;
  
  // Add working state to skill card
  const skillCard = document.getElementById("skill-inventory");
  if (skillCard) {
    skillCard.classList.add("working");
    setTimeout(() => skillCard.classList.remove("working"), 1500);
  }
  
  // Log to task log
  logTask(`Forecasted demand for ${values.length} weeks → Total: ${values.reduce((s, v) => s + v, 0)} units`);
  
  const max = Math.max(...values, 1);
  const pts = values
    .map((v, idx) => {
      const x = (idx / Math.max(values.length - 1, 1)) * 100;
      const y = 30 - (v / max) * 26;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  
  // Animate sparkline drawing
  poly.setAttribute("points", "");
  poly.style.strokeDasharray = "200";
  poly.style.strokeDashoffset = "200";
  poly.style.transition = "stroke-dashoffset 1s ease-out";
  poly.setAttribute("points", pts);
  
  requestAnimationFrame(() => {
    poly.style.strokeDashoffset = "0";
  });
  
  setTimeout(() => {
    poly.style.strokeDasharray = "none";
  }, 1000);
  
  $("inv-caption").textContent = `Projected ${values.reduce(
    (s, v) => s + v,
    0
  )} units over ${values.length} weeks.`;
}

// Content
const contentForm = $("content-form");
if (contentForm) {
  contentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    generateCopy();
  });
}

function generateCopy() {
  const name = $("content-name").value.trim();
  const features = $("content-features").value.trim() || "Comfortable and reliable for everyday wear.";
  const tone = $("content-tone").value;
  if (!name) return;

  // Add working state to skill card
  const skillCard = document.getElementById("skill-content");
  if (skillCard) {
    skillCard.classList.add("working");
    setTimeout(() => skillCard.classList.remove("working"), 1200);
  }
  
  // Log to task log
  logTask(`Generating ${tone} copy for "${name}" → SEO-optimized description ready`);

  let opener;
  if (tone === "premium") {
    opener = `Meet ${name}, crafted for shoppers who notice every detail.`;
  } else if (tone === "playful") {
    opener = `${name} is built for days that don't slow down – just like you.`;
  } else {
    opener = `${name} balances everyday comfort with dependable performance.`;
  }

  const body =
    opener +
    "\n\nKey features:\n- " +
    features.replace(/\n+/g, "\n- ") +
    "\n\nWhy shoppers love it:\n" +
    (tone === "premium"
      ? "It feels elevated without being loud, pairing easily with the rest of your wardrobe."
      : tone === "playful"
      ? "It's the pair you reach for when you want energy, colour, and comfort at the same time."
      : "It delivers the essentials without overcomplicating things, making it a safe add‑to‑cart.");

  // Animate content appearance
  const output = $("content-output");
  output.style.opacity = "0";
  output.style.transform = "translateY(5px)";
  output.textContent = body;
  
  requestAnimationFrame(() => {
    output.style.transition = "opacity 0.4s ease-out, transform 0.4s ease-out";
    output.style.opacity = "1";
    output.style.transform = "translateY(0)";
  });
}

// Task log function
function logTask(message) {
  const logOutput = $("task-log-output");
  if (!logOutput) return;
  
  const timestamp = new Date().toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit",
    second: "2-digit"
  });
  
  const logEntry = `[${timestamp}] ${message}`;
  const currentText = logOutput.textContent.trim();
  
  if (currentText === "No tasks yet. Run a fraud check, inventory forecast, or copy generation to see Nexus log its work.") {
    logOutput.textContent = logEntry;
  } else {
    logOutput.textContent = currentText + "\n" + logEntry;
  }
  
  // Scroll to bottom
  logOutput.scrollTop = logOutput.scrollHeight;
  
  // Fade in animation
  logOutput.style.opacity = "0";
  requestAnimationFrame(() => {
    logOutput.style.transition = "opacity 0.3s ease-out";
    logOutput.style.opacity = "1";
  });
}

// Live tone switching
const toneSelect = $("content-tone");
if (toneSelect) {
  toneSelect.addEventListener("change", () => {
    if ($("content-output").textContent.trim() === "No description generated yet.") {
      return;
    }
    generateCopy();
  });
}

// ---------- AI-Powered Dashboard & Chart Generation ----------

// Chart storage
let dashboardCharts = [];
let chartIdCounter = 0;

// Generate chart from natural language prompt
async function generateChartFromPrompt(prompt) {
  // Try fallback first if OpenAI not available
  if (!openaiClient) {
    const fallbackResult = generateSimpleChart(prompt);
    if (fallbackResult && typeof fallbackResult === 'string') {
      return fallbackResult;
    }
    return "⚠️ OpenAI API key required for AI-powered chart generation. Please set your API key first.\n\n**Available without API:**\n• Profit by country\n• Revenue over time\n• Sales by product\n• Order values by payment method";
  }

  try {
    // Analyze the prompt to determine chart type and data
    const chartPrompt = `You are a data visualization expert. Analyze this request: "${prompt}"

Available data:
- Products: ${products.map(p => `${p.name} (${p.category}) - $${p.price}, Stock: ${p.stock}, Rating: ${p.rating}`).join('; ')}
- Orders: ${orders.map(o => `${o.id} - ${o.sku} - $${o.value} - ${o.country} - ${o.status}`).join('; ')}
- Segments: ${segments.map(s => `${s.name} - ${s.count} customers, Avg: $${s.avgOrderValue}`).join('; ')}
- Abandoned Carts: ${abandonedCarts.map(c => `Cart ${c.id} - $${c.value} - ${c.abandonedHours}h ago`).join('; ')}

Respond with ONLY a JSON object in this exact format:
{
  "chartType": "bar|line|pie|doughnut|radar",
  "title": "Chart title",
  "xAxis": "label for x-axis",
  "yAxis": "label for y-axis",
  "data": {
    "labels": ["label1", "label2", ...],
    "values": [value1, value2, ...]
  },
  "description": "Brief insight about this chart"
}

Be specific and use actual data from the available dataset.`;

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a data visualization expert. Always respond with valid JSON only." },
        { role: "user", content: chartPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const jsonText = response.choices[0].message.content.trim();
    // Extract JSON from markdown code blocks if present
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    const chartConfig = JSON.parse(jsonMatch ? jsonMatch[0] : jsonText);

    // Create the chart
    createChart(chartConfig);
    logTask(`AI generated ${chartConfig.chartType} chart: "${chartConfig.title}" from prompt: "${prompt}"`);

    return `✅ **Chart Generated!**\n\nI've created a ${chartConfig.chartType} chart: **"${chartConfig.title}"**\n\n**Insight:** ${chartConfig.description}\n\nView it in the **Analytics** panel! 📊`;
  } catch (error) {
    console.error('Chart generation error:', error);
    // Fallback to simple chart generation
    const fallbackResult = generateSimpleChart(prompt);
    if (fallbackResult && typeof fallbackResult === 'string') {
      return fallbackResult;
    }
    return `⚠️ **Chart Generation Error**\n\nI encountered an error generating the chart. Please try:\n• "Show profit by country"\n• "Revenue over time"\n• "Sales by product"\n\nOr set your OpenAI API key for more advanced chart generation.`;
  }
}

// Fallback simple chart generation
function generateSimpleChart(prompt) {
  const lower = prompt.toLowerCase();
  let chartConfig = null;

  // Profit by country
  if (lower.includes('profit') && lower.includes('country')) {
    const countryData = orders.reduce((acc, o) => {
      acc[o.country] = (acc[o.country] || 0) + o.value * 0.5; // Assume 50% margin
      return acc;
    }, {});
    chartConfig = {
      chartType: 'bar',
      title: 'Profit by Country',
      xAxis: 'Country',
      yAxis: 'Profit ($)',
      data: {
        labels: Object.keys(countryData),
        values: Object.values(countryData)
      },
      description: 'Profit distribution across different countries'
    };
  }
  // Revenue over time
  else if (lower.includes('revenue') && (lower.includes('time') || lower.includes('month'))) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const revenue = months.map(() => Math.random() * 5000 + 2000);
    chartConfig = {
      chartType: 'line',
      title: 'Revenue Over Time',
      xAxis: 'Month',
      yAxis: 'Revenue ($)',
      data: {
        labels: months,
        values: revenue
      },
      description: 'Revenue trends over the past 6 months'
    };
  }
  // Sales by product
  else if (lower.includes('sales') && lower.includes('product')) {
    chartConfig = {
      chartType: 'bar',
      title: 'Sales by Product',
      xAxis: 'Product',
      yAxis: 'Sales ($)',
      data: {
        labels: products.map(p => p.name),
        values: products.map(p => p.price * (p.stock > 0 ? 10 : 0))
      },
      description: 'Sales performance across all products'
    };
  }
  // Order values by payment method
  else if (lower.includes('order') && lower.includes('payment')) {
    const paymentData = orders.reduce((acc, o) => {
      acc[o.payment] = (acc[o.payment] || 0) + o.value;
      return acc;
    }, {});
    chartConfig = {
      chartType: 'pie',
      title: 'Order Values by Payment Method',
      xAxis: 'Payment Method',
      yAxis: 'Total Value ($)',
      data: {
        labels: Object.keys(paymentData),
        values: Object.values(paymentData)
      },
      description: 'Distribution of order values across payment methods'
    };
  }

  if (chartConfig) {
    createChart(chartConfig);
    logTask(`Generated ${chartConfig.chartType} chart: "${chartConfig.title}"`);
    return `✅ **Chart Created!**\n\nI've generated a ${chartConfig.chartType} chart: **"${chartConfig.title}"**\n\n**Insight:** ${chartConfig.description}\n\nCheck the **Analytics** panel to see it! 📊`;
  }

  return "📊 **Chart Generation**\n\nI can create charts for:\n• **Profit by country** - Bar chart showing profit distribution\n• **Revenue over time** - Line chart with trends\n• **Sales by product** - Bar chart comparing products\n• **Order values by payment method** - Pie chart showing distribution\n\n**Try these commands:**\n• \"Show profit by country\"\n• \"Revenue over time\"\n• \"Sales by product\"\n• \"Order values by payment method\"\n\nWith OpenAI API key, I can create custom charts for any data combination! 📈";
}

// Create and render a chart
function createChart(config) {
  // Check if Chart.js is available
  if (typeof Chart === 'undefined') {
    console.error('Chart.js is not loaded. Please ensure the Chart.js library is included.');
    return;
  }

  const chartId = `chart-${chartIdCounter++}`;
  const dashboardGrid = $("dashboard-grid");
  if (!dashboardGrid) return;

  // Remove placeholder if it exists
  const placeholder = dashboardGrid.querySelector('.dashboard-placeholder');
  if (placeholder) placeholder.remove();

  // Create chart card
  const chartCard = document.createElement('div');
  chartCard.className = 'dashboard-chart-card';
  chartCard.id = `card-${chartId}`;

  chartCard.innerHTML = `
    <div class="dashboard-chart-header">
      <div class="dashboard-chart-title">${config.title}</div>
      <div class="dashboard-chart-actions">
        <button onclick="removeChart('${chartId}')" title="Remove">×</button>
      </div>
    </div>
    <div class="dashboard-chart-container">
      <canvas id="${chartId}"></canvas>
    </div>
    <p style="font-size: 10px; color: var(--text-soft); margin-top: 8px; text-align: center;">
      ${config.description}
    </p>
  `;

  dashboardGrid.appendChild(chartCard);

  // Create Chart.js chart
  const ctx = document.getElementById(chartId);
  if (!ctx) return;

  const chartType = config.chartType === 'doughnut' ? 'doughnut' : 
                   config.chartType === 'radar' ? 'radar' :
                   config.chartType === 'pie' ? 'pie' :
                   config.chartType === 'line' ? 'line' : 'bar';

  const chart = new Chart(ctx, {
    type: chartType,
    data: {
      labels: config.data.labels,
      datasets: [{
        label: config.yAxis,
        data: config.data.values,
        backgroundColor: chartType === 'line' || chartType === 'bar' 
          ? 'rgba(215, 164, 154, 0.6)'
          : [
              'rgba(215, 164, 154, 0.8)',
              'rgba(192, 201, 168, 0.8)',
              'rgba(164, 177, 186, 0.8)',
              'rgba(228, 201, 182, 0.8)',
              'rgba(225, 218, 211, 0.8)',
            ],
        borderColor: chartType === 'line' || chartType === 'bar'
          ? 'rgba(215, 164, 154, 1)'
          : 'rgba(255, 255, 255, 0.8)',
        borderWidth: 2,
        tension: chartType === 'line' ? 0.4 : 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartType !== 'line' && chartType !== 'bar',
          position: 'bottom'
        },
        tooltip: {
          enabled: true
        }
      },
      scales: chartType === 'line' || chartType === 'bar' ? {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value.toFixed(0);
            }
          }
        }
      } : {}
    }
  });

  dashboardCharts.push({ id: chartId, chart: chart, config: config });
  
  // Animate appearance
  chartCard.style.opacity = '0';
  chartCard.style.transform = 'translateY(10px)';
  requestAnimationFrame(() => {
    chartCard.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    chartCard.style.opacity = '1';
    chartCard.style.transform = 'translateY(0)';
  });
}

// Remove chart
window.removeChart = function(chartId) {
  const chartIndex = dashboardCharts.findIndex(c => c.id === chartId);
  if (chartIndex !== -1) {
    dashboardCharts[chartIndex].chart.destroy();
    dashboardCharts.splice(chartIndex, 1);
  }
  const card = document.getElementById(`card-${chartId}`);
  if (card) {
    card.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    card.style.opacity = '0';
    card.style.transform = 'translateY(-10px)';
    setTimeout(() => card.remove(), 300);
  }

  // Show placeholder if no charts left
  const dashboardGrid = $("dashboard-grid");
  if (dashboardGrid && dashboardGrid.children.length === 0) {
    dashboardGrid.innerHTML = `
      <div class="dashboard-placeholder">
        <p>📊 **AI-Powered Dashboard**</p>
        <p style="font-size: 11px; color: var(--text-soft); margin-top: 8px;">
          Ask me to create charts using natural language! Examples:
        </p>
        <ul style="font-size: 11px; color: var(--text-soft); margin-top: 8px; text-align: left;">
          <li>"Show profit by country"</li>
          <li>"Revenue over time"</li>
          <li>"Sales by product category"</li>
          <li>"Compare order values by payment method"</li>
        </ul>
      </div>
    `;
  }
};

// Chart generation button
const generateChartBtn = $("generate-chart-btn");
const chartPromptInput = $("chart-prompt");
if (generateChartBtn && chartPromptInput) {
  generateChartBtn.addEventListener("click", async () => {
    const prompt = chartPromptInput.value.trim();
    if (!prompt) return;

    generateChartBtn.disabled = true;
    generateChartBtn.textContent = "Generating...";
    
    // Switch to analytics panel
    const analyticsBtn = document.querySelector('.nav-item[data-panel="analytics"]');
    if (analyticsBtn) analyticsBtn.click();

    const result = await generateChartFromPrompt(prompt);
    chartPromptInput.value = "";
    
    // Show result in chat
    pushChat("user", `Create a chart: ${prompt}`);
    pushChat("agent", result);
    conversationHistory.push({ role: "user", content: `Create a chart: ${prompt}` });
    conversationHistory.push({ role: "assistant", content: result });

    generateChartBtn.disabled = false;
    generateChartBtn.textContent = "Generate Chart with AI";
  });

  // Allow Enter key
  chartPromptInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      generateChartBtn.click();
    }
  });
}

// ---------- Enhanced Task Functions ----------

// Abandoned Cart Recovery Action
function recoverAbandonedCart(cartId) {
  const cart = abandonedCarts.find(c => c.id === cartId);
  if (!cart) return null;
  
  const discount = cart.value > 100 ? 10 : 5;
  logTask(`Abandoned cart recovery: ${cartId} → Sending ${discount}% discount code → Value: $${cart.value}`);
  
  return {
    action: "email_sent",
    cartId: cartId,
    discount: discount,
    message: `Sent recovery email with ${discount}% discount code to recover $${cart.value} cart.`
  };
}

// Competitor Price Monitoring
function checkCompetitorPrices(sku) {
  const product = products.find(p => p.sku === sku);
  const competitor = competitors.find(c => c.product === sku);
  
  if (!product || !competitor) return null;
  
  const priceDiff = product.price - competitor.price;
  const recommendation = priceDiff > 10 
    ? `Consider reducing price by $${(priceDiff * 0.3).toFixed(0)} to stay competitive`
    : priceDiff < -5
    ? `You're priced lower - good position!`
    : `Price is competitive`;
  
  logTask(`Competitor check: ${sku} → Our: $${product.price} vs Competitor: $${competitor.price} → ${recommendation}`);
  
  return {
    ourPrice: product.price,
    competitorPrice: competitor.price,
    difference: priceDiff,
    recommendation: recommendation
  };
}

// Multi-Warehouse Stock Check
function checkWarehouseStock(sku) {
  const stockInfo = warehouses.map(w => ({
    warehouse: w.name,
    location: w.location,
    stock: w.stock[sku] || 0
  }));
  
  const totalStock = stockInfo.reduce((sum, w) => sum + w.stock, 0);
  logTask(`Multi-warehouse check: ${sku} → Total: ${totalStock} units across ${warehouses.length} warehouses`);
  
  return {
    sku: sku,
    totalStock: totalStock,
    warehouses: stockInfo
  };
}

// Customer Behavior Analysis
function analyzeCustomerBehavior() {
  const behaviorPatterns = {
    peakHours: ["2-4 PM", "8-10 PM"],
    popularCategories: products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {}),
    avgSessionDuration: 4.2,
    bounceRate: 32,
    conversionRate: 3.2
  };
  
  logTask(`Customer behavior analysis → Peak: ${behaviorPatterns.peakHours.join(", ")} → Conversion: ${behaviorPatterns.conversionRate}%`);
  
  return behaviorPatterns;
}

// Enhanced Support Ticket Handler
function handleSupportTicket(message) {
  const lower = message.toLowerCase();
  let intent = "general";
  let priority = "normal";
  let suggestedResponse = "";
  
  if (/(refund|return|money.back)/.test(lower)) {
    intent = "refund";
    priority = "high";
    suggestedResponse = "I understand you'd like a refund. Let me process that for you. Can you provide your order number?";
  } else if (/(size|fit|doesn't.fit|too.small|too.big)/.test(lower)) {
    intent = "sizing";
    priority = "normal";
    suggestedResponse = "I can help with sizing! What product are you asking about? I'll provide our size guide and exchange options.";
  } else if (/(shipping|delivery|when.will|tracking)/.test(lower)) {
    intent = "shipping";
    priority = "normal";
    suggestedResponse = "I can track your order! Please provide your order number and I'll give you the latest shipping status.";
  } else if (/(legal|safety|defective|dangerous)/.test(lower)) {
    intent = "escalation";
    priority = "urgent";
    suggestedResponse = "This requires immediate attention. I'm escalating to our support team right away.";
  }
  
  logTask(`Support ticket: ${intent} (${priority}) → Auto-tagged and response drafted`);
  
  return {
    intent: intent,
    priority: priority,
    suggestedResponse: suggestedResponse,
    needsHumanReview: priority === "urgent" || intent === "escalation"
  };
}

// Product Comparison Function
function compareProducts(sku1, sku2) {
  const p1 = products.find(p => p.sku === sku1);
  const p2 = products.find(p => p.sku === sku2);
  
  if (!p1 || !p2) return null;
  
  const comparison = {
    products: [p1, p2],
    priceDifference: Math.abs(p1.price - p2.price),
    ratingDifference: Math.abs(p1.rating - p2.rating),
    stockDifference: Math.abs(p1.stock - p2.stock),
    recommendation: p1.rating > p2.rating && p1.price <= p2.price * 1.2 
      ? `${p1.name} offers better value`
      : `${p2.name} offers better value`
  };
  
  logTask(`Product comparison: ${sku1} vs ${sku2} → ${comparison.recommendation}`);
  
  return comparison;
}

// Enhanced Order Status with Shipping Updates
function getOrderStatusWithUpdates(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return null;
  
  const updates = [];
  if (order.status === "In transit") {
    updates.push("Package picked up by carrier");
    updates.push("In transit to destination");
    updates.push(`Estimated delivery: ${order.etaDays} days`);
  } else if (order.status === "Shipped") {
    updates.push("Order shipped");
    updates.push("Tracking number sent");
    updates.push(`Expected delivery: ${order.etaDays} days`);
  } else if (order.status === "Delivered") {
    updates.push("Order delivered successfully");
    updates.push("Delivery confirmation sent");
    updates.push("Review request sent");
  }
  
  return {
    order: order,
    updates: updates,
    nextAction: order.status === "Delivered" 
      ? "Send review request"
      : order.status === "In transit"
      ? "Send delivery reminder"
      : "Send shipping confirmation"
  };
}


