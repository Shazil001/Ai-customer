import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Trash2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import api from '../lib/api';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const fetchDocuments = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await api.get('/documents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
    } catch (err) {
      setError('Failed to load documents');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = await getToken();
      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      fetchDocuments();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error uploading file. Make sure it is a valid PDF or TXT.');
    } finally {
      setIsUploading(false);
    }
  }, [fetchDocuments, getToken]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const deleteDoc = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const token = await getToken();
      await api.delete(`/documents/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert('Failed to delete document');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your Documents</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {/* Upload Zone */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer bg-white group hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg
          ${isDragActive ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-slate-300'}
          ${isUploading ? 'opacity-50 cursor-not-allowed hidden' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-full group-hover:scale-110 transition-transform shadow-sm">
            <Upload size={32} />
          </div>
          <div>
            <p className="text-xl font-semibold text-slate-700">
              {isDragActive ? "Drop file here..." : "Click or drag to upload"}
            </p>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              Only PDF and TXT files are supported
            </p>
          </div>
        </div>
      </div>

      {isUploading && (
        <div className="border border-slate-200 rounded-2xl p-10 text-center bg-white shadow-xl flex flex-col items-center justify-center space-y-4">
          <Loader2 size={40} className="text-blue-600 animate-spin" />
          <p className="text-lg font-bold text-slate-800 tracking-tight">AI Analysing with pgvector...</p>
          <p className="text-sm text-slate-500 uppercase tracking-widest font-mono">Generating Embeddings</p>
        </div>
      )}

      {/* Document List */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 px-1">Recent Files</h2>
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-slate-400" size={32} />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 px-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-500 shadow-inner">
            <FileText size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-600">You haven't uploaded any documents yet.</p>
            <p className="text-sm text-slate-400 mt-1">Upload a PDF or TXT above to start chatting.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div 
                key={doc.id}
                onClick={() => navigate(`/chat/${doc.id}`, { state: { docName: doc.name } })}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-2xl hover:-translate-y-1.5 transition-all cursor-pointer group flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl shadow-sm ${doc.file_type === 'pdf' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                    <FileText size={24} />
                  </div>
                  <button 
                    onClick={(e) => deleteDoc(e, doc.id)}
                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                    title="Delete document"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <h3 className="font-bold text-slate-900 truncate flex-1 mb-2 tracking-tight group-hover:text-blue-600 transition" title={doc.name}>
                  {doc.name}
                </h3>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-auto pt-4 border-t border-slate-50">
                  <span className="font-mono">{new Date(doc.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center font-bold text-blue-600 group-hover:translate-x-1 transition-transform uppercase tracking-widest text-[10px]">
                    Chat <ArrowRight size={14} className="ml-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
