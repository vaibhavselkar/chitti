import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  Smartphone, 
  Key, 
  Wifi, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Save,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function WhatsAppSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [config, setConfig] = useState({
    accountSid: '',
    authToken: '',
    whatsappNumber: '',
    enabled: false
  })
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    connected: boolean
  } | null>(null)

  useEffect(() => {
    // Load current configuration
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await axios.get('/api/notifications/status')
      // setConfig(response.data.config)
      // setIsConnected(response.data.connected)
      
      // Default empty config
      setConfig({
        accountSid: '',
        authToken: '',
        whatsappNumber: '',
        enabled: false
      })
      setIsConnected(false)
    } catch (error) {
      console.error('Load config error:', error)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      // TODO: Replace with actual API call
      // await axios.post('/api/notifications/config', config)
      
      console.log('Saving WhatsApp config:', config)
      toast.success('WhatsApp configuration saved successfully!')
    } catch (error: any) {
      console.error('Save config error:', error)
      toast.error('Failed to save WhatsApp configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setIsLoading(true)
    
    try {
      // TODO: Replace with actual API call
      // const response = await axios.get('/api/notifications/test')
      // setTestResult(response.data)
      
      // Mock test result
      setTestResult({
        success: true,
        message: 'WhatsApp service is connected',
        connected: true
      })
      
      toast.success('Connection test completed!')
    } catch (error: any) {
      console.error('Test connection error:', error)
      setTestResult({
        success: false,
        message: 'Failed to connect to WhatsApp service',
        connected: false
      })
      toast.error('Connection test failed')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (connected: boolean) => {
    return connected ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
  }

  const getStatusIcon = (connected: boolean) => {
    return connected ? CheckCircle : XCircle
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">WhatsApp Integration</h1>
              <p className="text-gray-600">Configure Twilio WhatsApp service for notifications</p>
            </div>
          </div>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(isConnected)}`}>
            {React.createElement(getStatusIcon(isConnected), { className: "h-4 w-4" })}
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="h-6 w-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="accountSid" className="block text-sm font-medium text-gray-700 mb-2">
              Account SID
            </label>
            <input
              type="password"
              id="accountSid"
              value={config.accountSid}
              onChange={(e) => setConfig({ ...config, accountSid: e.target.value })}
              className="input-field"
              placeholder="Enter your Twilio Account SID"
            />
          </div>

          <div>
            <label htmlFor="authToken" className="block text-sm font-medium text-gray-700 mb-2">
              Auth Token
            </label>
            <input
              type="password"
              id="authToken"
              value={config.authToken}
              onChange={(e) => setConfig({ ...config, authToken: e.target.value })}
              className="input-field"
              placeholder="Enter your Twilio Auth Token"
            />
          </div>

          <div>
            <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Number
            </label>
            <input
              type="tel"
              id="whatsappNumber"
              value={config.whatsappNumber}
              onChange={(e) => setConfig({ ...config, whatsappNumber: e.target.value })}
              className="input-field"
              placeholder="+1234567890"
            />
          </div>

          <div className="flex items-end space-x-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Enable WhatsApp Integration</span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={handleTestConnection}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResult && (
        <div className={testResult.connected ? 'bg-green-50 border border-green-200 rounded-lg p-4' : 'bg-red-50 border border-red-200 rounded-lg p-4'}>
          <div className="flex items-center space-x-2">
            {React.createElement(testResult.connected ? CheckCircle : XCircle, { 
              className: `h-5 w-5 ${testResult.connected ? 'text-green-600' : 'text-red-600'}` 
            })}
            <h3 className={`font-medium ${testResult.connected ? 'text-green-900' : 'text-red-900'}`}>
              Connection Test Result
            </h3>
          </div>
          <p className={`mt-1 text-sm ${testResult.connected ? 'text-green-800' : 'text-red-800'}`}>
            {testResult.message}
          </p>
        </div>
      )}

      {/* Features */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Wifi className="h-6 w-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Available Features</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Payment Reminders</span>
            </div>
            <p className="text-sm text-gray-600">
              Automatically send payment reminders to members via WhatsApp
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Payment Confirmations</span>
            </div>
            <p className="text-sm text-gray-600">
              Send confirmation messages when payments are received
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Withdrawal Notifications</span>
            </div>
            <p className="text-sm text-gray-600">
              Notify members about withdrawal request status changes
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Group Invitations</span>
            </div>
            <p className="text-sm text-gray-600">
              Send welcome messages to new group members
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Bulk Notifications</span>
            </div>
            <p className="text-sm text-gray-600">
              Send mass messages to multiple group members
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Custom Messages</span>
            </div>
            <p className="text-sm text-gray-600">
              Send personalized messages with custom templates
            </p>
          </div>
        </div>
      </div>

      {/* Setup Guide */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
          <h2 className="text-lg font-semibold text-yellow-900">Setup Guide</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-yellow-900 mb-2">1. Get Twilio Credentials</h3>
            <ol className="text-sm text-yellow-800 space-y-1">
              <li>• Sign up at twilio.com</li>
              <li>• Get your Account SID and Auth Token</li>
              <li>• Enable WhatsApp sandbox or buy a number</li>
            </ol>
          </div>

          <div>
            <h3 className="font-medium text-yellow-900 mb-2">2. Configure WhatsApp</h3>
            <ol className="text-sm text-yellow-800 space-y-1">
              <li>• Set up WhatsApp messaging</li>
              <li>• Verify your phone number</li>
              <li>• Configure message templates</li>
              <li>• Test the connection</li>
            </ol>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-100 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> WhatsApp Business API requires approval for message templates. 
            Use the sandbox for testing during development.
          </p>
        </div>
      </div>
    </div>
  )
}