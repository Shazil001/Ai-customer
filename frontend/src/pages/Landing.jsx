import { SignInButton } from '@clerk/clerk-react';
import { Bot, FileText, Zap } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl transform hover:scale-105 transition duration-300">
            <Bot size={48} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-4xl font-extrabold text-slate-900 tracking-tight">
          Welcome to <span className="text-blue-600">DoChat</span>
        </h2>
        <p className="mt-2 text-center text-lg text-slate-600 max-w-sm mx-auto">
          Upload any PDF or Text file and instantly start chatting with your document using AI.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white/80 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-slate-200">
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-slate-700">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><FileText size={20}/></div>
              <span className="font-medium">Simple document upload</span>
            </div>
            <div className="flex items-center gap-4 text-slate-700">
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><Zap size={20}/></div>
              <span className="font-medium">Lightning fast semantic search</span>
            </div>
            <div className="flex items-center gap-4 text-slate-700">
              <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Bot size={20}/></div>
              <span className="font-medium">Context-aware AI answers</span>
            </div>
            
            <div className="pt-6">
              <SignInButton mode="modal">
                <button className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all active:scale-95">
                  Sign in with Google to Start
                </button>
              </SignInButton>
              <p className="text-center text-xs text-slate-500 mt-4">Safe & secure access powered by Clerk auth.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
