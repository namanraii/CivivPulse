import { Link, useLocation } from 'react-router-dom';
import { Home, Map as MapIcon, PlusCircle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Issue Map', path: '/map', icon: MapIcon },
    { name: 'Report Issue', path: '/report', icon: PlusCircle },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b-0 border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-indigo-400" />
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              CivicPulse
            </span>
          </div>
          
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-indigo-500/20 rounded-xl border border-indigo-500/30"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className="relative flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
