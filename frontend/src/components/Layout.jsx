import { useEffect } from 'react';
import { useAuth, UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { setAuthToken } from '../lib/api';

export default function Layout({ children }) {
  const { getToken } = useAuth();

  useEffect(() => {
    // Sync token with axios automatically on mount
    const setupToken = async () => {
      try {
        const token = await getToken();
        setAuthToken(token);
      } catch (err) {
        console.error('Failed to set token:', err);
      }
    };
    setupToken();
  }, [getToken]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 w-full shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-blue-600 text-white p-2 rounded-lg group-hover:bg-blue-700 transition shadow-md">
                <BookOpen size={24} />
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">DoChat</span>
            </Link>
            <div className="flex items-center gap-4">
              <UserButton 
                appearance={{
                  elements: { avatarBox: "w-10 h-10 ring-2 ring-slate-100 shadow-sm" }
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
