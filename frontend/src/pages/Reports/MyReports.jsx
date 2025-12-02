import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data } = await api.get('/reports/my');
      setReports(data.reports);
    } catch {
      toast.error('Failed to load reports');
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
        <h1 className="text-2xl font-bold text-gray-900">My Medical Reports</h1>
      </div>

      <div className="grid gap-4">
        {reports.length > 0 ? (
          reports.map((report) => (
            <div key={report._id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="p-3 bg-blue-100 rounded-full h-fit">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{report.title}</h3>
                      {report.updatedAt > report.createdAt && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium">
                          Updated
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">
                      {report.type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">{report.notes}</p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">Dr. {report.doctor?.name}</span>
                      <span>•</span>
                      <span>{report.doctor?.specialization}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {new Date(report.date).toLocaleDateString()}
                  </div>
                  
                  {report.fileUrl && (
                    <a 
                      href={`http://localhost:5000${report.fileUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      View Attachment
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No reports found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReports;
