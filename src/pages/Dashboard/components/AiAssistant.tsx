import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Trash2, ChevronDown } from 'lucide-react';
import { useAiAssistant } from '../../../hooks/useAiAssistant';
import styles from './AiAssistant.module.css';

/**
 * AiAssistant — Floating chat panel powered by Gemini via Supabase Edge Function.
 * Mount once in Dashboard.tsx after all modals — renders as a fixed overlay.
 */
export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, isLoading, error, sendMessage, clearMessages } = useAiAssistant();

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    'What items are low in stock?',
    'Which items are out of stock?',
    'What\'s our most expensive product?',
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`${styles.fab} ${isOpen ? styles.fabActive : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        title="AI Assistant"
        aria-label="Open AI Assistant"
      >
        {isOpen ? <ChevronDown size={22} /> : <Bot size={22} />}
        {!isOpen && <span className={styles.fabPulse} />}
      </button>

      {/* Chat Panel */}
      <div className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`} role="dialog" aria-label="AI Assistant">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Bot size={18} />
            </div>
            <div>
              <div className={styles.headerTitle}>AI Assistant</div>
              <div className={styles.headerSub}>Powered by Gemini · Ken's Garage</div>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.iconBtn}
              onClick={clearMessages}
              title="Clear chat"
              aria-label="Clear chat"
            >
              <Trash2 size={15} />
            </button>
            <button
              className={styles.iconBtn}
              onClick={() => setIsOpen(false)}
              title="Close"
              aria-label="Close AI Assistant"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className={styles.messages}>
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAi}`}
            >
              {msg.role === 'assistant' && (
                <div className={styles.avatarAi}>
                  <Bot size={14} />
                </div>
              )}
              <div className={styles.bubble}>
                {msg.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className={`${styles.message} ${styles.messageAi}`}>
              <div className={styles.avatarAi}>
                <Bot size={14} />
              </div>
              <div className={`${styles.bubble} ${styles.typing}`}>
                <span /><span /><span />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className={styles.errorBanner}>
              ⚠ {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested questions (only when just welcome message) */}
        {messages.length === 1 && (
          <div className={styles.suggestions}>
            {suggestedQuestions.map(q => (
              <button
                key={q}
                className={styles.suggestionChip}
                onClick={() => sendMessage(q)}
                disabled={isLoading}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className={styles.inputBar}>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="Ask about inventory, stock, prices..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            maxLength={500}
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
