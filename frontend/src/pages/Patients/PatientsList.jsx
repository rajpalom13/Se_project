import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { User, Phone, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const PatientsList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const data = await authService.getPatients();
      setPatients(data.patients);
    } catch {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">My Patients</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.length > 0 ? (
          patients.map((patient) => (
            <Link 
              key={patient._id} 
              to={`/doctor/patients/${patient._id}`}
              className="card hover:shadow-md transition-all duration-200 hover:-translate-y-1"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-teal-50 rounded-full">
                  <User className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{patient.name}</h3>
                  <p className="text-sm text-slate-500">{patient.email}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {patient.phone}
                </div>
                {patient.disease && (
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Condition: {patient.disease}
                  </div>
                )}
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No patients found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientsList;
