# Nexus - AI-Powered E-commerce Agent

Nexus is a comprehensive AI-powered e-commerce assistant that handles all aspects of your online store operations.

## 🚀 Quick Start

### 1. Set Up OpenAI API Key

**Option 1: Browser Console (Recommended)**
1. Open your browser's developer console (F12)
2. Run this command:
```javascript
localStorage.setItem('nexus_openai_key', 'your-openai-api-key-here')
```
3. Refresh the page

**Option 2: URL Parameter**
Add `?api_key=your-openai-api-key-here` to the URL when first loading the page.

**Option 3: Programmatic**
```javascript
setNexusAPIKey('your-openai-api-key-here')
```

### 2. Run the Application

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## ✨ Features

Nexus is powered by OpenAI GPT-4o-mini and can handle:

- **Customer Support**: 24/7 inquiries, FAQs, order tracking, returns
- **Sales Optimization**: Recommendations, abandoned cart recovery, upsell/cross-sell
- **Inventory Management**: Real-time monitoring, demand forecasting, multi-warehouse
- **Pricing & Competition**: Dynamic pricing, competitor monitoring
- **Marketing & Content**: Email campaigns, product descriptions, A/B testing
- **Analytics & Insights**: Sales reports, behavior analysis, trends
- **Fraud & Security**: Transaction monitoring, risk scoring
- **Search & Discovery**: Intelligent search, filtering
- **Post-Purchase**: Order confirmations, shipping updates, reviews

## 💬 Usage

Just ask Nexus anything in natural language! Examples:

- "Where is order ORD-2031?"
- "Forecast demand for SKU-ABS-01 for 12 weeks"
- "Write a premium product description for my running shoe"
- "Show me abandoned carts"
- "Analyze customer behavior patterns"
- "Compare SKU-ABS-01 and SKU-ABS-02"

Nexus remembers conversation context, so you can ask follow-up questions naturally!

## 🎨 Theme

The interface uses a neutral color palette:
- Ivory (#E1DAD3)
- Nude (#E4C9B6)
- Dusty Rose (#D7A49A)
- Sage (#C0C9A8)
- Baby Blue (#A4B1BA)

## 📝 Notes

- The OpenAI API key is stored locally in your browser (localStorage)
- Conversation history is maintained during your session
- All e-commerce capabilities are fully functional

