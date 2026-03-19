import { useState } from 'react'
import { 
  Download, 
  FileText, 
  Users, 
  DollarSign, 
  Calendar,
  Printer,
  Share2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface PDFExportProps {
  isOpen: boolean
  onClose: () => void
  exportType: 'group' | 'payment' | 'withdrawal' | 'member'
  entityId?: string
  entityName?: string
  onExport: (format: 'pdf' | 'print') => void
}

export default function PDFExport({ 
  isOpen, 
  onClose, 
  exportType, 
  entityId, 
  entityName, 
  onExport 
}: PDFExportProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'print'>('pdf')
  const [selectedPeriod, setSelectedPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  })

  const handleExport = async (format: 'pdf' | 'print') => {
    setIsLoading(true)
    
    try {
      // TODO: Replace with actual API call
      // const response = await axios.get(`/api/reports/${exportType}/${entityId}/export?format=${format}&month=${selectedPeriod.month}&year=${selectedPeriod.year}`, {
      //   responseType: format === 'pdf' ? 'blob' : 'text'
      // })
      
      console.log('Exporting:', {
        type: exportType,
        entityId,
        format,
        period: selectedPeriod
      })
      
      if (format === 'pdf') {
        toast.success('PDF download started!')
        // Handle PDF download
        // const url = window.URL.createObjectURL(new Blob([response.data]))
        // const link = document.createElement('a')
        // link.href = url
        // link.setAttribute('download', `${exportType}-${entityName}-${new Date().toISOString()}.pdf`)
        // document.body.appendChild(link)
        // link.click()
        // link.remove()
      } else {
        toast.success('Preparing print...')
        // Handle print
        // window.print()
      }
      
      onExport(format)
      onClose()
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error('Failed to export document')
    } finally {
      setIsLoading(false)
    }
  }

  const getExportTitle = () => {
    switch (exportType) {
      case 'group': return 'Group Report'
      case 'payment': return 'Payment Receipt'
      case 'withdrawal': return 'Withdrawal Receipt'
      case 'member': return 'Member Statement'
      default: return 'Export Document'
    }
  }

  const getExportIcon = () => {
    switch (exportType) {
      case 'group': return <FileText className="h-6 w-6" />
      case 'payment': return <DollarSign className="h-6 w-6" />
      case 'withdrawal': return <DollarSign className="h-6 w-6" />
      case 'member': return <Users className="h-6 w-6" />
      default: return <Download className="h-6 w-6" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              {getExportIcon()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {getExportTitle()}
              </h2>
              <p className="text-sm text-gray-600">
                Export {entityName || 'document'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedFormat('pdf')}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  selectedFormat === 'pdf' 
                    ? 'border-primary-500 bg-primary-50 text-primary-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Download className="h-5 w-5" />
                  <div>
                    <div className="font-medium">PDF Document</div>
                    <div className="text-sm text-gray-600">Download as PDF file</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setSelectedFormat('print')}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  selectedFormat === 'print' 
                    ? 'border-primary-500 bg-primary-50 text-primary-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Printer className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Print</div>
                    <div className="text-sm text-gray-600">Print directly</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Period Selection (for reports) */}
          {(exportType === 'group' || exportType === 'member') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Report Period
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="month" className="block text-sm text-gray-600 mb-1">
                    Month
                  </label>
                  <select
                    id="month"
                    value={selectedPeriod.month}
                    onChange={(e) => setSelectedPeriod(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                    className="input-field"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>
                        {new Date(2024, month - 1).toLocaleDateString('en-US', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="year" className="block text-sm text-gray-600 mb-1">
                    Year
                  </label>
                  <select
                    id="year"
                    value={selectedPeriod.year}
                    onChange={(e) => setSelectedPeriod(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="input-field"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Document Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-16 bg-white border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {getExportTitle()}
                </div>
                <div className="text-sm text-gray-600">
                  {entityName || 'Document Name'}
                </div>
                {(exportType === 'group' || exportType === 'member') && (
                  <div className="text-xs text-gray-500">
                    Period: {new Date(selectedPeriod.year, selectedPeriod.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Export Guidelines:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• PDF files can be saved and shared</li>
              <li>• Print option opens browser print dialog</li>
              <li>• Reports include all data up to selected period</li>
              <li>• Documents are generated in real-time</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 px-6 pb-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleExport(selectedFormat)}
            disabled={isLoading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>
              {isLoading ? 'Processing...' : selectedFormat === 'pdf' ? 'Download PDF' : 'Print Document'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}