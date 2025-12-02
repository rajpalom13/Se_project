import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';
import { authService } from '../../services/authService';
import { chatService } from '../../services/chatService';
import Chat from '../../components/Chat/Chat';
import { User, MessageSquare, Video } from 'lucide-react';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const socket = useWebSocket();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, [user]);

  const loadContacts = async () => {
    try {
      let data;
      if (user.role === 'patient') {
        data = await authService.getMyDoctors();
        setContacts(data.doctors);
      } else {
        data = await authService.getPatients();
        setContacts(data.patients);
      }
    } catch {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex gap-6">
      {/* Contacts List */}
      <div className="w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600" />
            Messages
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <div
                key={contact._id}
                onClick={() => setSelectedContact(contact)}
                className={`p-4 border-b border-slate-50 cursor-pointer transition-colors flex items-center gap-3 ${
                  selectedContact?._id === contact._id
                    ? 'bg-teal-50 border-l-4 border-l-teal-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="p-2 bg-slate-100 rounded-full">
                  <User className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{contact.name}</p>
                  <p className="text-xs text-slate-500 capitalize">
                    {contact.specialization || 'Patient'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="p-4 text-center text-slate-500">No contacts found</p>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedContact && (
          <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center rounded-t-xl">
            <h3 className="font-bold text-slate-800">{selectedContact.name}</h3>
            <button
              onClick={async () => {
                const roomId = Date.now().toString();
                const link = `${window.location.origin}/video-call/${roomId}`;
                
                if (socket) {
                  socket.emit('video:call:start', {
                    recipientId: selectedContact._id,
                    senderName: user.name,
                    roomId
                  });
                }
                
                await chatService.sendMessage(selectedContact._id, `📞 Join my video call: ${link}`);
                navigate(`/video-call/${roomId}`);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Video className="w-4 h-4" /> Video Call
            </button>
          </div>
        )}
        
        {selectedContact ? (
          <Chat receiverId={selectedContact._id} receiverName={selectedContact.name} />
        ) : (
          <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p>Select a contact to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
