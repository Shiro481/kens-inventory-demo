import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, Minimize2, Maximize2, Navigation, Settings, BarChart3, ShoppingCart, Package } from 'lucide-react';
import styles from './ChatBot.module.css';
import ChatBotMemory from './ChatBotMemory';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  action?: {
    type: 'navigate' | 'execute' | 'configure';
    target?: string;
    completed?: boolean;
  };
}

interface ChatBotProps {
  isOpen?: boolean;
  onToggle?: () => void;
  onNavigate?: (view: string) => void;
  onExecuteAction?: (action: string, params?: any) => void;
  currentView?: string;
  inventoryStats?: {
    totalItems: number;
    lowStockItems: number;
  };
}

export default function ChatBot({ 
  isOpen = false, 
  onToggle, 
  onNavigate,
  onExecuteAction,
  currentView,
  inventoryStats 
}: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "🚧 **AI Assistant - Under Development**\n\nHello! I'm your AI assistant with enhanced capabilities. I can help you with:\n\n🎯 **Navigation Control**: Say \"navigate to [section]\" to go anywhere\n⚡ **Quick Actions**: \"add item\", \"export report\", \"refresh data\"\n📊 **Smart Insights**: Context-aware help based on current view\n🧠 **Memory**: I remember your preferences and actions\n\n*Note: This feature is currently under development and may have limited capabilities.*\n\nHow can I assist you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [memory] = useState(() => new ChatBotMemory());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize memory and update context
  useEffect(() => {
    if (currentView) {
      memory.setCurrentView(currentView);
    }
    if (inventoryStats) {
      const totalItems = inventoryStats.totalItems || 0;
      const lowStockItems = inventoryStats.lowStockItems || 0;
      
      let inventoryLevel: 'low' | 'normal' | 'high' = 'normal';
      if (lowStockItems > totalItems * 0.2) {
        inventoryLevel = 'low';
      } else if (lowStockItems === 0) {
        inventoryLevel = 'high';
      }
      
      memory.setInventoryLevel(inventoryLevel);
    }
  }, [currentView, inventoryStats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const executeNavigationCommand = async (command: string, target: string): Promise<string> => {
    try {
      if (onNavigate) {
        onNavigate(target);
        memory.addRecentAction(`Navigated to ${target} via voice command`);
        
        return `✅ Successfully navigated to ${target}. You can now access all ${target} features.`;
      } else {
        return `❌ Navigation not available. Please use the sidebar to navigate to ${target}.`;
      }
    } catch (error) {
      console.error('Navigation error:', error);
      return `❌ Failed to navigate to ${target}. Please try again.`;
    }
  };

  const executeActionCommand = async (command: string, action: string, params?: string): Promise<string> => {
    try {
      if (onExecuteAction) {
        await onExecuteAction(action, params);
        memory.addRecentAction(`Executed ${action} command`);
        
        return `✅ Successfully executed: ${action}${params ? ` with ${params}` : ''}`;
      } else {
        return `❌ Action execution not available. Please use the interface directly.`;
      }
    } catch (error) {
      console.error('Action execution error:', error);
      return `❌ Failed to execute ${action}. Please try again.`;
    }
  };

  const generateBotResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 800));
    
    const lowerMessage = userMessage.toLowerCase();
    const userName = memory.getUserName();
    
    // Update conversation history
    memory.addFrequentQuestion(userMessage);
    memory.updateLastInteraction();

    // Navigation Commands
    if (lowerMessage.includes('navigate') || lowerMessage.includes('go to') || lowerMessage.includes('open')) {
      const targets = {
        'inventory': 'inventory',
        'analytics': 'analytics', 
        'pos': 'pos',
        'sales': 'sales',
        'suppliers': 'suppliers',
        'settings': 'settings',
        'overview': 'overview'
      };
      
      for (const [key, value] of Object.entries(targets)) {
        if (lowerMessage.includes(key)) {
          return await executeNavigationCommand(userMessage, value);
        }
      }
    }

    // Action Commands
    if (lowerMessage.includes('add') && lowerMessage.includes('item')) {
      return await executeActionCommand(userMessage, 'addItem');
    }
    
    if (lowerMessage.includes('export') || lowerMessage.includes('report')) {
      if (lowerMessage.includes('sales')) {
        return await executeActionCommand(userMessage, 'exportSalesReport');
      } else if (lowerMessage.includes('inventory')) {
        return await executeActionCommand(userMessage, 'exportInventoryReport');
      }
    }

    if (lowerMessage.includes('refresh') || lowerMessage.includes('reload')) {
      return await executeActionCommand(userMessage, 'refresh');
    }

    if (lowerMessage.includes('search') && lowerMessage.includes('low stock')) {
      return await executeActionCommand(userMessage, 'searchLowStock');
    }

    // Enhanced contextual responses
    if (lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
      const level = memory.getInventoryLevel();
      const levelEmoji = level === 'low' ? '⚠️' : level === 'high' ? '✅' : '📊';
      
      let response = `${levelEmoji} I can help you manage inventory! `;
      
      if (level === 'low') {
        response += `You currently have ${inventoryStats?.lowStockItems || 0} items with low stock. `;
        response += `Would you like me to help you reorder or update stock levels?`;
      } else {
        response += `Current inventory level: ${level}. `;
        response += `You can add items, search, filter by status, or export reports.`;
      }
      
      return response;
    }
    
    if (lowerMessage.includes('sales') || lowerMessage.includes('analytics')) {
      const lastSale = memory.getLastSale();
      let response = "📈 I can help with sales analytics! ";
      
      if (lastSale) {
        const timeAgo = Math.floor((Date.now() - lastSale.timestamp.getTime()) / (1000 * 60));
        response += `Your last sale was $${lastSale.amount.toFixed(2)} about ${timeAgo} minutes ago. `;
      }
      
      response += "You can view revenue trends, order volume, and performance metrics. Try asking me to 'export sales report'.";
      return response;
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      const suggestions = memory.getSmartSuggestions();
      const suggestionList = suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n');
      
      return `🤖 Hi ${userName}! I'm your AI assistant with enhanced capabilities:\n\n` +
        `🎯 **Navigation Control**: Say "navigate to [section]" to go anywhere\n` +
        `⚡ **Quick Actions**: "add item", "export report", "refresh data"\n` +
        `📊 **Smart Insights**: Context-aware help based on current view\n` +
        `🧠 **Memory**: I remember your preferences and actions\n\n` +
        `**Try these commands:**\n${suggestionList}\n\n` +
        `Or just ask me anything about inventory, sales, or settings!`;
    }
    
    if (lowerMessage.includes('status') || lowerMessage.includes('current')) {
      const view = memory.getCurrentView() || 'dashboard';
      const level = memory.getInventoryLevel() || 'normal';
      const recentActions = memory.getRecentActions().slice(0, 3);
      
      return `📋 **Current Status**:\n` +
        `📍 **View**: ${view}\n` +
        `📦 **Inventory Level**: ${level}\n` +
        `⏰ **Recent Actions**: ${recentActions.join(', ')}`;
    }
    
    // Default response with smart suggestions
    const suggestions = memory.getSmartSuggestions();
    if (suggestions.length > 0) {
      return `I understand you're asking about: "${userMessage}". ` +
        `While I'm learning, I can help you navigate the system and execute actions. ` +
        `Try these quick commands:\n${suggestions.slice(0, 3).map((s, i) => `• ${s}`).join('\n')}`;
    }
    
    return `I understand you're asking about: "${userMessage}". While I'm still learning, I can help you navigate the system and answer questions about inventory, sales, and settings. Could you provide more details about what you need assistance with?`;
  };

  const handleSendMessage = async () => {
    if (inputText.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const botResponse = await generateBotResponse(inputText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again or contact support if the issue persists.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const executeQuickAction = (action: string) => {
    setInputText(action);
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <div className={`${styles.chatBotContainer} ${isOpen ? styles.open : ''} ${isMinimized ? styles.minimized : ''}`}>
      {/* Chat Header */}
      <div className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          <Bot size={20} />
          <span className={styles.headerTitle}>AI Assistant</span>
          {currentView && (
            <span className={styles.contextIndicator}>
              {currentView === 'inventory' && <Package size={14} />}
              {currentView === 'analytics' && <BarChart3 size={14} />}
              {currentView === 'pos' && <ShoppingCart size={14} />}
              {currentView === 'settings' && <Settings size={14} />}
            </span>
          )}
        </div>
        <div className={styles.headerRight}>
          <button 
            className={styles.minimizeBtn}
            onClick={toggleMinimize}
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          {onToggle && (
            <button 
              className={styles.closeBtn}
              onClick={onToggle}
              title="Close"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      {!isMinimized && (
        <div className={styles.chatMessages}>
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`${styles.message} ${styles[message.sender]}`}
            >
              <div className={styles.messageContent}>
                <div className={styles.messageHeader}>
                  {message.sender === 'bot' ? <Bot size={14} /> : <User size={14} />}
                  <span className={styles.senderName}>
                    {message.sender === 'bot' ? 'AI Assistant' : memory.getUserName()}
                  </span>
                  <span className={styles.messageTime}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div className={styles.messageText}>
                  {message.action && (
                    <div className={styles.actionIndicator}>
                      {message.action.completed ? '✅' : '⏳'} {message.action.type}: {message.action.target}
                    </div>
                  )}
                  {message.text}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className={`${styles.message} ${styles.bot}`}>
              <div className={styles.messageContent}>
                <div className={styles.messageHeader}>
                  <Bot size={14} />
                  <span className={styles.senderName}>AI Assistant</span>
                </div>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Chat Input */}
      {!isMinimized && (
        <div className={styles.chatInput}>
          <div className={styles.inputContainer}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me to navigate, execute actions, or help..."
              className={styles.textInput}
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={inputText.trim() === '' || isTyping}
              className={styles.sendButton}
              title="Send message"
            >
              {isTyping ? (
                <div className={styles.spinner}></div>
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
          <div className={styles.quickActions}>
            <button 
              onClick={() => executeQuickAction("navigate to inventory")}
              className={styles.quickActionBtn}
              disabled={isTyping}
              title="Navigate to inventory"
            >
              <Navigation size={12} /> Inventory
            </button>
            <button 
              onClick={() => executeQuickAction("navigate to analytics")}
              className={styles.quickActionBtn}
              disabled={isTyping}
              title="Navigate to analytics"
            >
              <BarChart3 size={12} /> Analytics
            </button>
            <button 
              onClick={() => executeQuickAction("export sales report")}
              className={styles.quickActionBtn}
              disabled={isTyping}
              title="Export sales report"
            >
              📊 Export
            </button>
            <button 
              onClick={() => executeQuickAction("refresh")}
              className={styles.quickActionBtn}
              disabled={isTyping}
              title="Refresh current view"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      )}
      
      {/* Floating Toggle Button (when closed) */}
      {!isOpen && (
        <button 
          className={styles.floatingButton}
          onClick={onToggle}
          title="Open AI Assistant"
        >
          <MessageCircle size={20} />
          <span className={styles.notificationDot}></span>
        </button>
      )}
    </div>
  );
}
