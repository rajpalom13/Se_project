import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, 
  Calendar, 
  Pill, 
  MapPin, 
  MessageCircle,
  Activity,
  Users,
  FileText,
  Camera,
  MessageSquare,
  Award
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();

  const patientLinks = [
    { to: '/patient/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/appointments', icon: Calendar, label: 'Appointments' },
    { to: '/patient/medicines', icon: Pill, label: 'Medicine Reminders' },
    { to: '/patient/goals', icon: Award, label: 'Health Goals' },
    { to: '/patient/vitals', icon: Activity, label: 'My Vitals' },
    { to: '/patient/prescriptions', icon: FileText, label: 'My Prescriptions' },
    { to: '/patient/reports', icon: FileText, label: 'My Reports' },
    { to: '/patient/symptom-checker', icon: Camera, label: 'Symptom Checker' },
    { to: '/patient/tracking', icon: MapPin, label: 'Track Doctor' },
    { to: '/chat', icon: MessageSquare, label: 'Messages' },
    { to: '/chatbot', icon: MessageCircle, label: 'AI Assistant' }
  ];

  const doctorLinks = [
    { to: '/doctor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/doctor/patients', icon: Users, label: 'My Patients' },
    { to: '/appointments', icon: Calendar, label: 'Appointments' },
    { to: '/chat', icon: MessageSquare, label: 'Messages' }
  ];

  const links = user?.role === 'doctor' ? doctorLinks : patientLinks;

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-teal-50 text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            <span className="font-medium">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
