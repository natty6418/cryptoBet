import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Menu, X, Wallet } from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isConnected, address, connect, disconnect } = useWallet();
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <TrendingUp className="text-indigo-500" size={28} />
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
              BetChain
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-slate-200 hover:text-white transition-colors">
              Markets
            </Link>
            <Link to="/dashboard" className="text-slate-200 hover:text-white transition-colors">
              Dashboard
            </Link>
            {!isConnected ? (
              <button 
                onClick={connect}
                className="btn btn-primary"
              >
                <Wallet size={16} className="mr-2" />
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center">
                <div className="px-3 py-1 bg-slate-800 rounded-l-lg text-slate-300 text-sm">
                  {`${address?.substring(0, 6)}...${address?.substring(address.length - 4)}`}
                </div>
                <button 
                  onClick={disconnect} 
                  className="px-3 py-1 bg-slate-700 rounded-r-lg text-slate-300 hover:bg-slate-600 transition-colors text-sm"
                >
                  Disconnect
                </button>
              </div>
            )}
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-slate-200 hover:text-white"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-slate-800 border-b border-slate-700">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link 
              to="/" 
              className="text-slate-200 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Markets
            </Link>
            <Link 
              to="/dashboard" 
              className="text-slate-200 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            {!isConnected ? (
              <button 
                onClick={() => {
                  connect();
                  setIsMenuOpen(false);
                }}
                className="btn btn-primary"
              >
                <Wallet size={16} className="mr-2" />
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center">
                <div className="px-3 py-1 bg-slate-700 rounded-l-lg text-slate-300 text-sm">
                  {`${address?.substring(0, 6)}...${address?.substring(address.length - 4)}`}
                </div>
                <button 
                  onClick={() => {
                    disconnect();
                    setIsMenuOpen(false);
                  }} 
                  className="px-3 py-1 bg-slate-600 rounded-r-lg text-slate-300 hover:bg-slate-500 transition-colors text-sm"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;