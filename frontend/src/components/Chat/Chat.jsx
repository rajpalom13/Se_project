import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../../services/chatService';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../hooks/useAuth';
import { Send, User } from 'lucide-react';
import toast from 'react-hot-toast';

const Chat = ({ receiverId, receiverName }) => {
  const { user } = useAuth();
  const socket = useWebSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const loadMessages = async () => {
    try {
      const data = await chatService.getConversation(receiverId);
      setMessages(data.messages);
      scrollToBottom();
    } catch {
      toast.error('Failed to load messages');
    }
  };

  useEffect(() => {
    if (receiverId) {
      loadMessages();
    }
  }, [receiverId]);

  useEffect(() => {
    if (socket) {
      socket.on('message:receive', (message) => {
        if (
          (message.sender === receiverId && message.receiver === user.id) ||
          (message.sender === user.id && message.receiver === receiverId)
        ) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
      });

      return () => {
        socket.off('message:receive');
      };
    }
  }, [socket, receiverId, user.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      await chatService.sendMessage(receiverId, input);
      setInput('');
    } catch {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50 rounded-t-xl">
        <div className="p-2 bg-teal-100 rounded-full">
          <User className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">{receiverName}</h3>
          <p className="text-xs text-slate-500">Secure Chat</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const userId = user.id || user._id;
          const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
          const isMe = senderId === userId;
          
          return (
            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] p-3 rounded-xl text-sm ${
                  isMe
                    ? 'bg-teal-600 text-white rounded-tr-none'
                    : 'bg-slate-100 text-slate-800 rounded-tl-none'
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-teal-100' : 'text-slate-400'} text-right`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default Chat;
