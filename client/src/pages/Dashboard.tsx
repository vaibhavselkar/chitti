import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Users,
  DollarSign,
  Calendar,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { chitAPI, memberAPI } from '../services/api';
import { ChitGroup } from '../types';
import NewChitModal from '../components/NewChitModal';

interface Stats {
  totalChits: number;
  totalMembers: number;
  totalCollected: number;
  pendingPayments: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ totalChits: 0, totalMembers: 0, totalCollected: 0, pendingPayments: 0 });
  const [recentChits, setRecentChits] = useState<ChitGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewChit, setShowNewChit] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [chitsRes, membersRes] = await Promise.all([
        chitAPI.getAll(),
        memberAPI.getAll({ limit: 1 } as any),
      ]);

      const chits: any[] = chitsRes.data.data?.chitGroups || [];
      const totalMembers = membersRes.data.data?.pagination?.totalMembers || 0;
      const totalCollected = chits.reduce((sum: number, c: any) => sum + (c.totalCollected || 0), 0);

      const pendingPayments = 0;

      setStats({
        totalChits: chits.length,
        totalMembers,
        totalCollected,
        pendingPayments,
      });
      setRecentChits(chits.slice(0, 3));
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChitCreated = (chit: ChitGroup) => {
    setRecentChits(prev => [chit, ...prev].slice(0, 3));
    setStats(prev => ({ ...prev, totalChits: prev.totalChits + 1 }));
  };

  const statCards = [
    { title: 'Total Chits', value: stats.totalChits, icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-50', onClick: () => navigate('/chits') },
    { title: 'Total Members', value: stats.totalMembers, icon: Users, color: 'text-green-600', bg: 'bg-green-50', onClick: () => navigate('/members') },
    { title: 'Total Collected', value: `₹${stats.totalCollected.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50', onClick: () => navigate('/payments') },
    { title: 'Pending Payments', value: stats.pendingPayments, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', onClick: () => navigate('/payments') },
  ];

  const statusColor = (status: string) => {
    if (status === 'active') return 'bg-green-100 text-green-700';
    if (status === 'completed') return 'bg-blue-100 text-blue-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1 text-sm">Overview of your chit fund operations.</p>
          </div>
          <button
            onClick={() => setShowNewChit(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Chit</span>
          </button>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {statCards.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.title}
                  onClick={s.onClick}
                  className={`card p-5 text-left hover:shadow-md transition-all hover:-translate-y-0.5 ${s.bg}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-white/60 ${s.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Recent Chit Groups + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Chits */}
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Recent Chit Groups</h3>
              <button onClick={() => navigate('/chits')} className="text-xs text-primary-600 hover:text-primary-700 flex items-center space-x-1">
                <span>View all</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {recentChits.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No chit groups yet.</p>
                <button
                  onClick={() => setShowNewChit(true)}
                  className="mt-3 text-sm text-primary-600 hover:underline"
                >
                  Create your first chit →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentChits.map((chit: any) => (
                  <button
                    key={chit._id}
                    onClick={() => navigate(`/chits/${chit._id}`)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-primary-50 hover:border-primary-100 border border-transparent transition-all text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{chit.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        ₹{chit.monthlyContribution?.toLocaleString('en-IN')}/mo · {chit.duration} months · {chit.memberCount || 0} members
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(chit.status)}`}>
                        {chit.status}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Create New Chit', icon: Plus, action: () => setShowNewChit(true), primary: true },
                { label: 'Add Member', icon: Users, action: () => navigate('/members') },
                { label: 'Record Payment', icon: DollarSign, action: () => navigate('/payments') },
                { label: 'View Reports', icon: TrendingUp, action: () => navigate('/reports') },
                { label: 'Send Notifications', icon: AlertTriangle, action: () => navigate('/notifications') },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                      item.primary
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showNewChit && (
        <NewChitModal
          onClose={() => setShowNewChit(false)}
          onCreated={handleChitCreated}
        />
      )}
    </>
  );
};

export default Dashboard;
