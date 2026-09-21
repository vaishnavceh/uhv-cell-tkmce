import React from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Home, Compass, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFound: React.FC = () => {
  usePageTitle('Page Not Found');

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-institutional-warm">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-2xl border border-emerald-900/10 shadow-subtle">
        <div className="w-16 h-16 bg-emerald-100/70 border border-emerald-300 rounded-full flex items-center justify-center mx-auto text-institutional-900 font-extrabold text-2xl">
          404
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-institutional-950">Page Not Found</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            The page you are looking for might have been moved, renamed, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <Link to="/">
            <Button className="w-full justify-center">
              <Home className="w-4 h-4 mr-2" /> Return to Homepage
            </Button>
          </Link>
          <Link to="/about">
            <Button variant="outline" className="w-full justify-center border-slate-300">
              <Compass className="w-4 h-4 mr-2" /> Explore Cell Pillars
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="ghost" className="w-full justify-center text-slate-600 hover:text-emerald-900">
              <Mail className="w-4 h-4 mr-2" /> Contact Office
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
