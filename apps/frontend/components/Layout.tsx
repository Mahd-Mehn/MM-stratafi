import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Layers, Github, Twitter, Plus, User, Settings, ChevronDown, LogOut, Shield } from 'lucide-react'
import { WalletConnect } from './WalletConnect'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="backdrop-blur-md bg-gray-900/50 border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg"
                />
                <span className="text-xl font-bold text-white">StrataFi</span>
              </Link>
              
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/pools" className="flex items-center space-x-1 text-gray-300 hover:text-white transition">
                  <Layers className="w-4 h-4" />
                  <span>Pools</span>
                </Link>
                <Link href="/create-pool" className="flex items-center space-x-1 text-primary-400 hover:text-primary-300 transition">
                  <Plus className="w-4 h-4" />
                  <span>Create Pool</span>
                </Link>
                <Link href="/portfolio" className="flex items-center space-x-1 text-gray-300 hover:text-white transition">
                  <BarChart3 className="w-4 h-4" />
                  <span>Portfolio</span>
                </Link>
                <Link href="/admin" className="flex items-center space-x-1 text-gray-300 hover:text-white transition">
                  <Shield className="w-4 h-4" />
                  <span>Admin</span>
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <WalletConnect />
              
              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition p-2 rounded-lg hover:bg-gray-800/50"
                >
                  <User className="w-5 h-5" />
                  <ChevronDown className={`w-4 h-4 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"
                    >
                      <div className="py-2">
                        <Link
                          href="/profile"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 transition"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 transition"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </Link>
                        <div className="border-t border-gray-700 my-2"></div>
                        <button
                          className="flex items-center space-x-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition w-full text-left"
                          onClick={() => {
                            setProfileDropdownOpen(false)
                            // Add disconnect wallet logic here
                          }}
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Disconnect</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900/50 border-t border-gray-700/50 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">StrataFi Protocol</h3>
              <p className="text-gray-400 text-sm">
                Decentralized real-world asset tokenization platform built on Aptos blockchain.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Resources</h3>
              <div className="space-y-2">
                <Link href="/pools" className="text-gray-400 hover:text-white text-sm block">
                  Pools
                </Link>
                <Link href="/create-pool" className="text-gray-400 hover:text-white text-sm block">
                  Create Pool
                </Link>
                <Link href="/portfolio" className="text-gray-400 hover:text-white text-sm block">
                  Portfolio
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white text-sm block">
                  Audit Reports
                </Link>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
              <p className="text-gray-500 text-sm mt-4">
                © {new Date().getFullYear()} StrataFi. Built for CTRL+MOVE Hackathon.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
