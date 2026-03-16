import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { BarChart3, Download, Loader2 } from 'lucide-react';
import { paymentAPI } from '../services/api';

const Reports: React.FC = () => {
  const [chitGroupId, setChitGroupId] = useState('');
  const [month, setMonth] = useState('');
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chitGroupId || !month) {
      toast.error('Please select a chit group and month');
      return;
    }
    try {
      setIsLoading(true);
      const response = await paymentAPI.getMonthlyReport(chitGroupId, Number(month));
      if (response.data.success && response.data.data) {
        setReport(response.data.data);
        toast.success('Report loaded');
      }
    } catch (error) {
      toast.error('Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Generate monthly collection and payment reports.</p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Collection Report</h2>
        <form onSubmit={fetchReport} className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Chit Group ID</label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter chit group ID"
              value={chitGroupId}
              onChange={(e) => setChitGroupId(e.target.value)}
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <input
              type="number"
              className="input-field"
              placeholder="1–24"
              min={1}
              max={24}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={isLoading} className="btn-primary flex items-center space-x-2">
              {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
              <span>Generate</span>
            </button>
          </div>
        </form>
      </div>

      {report ? (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Report Results</h2>
            <button className="btn-secondary flex items-center space-x-2 text-sm">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
          <pre className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 overflow-x-auto">
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="card p-12 text-center text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No report generated yet</p>
          <p className="text-sm mt-1">Select a chit group and month to generate a report.</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
