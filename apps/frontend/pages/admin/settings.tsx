import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Key, Bell, Shield, Database, Globe, Settings, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useNotifications } from '../../context/NotificationContext'
import { useAptosTx } from '../../lib/aptosTx'

interface SettingSection {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  settings: Setting[]
}

interface Setting {
  id: string
  label: string
  type: 'toggle' | 'input' | 'select'
  value: any
  options?: string[]
  description?: string
}

export default function AdminSettings() {
  const { success, error } = useNotifications()
  const { callVaultInitialize, callTrancheInitialize } = useAptosTx()
  const [settings, setSettings] = useState({
    // API Settings
    helios_url: 'http://localhost:8000',
    aptos_node: 'https://fullnode.testnet.aptoslabs.com/v1',
    nodit_api_key: '',

    // Notification Settings
    email_notifications: true,
    push_notifications: false,
    health_alerts: true,
    performance_alerts: true,

    // Security Settings
    require_admin_approval: true,
    auto_pause_unhealthy_pools: false,
    max_investment_per_user: 100000,

    // Risk Settings
    min_health_score: 60,
    auto_rebalance_enabled: false,
    risk_tolerance: 'medium',

    // Performance Settings
    health_check_interval: 300, // seconds
    max_concurrent_assessments: 5,
    cache_duration: 3600, // seconds
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isInitVault, setIsInitVault] = useState(false)
  const [isInitTranche, setIsInitTranche] = useState(false)

  const handleSettingChange = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value })
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      success('Settings Saved', 'All settings have been updated successfully')
    } catch (err) {
      error('Save Failed', 'Could not save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInitVault = async () => {
    setIsInitVault(true)
    try {
      const tx = await callVaultInitialize()
      success('Vault Initialized', `TX: ${tx.hash ?? 'submitted'}`)
    } catch (e: any) {
      error('Initialize Failed', e?.message ?? 'Could not initialize vault')
    } finally {
      setIsInitVault(false)
    }
  }

  const handleInitTranche = async () => {
    setIsInitTranche(true)
    try {
      const tx = await callTrancheInitialize()
      success('Tranche Initialized', `TX: ${tx.hash ?? 'submitted'}`)
    } catch (e: any) {
      error('Initialize Failed', e?.message ?? 'Could not initialize tranche')
    } finally {
      setIsInitTranche(false)
    }
  }

  const sections: SettingSection[] = [
    {
      id: 'api',
      title: 'API Configuration',
      description: 'Configure external service connections',
      icon: <Globe className="w-6 h-6 text-blue-400" />,
      settings: [
        {
          id: 'helios_url',
          label: 'Helios API URL',
          type: 'input',
          value: settings.helios_url,
          description: 'URL for the Helios AI oracle service'
        },
        {
          id: 'aptos_node',
          label: 'Aptos Node URL',
          type: 'input',
          value: settings.aptos_node,
          description: 'Primary Aptos blockchain node'
        },
        {
          id: 'nodit_api_key',
          label: 'Nodit API Key',
          type: 'input',
          value: settings.nodit_api_key,
          description: 'API key for Nodit indexer service'
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure alert and notification preferences',
      icon: <Bell className="w-6 h-6 text-yellow-400" />,
      settings: [
        {
          id: 'email_notifications',
          label: 'Email Notifications',
          type: 'toggle',
          value: settings.email_notifications
        },
        {
          id: 'push_notifications',
          label: 'Push Notifications',
          type: 'toggle',
          value: settings.push_notifications
        },
        {
          id: 'health_alerts',
          label: 'Health Alerts',
          type: 'toggle',
          value: settings.health_alerts,
          description: 'Alerts when pool health scores change significantly'
        },
        {
          id: 'performance_alerts',
          label: 'Performance Alerts',
          type: 'toggle',
          value: settings.performance_alerts,
          description: 'Alerts for system performance issues'
        }
      ]
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Security and access control settings',
      icon: <Shield className="w-6 h-6 text-green-400" />,
      settings: [
        {
          id: 'require_admin_approval',
          label: 'Require Admin Approval',
          type: 'toggle',
          value: settings.require_admin_approval,
          description: 'Require admin approval for large investments'
        },
        {
          id: 'auto_pause_unhealthy_pools',
          label: 'Auto-Pause Unhealthy Pools',
          type: 'toggle',
          value: settings.auto_pause_unhealthy_pools,
          description: 'Automatically pause pools with health scores below threshold'
        },
        {
          id: 'max_investment_per_user',
          label: 'Max Investment per User (USDC)',
          type: 'input',
          value: settings.max_investment_per_user,
          description: 'Maximum investment amount allowed per user'
        }
      ]
    },
    {
      id: 'risk',
      title: 'Risk Management',
      description: 'Configure risk assessment parameters',
      icon: <TrendingUp className="w-6 h-6 text-purple-400" />,
      settings: [
        {
          id: 'min_health_score',
          label: 'Minimum Health Score',
          type: 'input',
          value: settings.min_health_score,
          description: 'Minimum health score for pools to remain active'
        },
        {
          id: 'auto_rebalance_enabled',
          label: 'Auto-Rebalancing',
          type: 'toggle',
          value: settings.auto_rebalance_enabled,
          description: 'Automatically rebalance portfolio allocations'
        },
        {
          id: 'risk_tolerance',
          label: 'Risk Tolerance',
          type: 'select',
          value: settings.risk_tolerance,
          options: ['conservative', 'moderate', 'aggressive'],
          description: 'Overall risk tolerance for automated decisions'
        }
      ]
    },
    {
      id: 'performance',
      title: 'Performance',
      description: 'System performance and optimization settings',
      icon: <Settings className="w-6 h-6 text-gray-400" />,
      settings: [
        {
          id: 'health_check_interval',
          label: 'Health Check Interval (seconds)',
          type: 'input',
          value: settings.health_check_interval,
          description: 'How often to check pool health scores'
        },
        {
          id: 'max_concurrent_assessments',
          label: 'Max Concurrent Assessments',
          type: 'input',
          value: settings.max_concurrent_assessments,
          description: 'Maximum number of simultaneous health assessments'
        },
        {
          id: 'cache_duration',
          label: 'Cache Duration (seconds)',
          type: 'input',
          value: settings.cache_duration,
          description: 'How long to cache health assessment results'
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link href="/admin" className="p-2 hover:bg-gray-800/50 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 mt-1">Configure system parameters and preferences</p>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* On-chain Setup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-primary-400" />
                <div>
                  <h2 className="text-xl font-semibold text-white">On-chain Setup</h2>
                  <p className="text-gray-400 text-sm">One-time initialization of events and coin capabilities</p>
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={handleInitVault}
                disabled={isInitVault}
                className={`px-4 py-3 rounded-lg text-white ${isInitVault ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
              >
                {isInitVault ? 'Initializing Vault...' : 'Initialize Vault Events'}
              </button>
              <button
                onClick={handleInitTranche}
                disabled={isInitTranche}
                className={`px-4 py-3 rounded-lg text-white ${isInitTranche ? 'bg-gray-700 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500'}`}
              >
                {isInitTranche ? 'Initializing Tranche...' : 'Initialize Tranche Coins & Events'}
              </button>
            </div>
          </motion.div>

          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card"
            >
              <div className="flex items-center gap-3 mb-6">
                {section.icon}
                <div>
                  <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                  <p className="text-gray-400 text-sm">{section.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                {section.settings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex-1">
                      <label className="text-white font-medium">{setting.label}</label>
                      {setting.description && (
                        <p className="text-gray-400 text-sm mt-1">{setting.description}</p>
                      )}
                    </div>

                    <div className="w-48">
                      {setting.type === 'toggle' && (
                        <button
                          onClick={() => handleSettingChange(setting.id, !settings[setting.id as keyof typeof settings])}
                          className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition
                            ${settings[setting.id as keyof typeof settings] ? 'bg-primary-500' : 'bg-gray-600'}
                          `}
                        >
                          <span
                            className={`
                              inline-block h-4 w-4 transform rounded-full bg-white transition
                              ${settings[setting.id as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'}
                            `}
                          />
                        </button>
                      )}

                      {setting.type === 'input' && (
                        <input
                          type="text"
                          value={String(settings[setting.id as keyof typeof settings])}
                          onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-400"
                        />
                      )}

                      {setting.type === 'select' && (
                        <select
                          value={String(settings[setting.id as keyof typeof settings])}
                          onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-400"
                        >
                          {setting.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-end mt-8"
        >
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition
              ${isSaving
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:opacity-90'
              }
            `}
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
