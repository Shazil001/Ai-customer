import { Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Layout from './components/Layout';

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <SignedIn>
              <Layout>
                <Dashboard />
              </Layout>
            </SignedIn>
            <SignedOut>
              <Landing />
            </SignedOut>
          </>
        }
      />
      
      <Route
        path="/chat/:documentId"
        element={
          <>
            <SignedIn>
              <Layout>
                <Chat />
              </Layout>
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />
    </Routes>
  );
}

export default App;
