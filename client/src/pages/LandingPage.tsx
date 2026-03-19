import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Users, 
  MessageCircle, 
  FileText, 
  Shield, 
  TrendingUp 
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Chitti Manager</span>
            </div>
            
            <div className="hidden md:flex space-x-8">
              <Link to="/login" className="text-gray-700 hover:text-primary-600 transition-colors">
                Login
              </Link>
              <Link to="/signup" className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Manage Your{' '}
                <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Chitti
                </span>{' '}
                Digitally
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Track payments, manage members, automate reminders, and generate professional reports. 
                Our comprehensive Chitti management system helps you run your financial groups efficiently and securely.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/signup" 
                  className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors text-center"
                >
                  Start Free Trial
                </Link>
                <Link 
                  to="/login" 
                  className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:border-primary-600 hover:text-primary-600 transition-colors text-center"
                >
                  Login
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-600 mb-2">
                      <TrendingUp size={24} />
                    </div>
                    <div className="text-sm font-semibold text-green-800">₹1,25,000</div>
                    <div className="text-xs text-green-600">Total Collections</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-blue-600 mb-2">
                      <Users size={24} />
                    </div>
                    <div className="text-sm font-semibold text-blue-800">45</div>
                    <div className="text-xs text-blue-600">Active Members</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-yellow-600 mb-2">
                      <Calendar size={24} />
                    </div>
                    <div className="text-sm font-semibold text-yellow-800">3</div>
                    <div className="text-xs text-yellow-600">Active Groups</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-purple-600 mb-2">
                      <MessageCircle size={24} />
                    </div>
                    <div className="text-sm font-semibold text-purple-800">98%</div>
                    <div className="text-xs text-purple-600">On-time Payments</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Next Collection</span>
                    <span className="text-sm text-gray-500">March 25, 2024</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
              <p className="text-lg text-gray-600">Everything you need to manage your Chitti groups efficiently</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar size={24} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Tracking</h3>
                <p className="text-gray-600 text-sm">
                  Track all payments with detailed records, automated reminders, and real-time collection status.
                </p>
              </div>

              <div className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Users size={24} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Member Management</h3>
                <p className="text-gray-600 text-sm">
                  Easily add, manage, and organize your members with complete profile information and history.
                </p>
              </div>

              <div className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle size={24} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">WhatsApp Notifications</h3>
                <p className="text-gray-600 text-sm">
                  Send automated payment reminders and updates directly to your members via WhatsApp.
                </p>
              </div>

              <div className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText size={24} className="text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Reports</h3>
                <p className="text-gray-600 text-sm">
                  Generate professional PDF reports for each member with complete payment history and summaries.
                </p>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="mt-24 bg-white rounded-2xl shadow-lg p-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure & Reliable</h3>
                <p className="text-gray-600 mb-6">
                  Your data security is our top priority. We implement industry-standard security measures 
                  to ensure your Chitti information is always protected.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="text-green-500" />
                    <span className="text-gray-700">Multi-tenant isolation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="text-green-500" />
                    <span className="text-gray-700">Encrypted data storage</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="text-green-500" />
                    <span className="text-gray-700">Secure authentication</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">99.9%</div>
                  <div className="text-gray-600">Uptime Guarantee</div>
                  <p className="text-sm text-gray-500 mt-2">
                    We guarantee reliable service with minimal downtime
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-xl font-bold">Chitti Manager</span>
              </div>
              <p className="text-gray-400 text-sm">
                The most comprehensive Chitti management solution for modern financial groups.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Chitti Manager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}