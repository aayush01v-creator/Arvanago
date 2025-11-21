
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { askAI } from '../services/assistantService.ts';
import { ChatMessage } from '../types.ts';
import Icon from './common/Icon.tsx';

interface AiAssistantProps {
  lectureTitle: string;
  lectureSummary: string;
  onClose: () => void;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ lectureTitle, lectureSummary, onClose }) => {
  const initialGreeting = useMemo<ChatMessage[]>(
    () => [
      {
        sender: 'ai',
        text: `Hi! I'm Edusim, your study companion. How can I help you with the "${lectureTitle}" lecture today?`,
      },
    ],
    [lectureTitle],
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() => initialGreeting);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages(initialGreeting);
  }, [initialGreeting]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    setTimeout(() => {
        inputRef.current?.focus();
    }, 100);
  }, []);

  const handleSend = useCallback(async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await askAI(lectureTitle, lectureSummary, input);
      const aiMessage: ChatMessage = { sender: 'ai', text: aiResponse };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { sender: 'ai', text: 'Oops! Something went wrong. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, lectureSummary, lectureTitle]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      void handleSend();
    }
  };


  return (
    <div className="fixed bottom-4 right-4 w-full max-w-md h-3/4 max-h-[600px] z-50 flex flex-col animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col h-full border border-slate-200 dark:border-slate-700">
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-brand-primary text-white rounded-t-2xl">
                <div className="flex items-center">
                    <Icon name="bot" className="w-6 h-6 mr-3" />
                    <h2 className="text-lg font-bold">AI Study Assistant</h2>
                </div>
                <button onClick={onClose} className="text-gray-300 hover:text-white">
                    <Icon name="x" className="w-6 h-6" />
                </button>
            </header>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                <div className="space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-brand-secondary flex items-center justify-center flex-shrink-0"><Icon name="bot" className="w-5 h-5 text-white"/></div>}
                    <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-brand-primary text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                       <p className="text-sm">{msg.text}</p>
                    </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-end gap-2 justify-start">
                        <div className="w-8 h-8 rounded-full bg-brand-secondary flex items-center justify-center flex-shrink-0"><Icon name="bot" className="w-5 h-5 text-white"/></div>
                        <div className="px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-bl-none">
                            <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
                </div>
            </div>

            <footer className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-2xl">
                <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a question..."
                    disabled={isLoading}
                    className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-brand-primary focus:ring-0 rounded-full outline-none transition"
                />
                <button
                    onClick={() => void handleSend()}
                    disabled={isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-brand-primary text-white rounded-full hover:bg-brand-secondary disabled:bg-gray-400 transition-colors"
                >
                    <Icon name="send" className="w-5 h-5" />
                </button>
                </div>
            </footer>
        </div>
    </div>
  );
};

export default AiAssistant;