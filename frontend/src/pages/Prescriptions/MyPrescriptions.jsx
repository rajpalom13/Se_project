import React, { useState, useEffect } from 'react';
import { prescriptionService } from '../../services/prescriptionService';
import { FileText, Pill, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const MyPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const data = await prescriptionService.getMyPrescriptions();
      setPrescriptions(data.prescriptions);
    } catch {
      toast.error('Failed to load prescriptions');
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
        <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
      </div>

      <div className="space-y-4">
        {prescriptions.length > 0 ? (
          prescriptions.map((pres) => (
            <div key={pres._id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Pill className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">Dr. {pres.doctor?.name}</h3>
                        {pres.updatedAt > pres.createdAt && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium">
                            Updated
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{pres.doctor?.specialization}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pl-2 border-l-2 border-gray-100 ml-4">
                    {pres.medicines.map((med, idx) => (
                      <div key={idx}>
                        <p className="font-medium text-gray-800">
                          {med.name} <span className="text-gray-500 font-normal">- {med.dosage}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          {med.instructions} • {med.duration}
                        </p>
                      </div>
                    ))}
                  </div>

                  {pres.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
                      <span className="font-medium">Notes:</span> {pres.notes}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3 min-w-[150px]">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {new Date(pres.date).toLocaleDateString()}
                  </div>
                  
                  {pres.imageUrl && (
                    <a 
                      href={`http://localhost:5000${pres.imageUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm font-medium w-full justify-center md:w-auto"
                    >
                      <FileText className="w-4 h-4" />
                      View File
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-12">
            <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No prescriptions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPrescriptions;
