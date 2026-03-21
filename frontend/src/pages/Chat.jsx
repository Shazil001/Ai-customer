import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Send, FileText, Bot, User, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import api from '../lib/api';

export default function Chat() {
  const { documentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [docName, setDocName] = useState(location.state?.docName || 'Document');
  
  const bottomRef = useRef(null);

  // Load chat history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await getToken();
        // Request history with real auth token
        const response = await api.get(`/chat/history/${documentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setMessages(response.data);
      } catch (err) {
        console.error('Error fetching chat history:', err);
        setError('Failed to load chat history.');
      }
    };
    fetchHistory();
  }, [documentId, getToken]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setError('');

    try {
      const token = await getToken();
      const response = await api.post('/chat', 
        { documentId, question: userMsg.content },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      const aiMsg = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: response.data.answer,
        source_doc: response.data.sourceDoc
      };
      
      if (!docName || docName === 'Document') setDocName(aiMsg.source_doc);
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setError('Failed to get response from AI. Try again.');
      // Keep input if failed? Or clear as we did optimistically
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative backdrop-blur-sm animate-in zoom-in-95 duration-300">
      <div className="flex items-center gap-4 p-5 border-b border-slate-200 bg-white/80 backdrop-blur-md relative z-10 w-full shadow-sm">
        <button 
          onClick={() => navigate('/')} 
          className="p-2.5 mr-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all active:scale-90"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl shadow-sm ring-1 ring-blue-200">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 tracking-tight leading-none mb-1">{docName}</h2>
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">RAG Pipeline Active</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-slate-50/50 flex flex-col items-center custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center space-y-6 pt-10">
            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 shadow-inner group-hover:scale-105 transition-transform duration-500">
               <Bot size={64} className="text-blue-400 animate-bounce group-hover:text-blue-600 duration-1000" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">AI Assistant Ready</h3>
              <p className="max-w-sm text-sm font-medium text-slate-500 leading-relaxed">
                Ask any question about your document. The AI will answer ONLY from the content provided.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={msg.id || idx} 
              className={`flex gap-4 max-w-4xl w-full animate-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`p-2.5 rounded-2xl flex-shrink-0 h-11 w-11 flex items-center justify-center shadow-lg transform transition hover:scale-110 
                ${msg.role === 'user' ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-blue-200' : 'bg-white text-blue-600 border border-slate-200 shadow-slate-100'}`}
              >
                {msg.role === 'user' ? <User size={22} /> : <Bot size={22} />}
              </div>
              <div className={`flex flex-col gap-1.5 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-6 py-4 rounded-3xl shadow-xl tracking-tight text-[15px] whitespace-pre-wrap leading-relaxed shadow-slate-200/50 transition-all hover:shadow-slate-300/50
                  ${msg.role === 'user' ? 'bg-blue-600 text-white !rounded-tr-lg font-medium' : 'bg-white text-slate-800 border border-slate-100 !rounded-tl-lg'}`}
                >
                  {msg.content}
                </div>
                {msg.source_doc && (
                  <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-widest bg-slate-100 rounded-full py-0.5">
                    Source: {msg.source_doc}
                  </span>
                )}
              </div>
            </div>
          ))
        )}

        {isTyping && (
           <div className="flex gap-4 max-w-4xl w-full animate-pulse">
            <div className="p-2.5 rounded-2xl flex-shrink-0 h-11 w-11 flex items-center justify-center shadow-md bg-white text-blue-600 border border-slate-200">
              <Bot size={22} />
            </div>
            <div className="px-6 py-4 rounded-3xl border border-blue-100 bg-blue-50/50 text-blue-700 shadow-sm flex items-center gap-3">
              <div className="flex gap-1">
                <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce"></div>
              </div>
              <span className="text-sm font-bold uppercase tracking-tight">AI Analysis in progress...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-6" />
      </div>

      <div className="p-6 bg-white border-t border-slate-200 relative z-10 w-full shadow-[0px_-20px_30px_-10px_rgba(0,0,0,0.03)] bg-gradient-to-t from-white to-slate-50/30">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-2xl border border-red-100 flex items-center gap-3 max-w-4xl mx-auto shadow-sm animate-shake">
             <AlertCircle size={20} className="text-red-500" /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="Ask a question about the document context..."
            className="flex-1 py-4.5 px-7 pr-16 border-2 border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-xl bg-white text-slate-800 placeholder:text-slate-400 group-hover:border-slate-200 font-medium"
          />
          <button 
            type="submit" 
            disabled={isTyping || !input.trim()}
            className="absolute right-2.5 top-2 bottom-2 px-5 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl hover:from-blue-600 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-90 shadow-lg shadow-blue-200 flex items-center justify-center"
          >
            <Send size={20} className="mr-2" />
            <span className="font-bold uppercase tracking-widest text-xs hidden sm:inline">Send</span>
          </button>
        </form>
        <p className="text-[10px] text-center mt-3 text-slate-400 font-bold uppercase tracking-[0.2em]">Contextual RAG Retrieval • GPT-4o-mini</p>
      </div>
    </div>
  );
}
