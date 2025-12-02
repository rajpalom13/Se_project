import React, { useState } from 'react';
import api from '../../services/api';
import { Upload, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const SymptomChecker = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setAnalysis('');
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);

    try {
      const { data } = await api.post('/symptom/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAnalysis(data.analysis);
      toast.success('Analysis complete');
    } catch {
      toast.error('Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-100 rounded-full">
          <Info className="w-8 h-8 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Visual Symptom Checker</h1>
          <p className="text-slate-600">Upload a photo of a symptom (e.g., skin rash) for AI analysis.</p>
        </div>
      </div>

      <div className="card bg-orange-50 border-orange-200">
        <div className="flex gap-3">
          <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-orange-900">Medical Disclaimer</h3>
            <p className="text-sm text-orange-800 mt-1">
              This tool uses AI to provide information, not a medical diagnosis. 
              Always consult a doctor for accurate diagnosis and treatment. 
              In an emergency, call emergency services immediately.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="card">
          <h2 className="text-lg font-bold text-slate-800 mb-4">1. Upload Photo</h2>
          
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {preview ? (
              <div className="relative">
                <img 
                  src={preview} 
                  alt="Symptom Preview" 
                  className="max-h-64 mx-auto rounded-lg shadow-md"
                />
                <p className="mt-2 text-sm text-slate-500">Click to change image</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-12 h-12 text-slate-400 mb-3" />
                <p className="text-slate-600 font-medium">Click or Drag to upload image</p>
                <p className="text-sm text-slate-400 mt-1">JPG, PNG supported</p>
              </div>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!image || loading}
            className="w-full mt-6 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              'Analyzing...'
            ) : (
              <>
                <CheckCircle className="w-5 h-5" /> Analyze Symptom
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        <div className="card">
          <h2 className="text-lg font-bold text-slate-800 mb-4">2. AI Analysis</h2>
          
          {analysis ? (
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm leading-relaxed">
                {analysis}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              {loading ? 'Processing image...' : 'Analysis results will appear here'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SymptomChecker;
