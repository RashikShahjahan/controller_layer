import React, { useState, useEffect, useRef, useCallback } from 'react';
import { trpc } from './TRPCProvider';

interface Message {
  text: string;
  isUser: boolean;
}




export function ChatbotInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const processQuestion = trpc.processQuestion.useMutation();
  const checkTaskStatus = trpc.checkTaskStatus.useQuery(
    { taskId: taskId || '' },
    { enabled: !!taskId, refetchInterval: 1000 }
  );

  useEffect(() => {
    const newConversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setConversationId(newConversationId);
  }, []);

  useEffect(() => {
    if (checkTaskStatus.data) {
      switch (checkTaskStatus.data.status) {
        case 'completed':
          setMessages(prev => [...prev, { text: checkTaskStatus.data.result, isUser: false }]);
          setTaskId(null);
          setIsLoading(false);
          break;
        case 'failed':
          setMessages(prev => [...prev, { text: "Sorry, there was an error processing your message.", isUser: false }]);
          setTaskId(null);
          setIsLoading(false);
          break;
      }
    }
  }, [checkTaskStatus.data]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !conversationId || isLoading) return;
    setIsLoading(true);

    const newMessage = { text: inputMessage, isUser: true };
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    try {
      const result = await processQuestion.mutateAsync({
        conversationId,
        question: inputMessage,
        messages: [...messages, newMessage]
      });
      
      setTaskId(result.taskId);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, { text: "Sorry, there was an error sending your message.", isUser: false }]);
      setIsLoading(false);
    }
  }, [inputMessage, conversationId, isLoading, messages, processQuestion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="chat-header">Chat AI</div>
      <div className="messages-area">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.isUser ? 'user' : 'ai'}`}>
            {!msg.isUser && (
              <div className="ai-icon">
                <img src="/logo.png" alt="AI Logo"/>
                <span>PROSIGHTS AI</span>
              </div>
            )}
            <div className="message-content">{msg.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="input-area">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask me any question ..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? '...' : '→'}
        </button>
      </form>
    </div>
  );
}