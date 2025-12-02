import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';
import { notificationService } from '../../services/notificationService';
import { LogOut, User, Bell, AlertTriangle, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const socket = useWebSocket();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Error loading notifications', error);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Close dropdown on click outside
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (socket && user) {
      const handleTargetedNotification = (data) => {
        if (data.patientId === (user.id || user._id) || data.recipient === (user.id || user._id)) {
           loadNotifications();
           toast('New Notification', { icon: '🔔' });
        }
      };

      const handleCallInvite = (data) => {
        if (data.recipientId === (user.id || user._id)) {
           loadNotifications();
           toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center animate-pulse">
                      <Bell className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Incoming Video Call
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {data.senderName} is calling you...
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200 flex-col">
                <button
                  onClick={() => {
                    navigate(`/video-call/${data.roomId}`);
                    toast.dismiss(t.id);
                  }}
                  className="w-full border-b border-gray-200 border-transparent rounded-none p-4 flex items-center justify-center text-sm font-medium text-green-600 hover:bg-green-50 focus:outline-none"
                >
                  Join Call
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-br-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
                >
                  Ignore
                </button>
              </div>
            </div>
           ), { duration: 20000 });
        }
      };

      const handleEmergencyAlert = (data) => {
        if (user.role === 'doctor') {
           loadNotifications();
           // Show persistent interactive alert
           toast.custom((t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-red-600 text-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <AlertTriangle className="h-10 w-10 text-white animate-pulse" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-white">
                      EMERGENCY ALERT!
                    </p>
                    <p className="mt-1 text-sm text-red-100">
                      Patient {data.patientName} has triggered an SOS!
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-red-500 flex-col">
                <button
                  onClick={() => {
                    socket.emit('doctor:emergency:response', {
                      patientId: data.patientId,
                      doctorName: user.name,
                      status: 'accepted'
                    });
                    toast.dismiss(t.id);
                    toast.success('Response sent to patient');
                  }}
                  className="w-full border-b border-red-500 border-transparent rounded-none p-4 flex items-center justify-center text-sm font-medium text-white hover:bg-red-500 focus:outline-none"
                >
                  Respond
                </button>
                {data.location && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${data.location.latitude},${data.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full border-b border-red-500 border-transparent rounded-none p-4 flex items-center justify-center text-sm font-medium text-white hover:bg-red-500 focus:outline-none"
                  >
                    <MapPin className="w-4 h-4 mr-2" /> Map
                  </a>
                )}
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-br-lg p-4 flex items-center justify-center text-sm font-medium text-white hover:text-red-100 focus:outline-none"
                >
                  Close
                </button>
              </div>
            </div>
          ), { duration: Infinity });
        }
      };

      const handleHealthAlert = (data) => {
        if (data.recipient === (user.id || user._id)) {
           loadNotifications();
           toast(data.message, { icon: '⚠️', duration: 6000 });
        }
      };

      socket.on('patient:update', handleTargetedNotification);
      socket.on('emergency:response', handleTargetedNotification);
      socket.on('emergency:alert', (data) => handleEmergencyAlert(data));
      socket.on('patient:health_alert', handleHealthAlert);
      socket.on('video:call:invite', handleCallInvite);

      return () => {
        socket.off('patient:update');
        socket.off('emergency:response');
        socket.off('emergency:alert');
        socket.off('patient:health_alert');
        socket.off('video:call:invite');
      };
    }
  }, [socket, user]);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <nav className="bg-white shadow-sm border-b border-slate-100 relative z-50">
      <div className="px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-teal-600 tracking-tight">MediTrack AI</h1>
        
        <div className="flex items-center gap-6">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-3 border-b border-slate-100 bg-slate-50 font-medium text-slate-700 flex justify-between items-center">
                  <span>Notifications</span>
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">{unreadCount} New</span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(notification => (
                      <div 
                        key={notification._id}
                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-teal-50/50' : ''}`}
                        onClick={() => handleMarkRead(notification._id)}
                      >
                        <p className="text-sm text-slate-800">{notification.message}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-sm text-gray-500 text-center">No notifications</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 rounded-full">
              <User className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
