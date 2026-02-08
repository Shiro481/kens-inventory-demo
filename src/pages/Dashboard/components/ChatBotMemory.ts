export interface ChatMemory {
  userName?: string;
  preferences: {
    theme?: 'dark' | 'light';
    language?: string;
    notifications?: boolean;
  };
  context: {
    currentView?: string;
    recentActions: string[];
    inventoryLevel?: 'low' | 'normal' | 'high';
    lastSale?: {
      amount: number;
      timestamp: Date;
    };
  };
  conversationHistory: {
    topics: string[];
    frequentQuestions: string[];
    lastInteraction: Date;
  };
}

class ChatBotMemory {
  private memory: ChatMemory;
  private readonly STORAGE_KEY = 'chatbot_memory';

  constructor() {
    this.memory = this.loadMemory();
  }

  private loadMemory(): ChatMemory {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load chatbot memory:', error);
    }
    
    return {
      preferences: {},
      context: {
        recentActions: []
      },
      conversationHistory: {
        topics: [],
        frequentQuestions: [],
        lastInteraction: new Date()
      }
    };
  }

  private saveMemory(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.memory));
    } catch (error) {
      console.warn('Failed to save chatbot memory:', error);
    }
  }

  // User Preferences
  setUserName(name: string): void {
    this.memory.userName = name;
    this.saveMemory();
  }

  getUserName(): string {
    return this.memory.userName || 'User';
  }

  setPreference<K extends keyof ChatMemory['preferences']>(
    key: K, 
    value: ChatMemory['preferences'][K]
  ): void {
    this.memory.preferences[key] = value;
    this.saveMemory();
  }

  getPreference<K extends keyof ChatMemory['preferences']>(
    key: K
  ): ChatMemory['preferences'][K] | undefined {
    return this.memory.preferences[key];
  }

  // Context Management
  setCurrentView(view: string): void {
    this.memory.context.currentView = view;
    this.memory.context.recentActions.unshift(`Navigated to ${view}`);
    if (this.memory.context.recentActions.length > 10) {
      this.memory.context.recentActions = this.memory.context.recentActions.slice(0, 10);
    }
    this.saveMemory();
  }

  addRecentAction(action: string): void {
    this.memory.context.recentActions.unshift(action);
    if (this.memory.context.recentActions.length > 10) {
      this.memory.context.recentActions = this.memory.context.recentActions.slice(0, 10);
    }
    this.saveMemory();
  }

  setInventoryLevel(level: 'low' | 'normal' | 'high'): void {
    this.memory.context.inventoryLevel = level;
    this.saveMemory();
  }

  setLastSale(amount: number): void {
    this.memory.context.lastSale = {
      amount,
      timestamp: new Date()
    };
    this.saveMemory();
  }

  getRecentActions(): string[] {
    return this.memory.context.recentActions;
  }

  getCurrentView(): string | undefined {
    return this.memory.context.currentView;
  }

  getInventoryLevel(): 'low' | 'normal' | 'high' | undefined {
    return this.memory.context.inventoryLevel;
  }

  getLastSale(): { amount: number; timestamp: Date } | undefined {
    return this.memory.context.lastSale;
  }

  // Conversation History
  addTopic(topic: string): void {
    if (!this.memory.conversationHistory.topics.includes(topic)) {
      this.memory.conversationHistory.topics.push(topic);
      if (this.memory.conversationHistory.topics.length > 20) {
        this.memory.conversationHistory.topics = this.memory.conversationHistory.topics.slice(-20);
      }
    }
    this.saveMemory();
  }

  addFrequentQuestion(question: string): void {
    const existing = this.memory.conversationHistory.frequentQuestions.find(q => 
      q.toLowerCase() === question.toLowerCase()
    );
    
    if (!existing) {
      this.memory.conversationHistory.frequentQuestions.push(question);
      if (this.memory.conversationHistory.frequentQuestions.length > 15) {
        this.memory.conversationHistory.frequentQuestions = this.memory.conversationHistory.frequentQuestions.slice(-15);
      }
    }
    this.saveMemory();
  }

  getFrequentQuestions(): string[] {
    return this.memory.conversationHistory.frequentQuestions;
  }

  getTopics(): string[] {
    return this.memory.conversationHistory.topics;
  }

  updateLastInteraction(): void {
    this.memory.conversationHistory.lastInteraction = new Date();
    this.saveMemory();
  }

  // Smart Suggestions
  getSmartSuggestions(): string[] {
    const suggestions: string[] = [];
    
    // Based on current view
    if (this.memory.context.currentView) {
      switch (this.memory.context.currentView) {
        case 'inventory':
          suggestions.push('Show low stock items', 'Add new inventory item', 'Export inventory report');
          break;
        case 'analytics':
          suggestions.push('Show sales trends', 'Generate monthly report', 'Compare performance');
          break;
        case 'pos':
          suggestions.push('Start new sale', 'View today\'s transactions', 'Payment help');
          break;
        case 'settings':
          suggestions.push('Change tax rate', 'Update store info', 'Configure notifications');
          break;
      }
    }

    // Based on inventory level
    if (this.memory.context.inventoryLevel === 'low') {
      suggestions.push('Reorder low stock items', 'Update inventory thresholds');
    }

    // Based on recent actions
    if (this.memory.context.recentActions.length > 0) {
      const lastAction = this.memory.context.recentActions[0];
      if (lastAction?.includes('sale')) {
        suggestions.push('View sales analytics', 'Check inventory updates');
      }
    }

    // Add frequent questions
    suggestions.push(...this.memory.conversationHistory.frequentQuestions.slice(0, 3));

    // Remove duplicates and limit
    return [...new Set(suggestions)].slice(0, 6);
  }

  // Clear Memory
  clearMemory(): void {
    this.memory = {
      preferences: {},
      context: {
        recentActions: []
      },
      conversationHistory: {
        topics: [],
        frequentQuestions: [],
        lastInteraction: new Date()
      }
    };
    this.saveMemory();
  }

  // Export/Import for debugging
  exportMemory(): string {
    return JSON.stringify(this.memory, null, 2);
  }

  getFullMemory(): ChatMemory {
    return { ...this.memory };
  }
}

export default ChatBotMemory;
