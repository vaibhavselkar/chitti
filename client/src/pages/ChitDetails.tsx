import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft, Users, DollarSign, Calendar, Loader2, Plus, X,
  UserPlus, IndianRupee, CheckCircle2, ExternalLink, FileText,
} from 'lucide-react';
import { chitAPI, memberAPI, paymentAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ChitGroup, Member, Payment } from '../types';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
];

const ChitDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [chit, setChit] = useState<ChitGroup | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add member modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: '', phone: '' });
  const [isAdding, setIsAdding] = useState(false);

  // Record payout modal
  const [payoutMember, setPayoutMember] = useState<Member | null>(null);
  const [payoutMonth, setPayoutMonth] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Payment sheet / receipt viewer
  const [sheetMember, setSheetMember] = useState<Member | null>(null);
  const [sheetPayments, setSheetPayments] = useState<Payment[]>([]);
  const [sheetAdminSig, setSheetAdminSig] = useState<string | null>(null);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);

  // Record payment modal
  const [paymentMember, setPaymentMember] = useState<Member | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    month: '',
    amount: '',
    paymentMethod: 'cash',
    notes: '',
  });
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  useEffect(() => {
    if (id) fetchChitDetails(id);
  }, [id]);

  const fetchChitDetails = async (chitId: string) => {
    try {
      setIsLoading(true);
      const response = await chitAPI.getById(chitId);
      if (response.data.success && response.data.data) {
        setChit(response.data.data.chitGroup);
        setMembers(response.data.data.members);
      }
    } catch {
      toast.error('Failed to load chit details');
    } finally {
      setIsLoading(false);
    }
  };

  const openSheet = async (member: Member) => {
    setSheetMember(member);
    setSheetPayments([]);
    setSheetAdminSig(null);
    try {
      setIsLoadingSheet(true);
      const [histRes, memberRes] = await Promise.all([
        paymentAPI.getMemberHistory(member._id),
        memberAPI.getById(member._id),
      ]);
      if (histRes.data.success && histRes.data.data)
        setSheetPayments(histRes.data.data.paymentHistory || []);
      if (memberRes.data.success && memberRes.data.data)
        setSheetAdminSig((memberRes.data.data as any).adminSignatureImage || null);
    } catch {
      toast.error('Failed to load payment history');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, phone } = memberForm;
    if (!name || !phone) { toast.error('Please fill in all fields'); return; }
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      toast.error('Enter a valid 10-digit phone number'); return;
    }
    try {
      setIsAdding(true);
      await memberAPI.create({ name, phone, chitGroupId: id! });
      toast.success(`${name} added successfully`);
      setMemberForm({ name: '', phone: '' });
      setShowAddMember(false);
      fetchChitDetails(id!);
    } catch (err: any) {
      const data = err?.response?.data;
      toast.error(data?.message || data?.errors?.[0]?.msg || 'Failed to add member');
    } finally {
      setIsAdding(false);
    }
  };

  const openPaymentModal = (member: Member) => {
    setPaymentMember(member);
    const paidMonths = chit && chit.monthlyContribution > 0
      ? Math.floor(member.totalPaid / chit.monthlyContribution)
      : 0;
    const nextMonth = paidMonths + 1;
    setPaymentForm({
      month: String(nextMonth),
      amount: chit ? String(chit.monthlyContribution) : '',
      paymentMethod: 'cash',
      notes: '',
    });
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMember) return;
    const { month, amount, paymentMethod, notes } = paymentForm;
    if (!month || !amount) { toast.error('Please fill month and amount'); return; }
    try {
      setIsRecordingPayment(true);
      await paymentAPI.create({
        memberId: paymentMember._id,
        chitGroupId: id!,
        month: Number(month),
        amount: Number(amount),
        paymentMethod: paymentMethod as any,
        receivedBy: user?.name || 'Admin',
        notes,
      } as any);
      toast.success(`Payment recorded for ${paymentMember.name} — Month ${month}`);
      setPaymentMember(null);
      fetchChitDetails(id!);
    } catch (err: any) {
      const data = err?.response?.data;
      toast.error(data?.message || data?.errors?.[0]?.msg || 'Failed to record payment');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const openPayoutModal = (member: Member) => {
    setPayoutMember(member);
    setPayoutMonth('');
  };

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutMember) return;
    const month = Number(payoutMonth);
    if (!payoutMonth || month < 1) { toast.error('Enter a valid month number'); return; }
    try {
      setIsRecording(true);
      await memberAPI.recordWithdrawal(payoutMember._id, month);
      toast.success(`Payout recorded for ${payoutMember.name} — Month ${month}`);
      setPayoutMember(null);
      fetchChitDetails(id!);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record payout');
    } finally {
      setIsRecording(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (!chit) {
    return (
      <div className="card p-12 text-center text-gray-500">
        <p>Chit group not found.</p>
        <Link to="/chits" className="text-primary-600 hover:underline mt-2 inline-block">Back to Chits</Link>
      </div>
    );
  }

  const ordinal = (n: number) =>
    `${n}${n === 1 || n === 21 ? 'st' : n === 2 || n === 22 ? 'nd' : n === 3 || n === 23 ? 'rd' : 'th'}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/chits" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{chit.name}</h1>
          <p className="text-gray-600 mt-1 capitalize">{chit.status}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 bg-blue-50">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Monthly</p>
              <p className="text-lg font-bold text-gray-900">₹{chit.monthlyContribution.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card p-5 bg-green-50">
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Members</p>
              <p className="text-lg font-bold text-gray-900">{members.length} / {chit.totalMembers}</p>
            </div>
          </div>
        </div>
        <div className="card p-5 bg-purple-50">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-purple-600 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Duration</p>
              <p className="text-lg font-bold text-gray-900">{chit.duration} months</p>
            </div>
          </div>
        </div>
        <div className="card p-5 bg-orange-50">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-orange-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Collection Date</p>
              <p className="text-lg font-bold text-gray-900">
                {chit.collectionDay ? ordinal(chit.collectionDay) : '—'}
              </p>
              <p className="text-xs text-gray-400">of every month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Members table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Members</h2>
          <button onClick={() => setShowAddMember(true)} className="btn-primary flex items-center space-x-2 text-sm">
            <UserPlus className="h-4 w-4" />
            <span>Add Member</span>
          </button>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No members yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "Add Member" to enroll members in this chit group.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">#</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Months Paid</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Total Paid</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Payout</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Sheet</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700"></th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, idx) => {
                  const paidMonths = chit.monthlyContribution > 0
                    ? Math.floor(member.totalPaid / chit.monthlyContribution)
                    : 0;
                  return (
                    <tr key={member._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openPaymentModal(member)}
                            className="text-primary-600 hover:text-primary-800 font-medium hover:underline text-left"
                          >
                            {member.name}
                          </button>
                          <Link to={`/members/${member._id}`} title="View details">
                            <ExternalLink className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                          </Link>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{member.phone}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-gray-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          {paidMonths} / {chit.duration}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">₹{member.totalPaid.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        {member.withdrawMonth ? (
                          <span className="inline-flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                            <IndianRupee className="h-3 w-3" />
                            <span>Month {member.withdrawMonth}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => openSheet(member)}
                          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium"
                          title="View payment sheet"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        {member.isActive && !member.withdrawMonth && (
                          <button
                            onClick={() => openPayoutModal(member)}
                            className="text-xs text-gray-400 hover:text-primary-600 font-medium whitespace-nowrap"
                          >
                            Record Payout
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Payment Sheet Modal ── */}
      {sheetMember && chit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">

            {/* ── Sheet Header ── */}
            <div className="shrink-0 bg-[#0c1a2e] rounded-t-2xl px-8 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#0ea5e9] text-xs font-semibold tracking-widest uppercase mb-1">Chitti Management System</p>
                  <h2 className="text-white text-xl font-bold">Payment Ledger</h2>
                  <p className="text-slate-400 text-xs mt-0.5">{chit.name}</p>
                </div>
                <button
                  onClick={() => setSheetMember(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 mt-0.5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Member info strip */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                {[
                  { label: 'Member Name', value: sheetMember.name },
                  { label: 'Phone', value: sheetMember.phone },
                  { label: 'Monthly Contribution', value: `₹${chit.monthlyContribution.toLocaleString('en-IN')}` },
                ].map(item => (
                  <div key={item.label} className="bg-white/8 rounded-lg px-3 py-2 border border-white/10">
                    <p className="text-slate-400 text-[10px] uppercase tracking-wide">{item.label}</p>
                    <p className="text-white text-sm font-semibold mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Sheet Body ── */}
            <div className="overflow-y-auto flex-1">
              {isLoadingSheet ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="animate-spin h-7 w-7 text-primary-600" />
                </div>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-sky-600 text-white">
                      {['Month', 'Date', 'Amount (₹)', 'Method', 'Receipt No.', 'Admin Signature'].map(h => (
                        <th key={h} className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: chit.duration }, (_, i) => i + 1).map(month => {
                      const payment = sheetPayments.find(p => p.month === month);
                      const isPaid = !!payment;
                      return (
                        <tr
                          key={month}
                          className={`border-b border-gray-100 ${isPaid ? 'bg-white' : 'bg-gray-50/60'}`}
                        >
                          {/* Month */}
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 font-semibold text-xs px-2.5 py-1 rounded-full ${
                              isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {isPaid && <CheckCircle2 className="h-3 w-3" />}
                              Month {month}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 text-gray-600 text-xs">
                            {isPaid
                              ? new Date(payment!.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                              : <span className="text-gray-300">—</span>}
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-4">
                            {isPaid
                              ? <span className="font-bold text-gray-900">₹{payment!.amount.toLocaleString('en-IN')}</span>
                              : <span className="text-gray-300 text-xs">Pending</span>}
                          </td>

                          {/* Method */}
                          <td className="py-3 px-4 text-gray-500 text-xs capitalize">
                            {isPaid ? payment!.paymentMethod?.replace(/_/g, ' ') : <span className="text-gray-300">—</span>}
                          </td>

                          {/* Receipt No. */}
                          <td className="py-3 px-4">
                            {isPaid
                              ? <span className="font-mono text-xs text-gray-600">{payment!.receiptNumber}</span>
                              : <span className="text-gray-300 text-xs">—</span>}
                          </td>

                          {/* Admin Signature */}
                          <td className="py-3 px-4">
                            {isPaid ? (
                              sheetAdminSig ? (
                                <img
                                  src={sheetAdminSig}
                                  alt="Admin signature"
                                  className="h-8 max-w-[120px] object-contain"
                                />
                              ) : (
                                <span className="text-xs text-gray-400 italic">No signature uploaded</span>
                              )
                            ) : (
                              <span className="text-gray-200 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Summary footer */}
                  <tfoot>
                    <tr className="bg-[#0c1a2e]">
                      <td colSpan={2} className="py-3 px-4 text-white font-bold text-xs uppercase tracking-wide">
                        Total
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-bold text-sm">
                        ₹{sheetMember.totalPaid.toLocaleString('en-IN')}
                      </td>
                      <td colSpan={3} className="py-3 px-4 text-slate-400 text-xs">
                        {Math.floor(sheetMember.totalPaid / (chit.monthlyContribution || 1))} of {chit.duration} months paid
                        &nbsp;·&nbsp;
                        Remaining ₹{Math.max(0, chit.monthlyContribution * chit.duration - sheetMember.totalPaid).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Record Payment Modal ── */}
      {paymentMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center">
                  <IndianRupee className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Record Payment</h2>
                  <p className="text-xs text-gray-400">{paymentMember.name} · {paymentMember.phone}</p>
                </div>
              </div>
              <button onClick={() => setPaymentMember(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Month <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder={`1 – ${chit.duration}`}
                    min={1}
                    max={chit.duration}
                    value={paymentForm.month}
                    onChange={e => setPaymentForm(p => ({ ...p, month: e.target.value }))}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    className="input-field"
                    min={1}
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  className="input-field"
                  value={paymentForm.paymentMethod}
                  onChange={e => setPaymentForm(p => ({ ...p, paymentMethod: e.target.value }))}
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Paid via Google Pay"
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Months paid so far</span>
                  <span className="font-medium">
                    {chit.monthlyContribution > 0 ? Math.floor(paymentMember.totalPaid / chit.monthlyContribution) : 0} / {chit.duration}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total paid so far</span>
                  <span className="font-medium">₹{paymentMember.totalPaid.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setPaymentMember(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={isRecordingPayment} className="btn-primary flex-1 flex items-center justify-center space-x-2">
                  {isRecordingPayment ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>{isRecordingPayment ? 'Saving...' : 'Save Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Member Modal ── */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Add Member</h2>
              </div>
              <button onClick={() => setShowAddMember(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Ramesh Kumar"
                  value={memberForm.name}
                  onChange={e => setMemberForm(p => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="10-digit number"
                  maxLength={10}
                  value={memberForm.phone}
                  onChange={e => setMemberForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                />
                <p className="text-xs text-gray-400 mt-0.5">WhatsApp reminders will be sent to this number</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddMember(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={isAdding} className="btn-primary flex-1 flex items-center justify-center space-x-2">
                  {isAdding ? <Loader2 className="animate-spin h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  <span>{isAdding ? 'Adding...' : 'Add Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Record Payout Modal ── */}
      {payoutMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                  <IndianRupee className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Record Payout</h2>
                  <p className="text-xs text-gray-400">{payoutMember.name}</p>
                </div>
              </div>
              <button onClick={() => setPayoutMember(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleRecordPayout} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month of Withdrawal</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder={`1 – ${chit.duration}`}
                  min={1}
                  max={chit.duration}
                  value={payoutMonth}
                  onChange={e => setPayoutMonth(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">Which month did this member receive the chit payout?</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPayoutMember(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={isRecording} className="btn-primary flex-1 flex items-center justify-center space-x-2">
                  {isRecording ? <Loader2 className="animate-spin h-4 w-4" /> : <IndianRupee className="h-4 w-4" />}
                  <span>{isRecording ? 'Saving...' : 'Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChitDetails;
