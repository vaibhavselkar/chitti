import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome to Chitti Manager</h2>
          <p className="mt-2 text-gray-600">Sign in to your account to get started</p>
        </div>

        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  )
}
