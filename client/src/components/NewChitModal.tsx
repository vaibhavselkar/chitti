import React, { useState } from 'react';
import { X, Loader2, Calendar, DollarSign, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { chitAPI } from '../services/api';
import { ChitGroup } from '../types';

interface Props {
  onClose: () => void;
  onCreated: (chit: ChitGroup) => void;
}

const NewChitModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: '',
    monthlyContribution: '',
    duration: '',
    totalMembers: '',
    collectionDay: '10',
    startDate: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, monthlyContribution, duration, totalMembers, collectionDay, startDate } = form;

    if (!name || !monthlyContribution || !duration || !totalMembers || !startDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const day = Number(collectionDay);
    if (day < 1 || day > 28) {
      toast.error('Collection day must be between 1 and 28');
      return;
    }

    try {
      setIsLoading(true);
      console.log('[NewChit] collectionDay being sent:', day);
      const response = await chitAPI.create({
        name,
        monthlyContribution: Number(monthlyContribution),
        duration: Number(duration),
        totalMembers: Number(totalMembers),
        collectionDay: day,
        startDate: new Date(startDate),
        status: 'active',
        totalCollected: 0,
        totalPayouts: 0,
        payoutSchedule: [],
        endDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      if (response.data.success && response.data.data) {
        toast.success('Chit group created successfully!');
        onCreated(response.data.data.chitGroup);
        onClose();
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to create chit group';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create New Chit Group</h2>
            <p className="text-xs text-gray-500 mt-0.5">Fill in the details to start a new chit fund</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chit Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. One Lakh Chit Fund"
              value={form.name}
              onChange={set('name')}
            />
          </div>

          {/* Monthly Contribution + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Amount (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="100"
                  className="input-field pl-9"
                  placeholder="5000"
                  value={form.monthlyContribution}
                  onChange={set('monthlyContribution')}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (months) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  className="input-field pl-9"
                  placeholder="12"
                  value={form.duration}
                  onChange={set('duration')}
                />
              </div>
            </div>
          </div>

          {/* Total Members + Collection Day */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Members <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="2"
                  className="input-field pl-9"
                  placeholder="20"
                  value={form.totalMembers}
                  onChange={set('totalMembers')}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection Date <span className="text-red-500">*</span>
              </label>
              <select
                className="input-field"
                value={form.collectionDay}
                onChange={e => setForm(prev => ({ ...prev, collectionDay: e.target.value }))}
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={String(d)}>
                    {d}{d === 1 || d === 21 ? 'st' : d === 2 || d === 22 ? 'nd' : d === 3 || d === 23 ? 'rd' : 'th'} of every month
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="input-field"
              value={form.startDate}
              onChange={set('startDate')}
            />
          </div>

          {/* Summary */}
          {form.monthlyContribution && form.totalMembers && form.duration && (
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 text-sm">
              <p className="font-medium text-primary-700 mb-1">Summary</p>
              <div className="text-primary-600 space-y-0.5 text-xs">
                <p>Monthly collection: ₹{(Number(form.monthlyContribution) * Number(form.totalMembers)).toLocaleString('en-IN')}</p>
                <p>Total fund value: ₹{(Number(form.monthlyContribution) * Number(form.totalMembers) * Number(form.duration)).toLocaleString('en-IN')}</p>
                <p>Collection date: {form.collectionDay ? (() => { const d = Number(form.collectionDay); return `${d}${d===1||d===21?'st':d===2||d===22?'nd':d===3||d===23?'rd':'th'} of every month`; })() : '—'}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="flex-1 btn-primary flex items-center justify-center space-x-2">
              {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : null}
              <span>{isLoading ? 'Creating...' : 'Create Chit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewChitModal;
