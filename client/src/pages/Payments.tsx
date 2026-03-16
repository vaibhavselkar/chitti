import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, DollarSign, Loader2 } from 'lucide-react';
import { paymentAPI } from '../services/api';
import { Payment } from '../types';

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const response = await paymentAPI.getAll();
      if (response.data.success && response.data.data) {
        setPayments(response.data.data.payments);
      }
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  const methodLabel = (method: Payment['paymentMethod']) =>
    method.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Track and manage all payment records.</p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Record Payment</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
        </div>
      ) : payments.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No payments recorded</p>
          <p className="text-sm mt-1">Record your first payment to get started.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Receipt #</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Month</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Method</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Verified</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">{payment.receiptNumber}</td>
                    <td className="py-3 px-4 text-gray-600">Month {payment.month}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">₹{payment.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-600">{methodLabel(payment.paymentMethod)}</td>
                    <td className="py-3 px-4 text-gray-600">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {payment.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
