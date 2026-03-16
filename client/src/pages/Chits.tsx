import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, Search, Calendar, Users, DollarSign, Loader2 } from 'lucide-react';
import { chitAPI } from '../services/api';
import { ChitGroup } from '../types';
import NewChitModal from '../components/NewChitModal';

const Chits: React.FC = () => {
  const [chits, setChits] = useState<ChitGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchChits();
  }, []);

  const fetchChits = async () => {
    try {
      setIsLoading(true);
      const response = await chitAPI.getAll({ search });
      if (response.data.success && response.data.data) {
        setChits(response.data.data.chitGroups);
      }
    } catch (error) {
      toast.error('Failed to load chit groups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchChits();
  };

  const ordinal = (n: number) => {
    if (n === 1 || n === 21) return `${n}st`;
    if (n === 2 || n === 22) return `${n}nd`;
    if (n === 3 || n === 23) return `${n}rd`;
    return `${n}th`;
  };

  const statusColor = (status: ChitGroup['status']) => {
    if (status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'completed') return 'bg-blue-100 text-blue-800';
    return 'bg-red-100 text-red-800';
  };

  const handleChitCreated = (_chit: ChitGroup) => {
    // Reload from server to ensure all fields (including collectionDay) are fresh
    fetchChits();
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chit Groups</h1>
          <p className="text-gray-600 mt-1">Manage all your chit fund groups.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Chit</span>
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            className="input-field pl-9"
            placeholder="Search chit groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
        </div>
      ) : chits.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No chit groups found</p>
          <p className="text-sm mt-1">Create your first chit group to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chits.map((chit) => (
            <Link key={chit._id} to={`/chits/${chit._id}`} className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{chit.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(chit.status)}`}>
                  {chit.status}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>₹{chit.monthlyContribution.toLocaleString('en-IN')} / month</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>{chit.totalMembers} members</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{chit.duration} months</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Collection on {chit.collectionDay ? ordinal(chit.collectionDay) : '—'} of month</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
    {showModal && (
      <NewChitModal onClose={() => setShowModal(false)} onCreated={handleChitCreated} />
    )}
    </>
  );
};

export default Chits;
