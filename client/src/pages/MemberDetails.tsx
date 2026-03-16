import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Phone, Loader2 } from 'lucide-react';
import { memberAPI } from '../services/api';
import { Member, Payment } from '../types';

const MemberDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchMemberDetails(id);
  }, [id]);

  const fetchMemberDetails = async (memberId: string) => {
    try {
      setIsLoading(true);
      const response = await memberAPI.getById(memberId);
      if (response.data.success && response.data.data) {
        setMember(response.data.data.member);
        setPaymentHistory(response.data.data.paymentHistory);
      }
    } catch (error) {
      toast.error('Failed to load member details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="card p-12 text-center text-gray-500">
        <p>Member not found.</p>
        <Link to="/members" className="text-primary-600 hover:underline mt-2 inline-block">Back to Members</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/members" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {member.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-3 text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{member.phone}</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Paid</span>
              <span className="font-medium text-gray-900">₹{member.totalPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Payout Received</span>
              <span className="font-medium text-gray-900">₹{member.totalPayoutReceived.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Withdraw Month</span>
              <span className="font-medium text-gray-900">Month {member.withdrawMonth}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
        {paymentHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No payment history available.</p>
        ) : (
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
                {paymentHistory.map((payment) => (
                  <tr key={payment._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">{payment.receiptNumber}</td>
                    <td className="py-3 px-4 text-gray-600">Month {payment.month}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">₹{payment.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{payment.paymentMethod.replace('_', ' ')}</td>
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
        )}
      </div>
    </div>
  );
};

export default MemberDetails;
