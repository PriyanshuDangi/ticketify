'use client';

import { useState, useEffect } from 'react';
import moment from 'moment';
import { apiClient } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

export default function TicketPurchasersTable({ eventId }) {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1
  });
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    if (eventId) {
      fetchTickets();
    }
  }, [eventId, pagination.page, selectedStatus]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }
      
      const response = await apiClient.getEventTickets(eventId, params);
      const data = response.data.data;
      
      setTickets(data.tickets || []);
      setStats(data.stats || {});
      setPagination(data.pagination || pagination);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      created: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      blockchain_added: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      calendar_added: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    };

    const statusLabels = {
      created: 'Pending',
      blockchain_added: 'Confirmed',
      calendar_added: 'Complete'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="py-8">
        <LoadingSpinner text="Loading ticket purchasers..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4">
        <ErrorMessage message={error} onRetry={fetchTickets} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Ticket Purchasers</h2>
        <p className="text-sm text-muted-foreground mb-4">
          View all attendees who purchased tickets for this event
        </p>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">{stats.total || 0}</div>
              <div className="text-xs text-muted-foreground">Total Tickets</div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{stats.calendar_added || 0}</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.blockchain_added || 0}</div>
              <div className="text-xs text-muted-foreground">Confirmed</div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.created || 0}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
          </div>
        )}

        {/* Filter by status */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusChange('all')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              selectedStatus === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            All ({stats?.total || 0})
          </button>
          <button
            onClick={() => handleStatusChange('calendar_added')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              selectedStatus === 'calendar_added'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Complete ({stats?.calendar_added || 0})
          </button>
          <button
            onClick={() => handleStatusChange('blockchain_added')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              selectedStatus === 'blockchain_added'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Confirmed ({stats?.blockchain_added || 0})
          </button>
          <button
            onClick={() => handleStatusChange('created')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              selectedStatus === 'created'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Pending ({stats?.created || 0})
          </button>
        </div>
      </div>

      {/* Tickets table */}
      {tickets.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-12 w-12 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
            />
          </svg>
          <p className="mt-4 text-sm text-muted-foreground">
            No tickets purchased yet
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Buyer Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Wallet Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Purchase Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Transaction
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {ticket.buyerEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      <a
                        href={`https://etherscan.io/address/${ticket.buyerWalletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {truncateAddress(ticket.buyerWalletAddress)}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {ticket.priceAtPurchase} PYUSD
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {moment(ticket.createdAt).format('MMM D, YYYY h:mm A')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {ticket.transactionHash ? (
                        <a
                          href={`https://etherscan.io/tx/${ticket.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-mono"
                        >
                          {truncateAddress(ticket.transactionHash)}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 bg-secondary border-t flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} tickets
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm rounded-md bg-card border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 text-sm rounded-md bg-card border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

