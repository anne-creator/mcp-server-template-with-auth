# Project Requirements Document (PRD)
## Bigmax Mood & Productivity Tracker - MCP Server Integration

### Project Overview
**Objective**: Create a Model Context Protocol (MCP) server that enables seamless integration between Claude web app and the Bigmax Mood & Productivity Tracker application.

**Current State**: Standalone Bigmax app with InsForge backend, separate from Claude ecosystem
**Target State**: Seamless integration where users can record Claude conversations directly into their Bigmax mood tracker

---

## 🎯 Project Goals

### Primary Goal
Enable users to seamlessly record their Claude web app conversations into their Bigmax mood tracker with **one-click authentication** and **automatic mood analysis**.

### User Experience Vision
```
User in Claude: "I'm feeling stressed about this project deadline"
User: "Record this conversation in my mood tracker"
Claude: "I'll analyze this conversation and record it in your Bigmax mood tracker"
[One-click authentication flow]
Claude: "✅ Recorded! Your mood: 'stressed', Productivity: 3/10, Insight: 'You're feeling overwhelmed by deadlines'"
```

---

## 🏗️ System Architecture

### High-Level Architecture
```
Claude Web App → MCP Server → Bigmax App → InsForge Database
     ↓              ↓            ↓            ↓
  User Chat → Analysis → Auth Flow → Mood Entry
```

### Component Overview

#### **1. MCP Server (Cloudflare Workers)**
- **Purpose**: Bridge between Claude and Bigmax
- **Authentication**: OAuth-style redirect flow to Bigmax app
- **Analysis**: AI-powered conversation mood analysis
- **Storage**: API calls to Bigmax endpoints

#### **2. Bigmax App Integration**
- **New Endpoint**: `/mcp/callback` for OAuth-style authentication
- **API Enhancement**: Token-based authentication for MCP server
- **User Experience**: Seamless redirect flow

#### **3. Claude Web App**
- **MCP Integration**: Uses MCP server tools
- **User Interface**: Natural conversation flow
- **Authentication**: Transparent to user

---

## 🔧 Technical Implementation

### Phase 1: MCP Server Foundation (Day 1)

#### **1.1 MCP Server Setup**
```typescript
// src/tools/bigmax-mcp-tools.ts
export function registerBigmaxTools(server: McpServer, env: Env) {
  
  // Tool 1: Check authentication status
  server.tool("checkAuthentication", {
    description: "Check if user is authenticated with Bigmax mood tracker",
    input: {
      sessionToken: "string" // optional, from previous sessions
    }
  });
  
  // Tool 2: Get authentication URL
  server.tool("getAuthUrl", {
    description: "Get authentication URL for Bigmax login with redirect back to Claude",
    input: {
      returnUrl: "string" // Claude web app URL to return to
    }
  });
  
  // Tool 3: Analyze and store conversation
  server.tool("analyzeAndStoreConversation", {
    description: "Analyze conversation for mood patterns and store in Bigmax",
    input: {
      conversation: "string",
      sessionToken: "string"
    }
  });
  
  // Tool 4: Get user mood history
  server.tool("getUserMoodHistory", {
    description: "Retrieve user's mood history for context",
    input: {
      sessionToken: "string",
      dateRange: "string" // e.g., "last_30_days"
    }
  });
}
```

#### **1.2 Environment Configuration**
```typescript
// wrangler.jsonc
{
  "vars": {
    "BIGMAX_APP_URL": "https://your-bigmax-app.com",
    "BIGMAX_AUTH_ENDPOINT": "/api/auth/login",
    "BIGMAX_MOOD_ENDPOINT": "/api/mood-entries",
    "BIGMAX_MCP_CALLBACK": "/mcp/callback",
    "CLAUDE_RETURN_URL": "https://claude.ai/chat"
  }
}
```

### Phase 2: Authentication Flow (Day 2)

#### **2.1 OAuth-Style Redirect Flow**
```typescript
// MCP Server Authentication Flow
export async function handleAuthentication(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  if (action === 'getAuthUrl') {
    const returnUrl = url.searchParams.get('returnUrl');
    const authUrl = `${env.BIGMAX_APP_URL}/mcp/auth?return_to=${encodeURIComponent(returnUrl)}`;
    
    return new Response(JSON.stringify({
      authUrl,
      message: "Please authenticate with your Bigmax mood tracker"
    }));
  }
  
  if (action === 'callback') {
    const code = url.searchParams.get('code');
    const sessionToken = await exchangeCodeForToken(code);
    
    return new Response(JSON.stringify({
      success: true,
      sessionToken,
      message: "Authentication successful! You can now record conversations."
    }));
  }
}
```

#### **2.2 Bigmax App Integration**
```typescript
// In your Bigmax app - new endpoint
app.get('/mcp/auth', (req, res) => {
  const returnUrl = req.query.return_to;
  
  // Store return URL in session
  req.session.mcpReturnUrl = returnUrl;
  
  // Redirect to login page with return URL
  res.redirect(`/login?return_to=${encodeURIComponent(returnUrl)}`);
});

app.get('/mcp/callback', authenticateUser, (req, res) => {
  const returnUrl = req.session.mcpReturnUrl;
  const sessionToken = generateSessionToken(req.user.id);
  
  // Redirect back to Claude with token
  res.redirect(`${returnUrl}?token=${sessionToken}&success=true`);
});
```

### Phase 3: Conversation Analysis (Day 2-3)

#### **3.1 AI-Powered Mood Analysis**
```typescript
// MCP Server Analysis Engine
export async function analyzeConversation(conversation: string, sessionToken: string) {
  // Extract mood signals from conversation
  const moodSignals = await extractMoodSignals(conversation);
  
  // Generate AI insights
  const aiInsight = await generateInsight(conversation, moodSignals);
  
  // Create mood entry
  const moodEntry = {
    date: new Date().toISOString().split('T')[0],
    mood: moodSignals.primaryMood,
    productivity: moodSignals.productivityScore,
    notes: `Analyzed from Claude conversation: "${conversation.substring(0, 100)}..."`,
    ai_insight: aiInsight
  };
  
  // Store via Bigmax API
  await storeMoodEntry(moodEntry, sessionToken);
  
  return {
    success: true,
    moodEntry,
    analysis: moodSignals
  };
}
```

#### **3.2 Mood Signal Extraction**
```typescript
// Mood analysis patterns
const MOOD_PATTERNS = {
  'great': ['excited', 'amazing', 'fantastic', 'love', 'wonderful'],
  'good': ['happy', 'pleased', 'satisfied', 'content', 'positive'],
  'okay': ['fine', 'alright', 'decent', 'average', 'neutral'],
  'sad': ['sad', 'depressed', 'down', 'blue', 'melancholy'],
  'stressed': ['stressed', 'overwhelmed', 'anxious', 'worried', 'pressure']
};

const PRODUCTIVITY_INDICATORS = {
  high: ['productive', 'efficient', 'accomplished', 'focused', 'motivated'],
  medium: ['busy', 'working', 'progress', 'steady', 'moderate'],
  low: ['stuck', 'blocked', 'unfocused', 'distracted', 'slow']
};
```

### Phase 4: API Integration (Day 3)

#### **4.1 Bigmax API Client**
```typescript
// MCP Server API Client
export class BigmaxApiClient {
  constructor(private baseUrl: string) {}
  
  async validateToken(token: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/api/auth/validate`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  }
  
  async createMoodEntry(entry: MoodEntry, token: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/mood-entries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entry)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create mood entry');
    }
  }
  
  async getUserMoodHistory(token: string, dateRange: string): Promise<MoodEntry[]> {
    const response = await fetch(`${this.baseUrl}/api/mood-entries?range=${dateRange}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    return response.json();
  }
}
```

#### **4.2 Error Handling & Validation**
```typescript
// Comprehensive error handling
export function handleMCPError(error: any, context: string): MCPResponse {
  console.error(`MCP Error in ${context}:`, error);
  
  if (error.name === 'AuthenticationError') {
    return {
      content: [{
        type: "text",
        text: "❌ Authentication failed. Please login to your Bigmax mood tracker first."
      }]
    };
  }
  
  if (error.name === 'APIError') {
    return {
      content: [{
        type: "text", 
        text: "❌ Failed to connect to your mood tracker. Please try again later."
      }]
    };
  }
  
  return {
    content: [{
      type: "text",
      text: "❌ An unexpected error occurred. Please try again."
    }]
  };
}
```

---

## 🔐 Authentication Flow

### Detailed User Journey

#### **First Time User**
1. **User in Claude**: "Record this conversation in my mood tracker"
2. **Claude calls MCP**: `checkAuthentication()` → Returns `false`
3. **Claude calls MCP**: `getAuthUrl()` → Returns Bigmax login URL
4. **Claude shows user**: "Please login to your mood tracker: [LINK]"
5. **User clicks link** → Redirected to Bigmax app
6. **User logs in** → Bigmax redirects back to Claude with token
7. **Claude calls MCP**: `analyzeAndStoreConversation(conversation, token)`
8. **MCP analyzes & stores** → Returns success message
9. **Claude confirms**: "✅ Conversation recorded in your mood tracker!"

#### **Returning User (Optional Session Persistence)**
1. **User in Claude**: "Record this conversation"
2. **Claude calls MCP**: `checkAuthentication(token)` → Returns `true`
3. **Claude calls MCP**: `analyzeAndStoreConversation(conversation, token)`
4. **MCP analyzes & stores** → Returns success message
5. **Claude confirms**: "✅ Conversation recorded!"

---

## 📊 Success Metrics

### Technical Metrics
- [ ] **Authentication Flow**: < 3 seconds from request to redirect
- [ ] **Analysis Accuracy**: > 80% mood detection accuracy
- [ ] **API Response Time**: < 2 seconds for mood entry creation
- [ ] **Error Rate**: < 5% for successful authentication flows

### User Experience Metrics
- [ ] **One-Click Auth**: User can authenticate with single click
- [ ] **Seamless Integration**: No disruption to Claude conversation flow
- [ ] **Automatic Analysis**: Mood entries created without user input
- [ ] **Context Preservation**: User's Bigmax data remains accessible

### Business Metrics
- [ ] **User Adoption**: > 50% of Bigmax users try MCP integration
- [ ] **Data Quality**: > 90% of recorded conversations generate valid mood entries
- [ ] **User Retention**: Increased engagement with Bigmax app

---

## 🚨 Risk Assessment

### High Risk
- **Cross-Domain Authentication**: Complex redirect flow between Claude and Bigmax
- **Session Management**: Maintaining authentication state across domains
- **API Reliability**: Dependency on Bigmax app availability

### Medium Risk
- **Mood Analysis Accuracy**: AI-powered analysis may be inconsistent
- **User Experience**: Complex flow may confuse users
- **Security**: Token handling across domains

### Low Risk
- **MCP Server Implementation**: Standard MCP patterns
- **Bigmax API Integration**: Well-defined endpoints
- **Data Storage**: Using existing InsForge infrastructure

---

## 📅 Implementation Timeline

### **Day 1: MCP Server Foundation**
- [ ] Set up MCP server structure
- [ ] Create basic tool definitions
- [ ] Implement Bigmax API client
- [ ] Add environment configuration
- [ ] Test basic MCP server functionality

### **Day 2: Authentication Flow**
- [ ] Implement OAuth-style redirect flow
- [ ] Create authentication tools
- [ ] Add session token handling
- [ ] Test authentication flow end-to-end
- [ ] Handle authentication errors

### **Day 3: Analysis & Integration**
- [ ] Implement conversation analysis engine
- [ ] Create mood signal extraction
- [ ] Add AI insight generation
- [ ] Integrate with Bigmax API endpoints
- [ ] Test complete user flow

### **Day 4: Polish & Testing**
- [ ] Add comprehensive error handling
- [ ] Implement user feedback mechanisms
- [ ] Test edge cases and error scenarios
- [ ] Optimize performance
- [ ] Create user documentation

---

## 🔧 Technical Requirements

### **MCP Server Requirements**
- **Runtime**: Cloudflare Workers
- **Authentication**: OAuth-style redirect flow
- **API Integration**: HTTP client for Bigmax APIs
- **Analysis**: AI-powered conversation processing
- **Storage**: No direct database access (API-only)

### **Bigmax App Requirements**
- **New Endpoint**: `/mcp/callback` for authentication
- **API Enhancement**: Token-based authentication
- **User Experience**: Seamless redirect flow
- **Security**: Secure token generation and validation

### **Claude Integration Requirements**
- **MCP Client**: Standard MCP client configuration
- **User Interface**: Natural conversation flow
- **Error Handling**: Graceful error messages
- **Authentication**: Transparent to user

---

## 🎯 Success Criteria

### **MVP Success Criteria**
- [ ] User can authenticate with Bigmax in < 3 clicks
- [ ] Conversation analysis generates accurate mood entries
- [ ] Mood entries appear in Bigmax dashboard
- [ ] Error handling provides clear user feedback
- [ ] Complete flow works end-to-end

### **Advanced Success Criteria**
- [ ] Session persistence for returning users
- [ ] Historical mood data integration
- [ ] Advanced AI insights generation
- [ ] Bulk conversation analysis
- [ ] Mood pattern recognition

---

## 📝 Next Steps

### **Immediate Actions**
1. **Review and approve this PRD**
2. **Set up development environment**
3. **Begin Day 1 implementation**
4. **Create Bigmax app integration endpoints**
5. **Test MCP server locally**

### **Dependencies**
- **Bigmax app updates** for MCP callback endpoint
- **InsForge API access** for mood entry creation
- **Claude web app** MCP client configuration
- **Cloudflare Workers** deployment setup

---

*This PRD will be updated as we progress through each phase of the MCP server implementation.*
