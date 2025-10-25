'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import moment from 'moment';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { apiClient } from '@/lib/api';
import { withdrawRevenueOnChain } from '@/lib/contracts';
import { useAuthStore } from '@/store/authStore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyState from '@/components/EmptyState';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { isAuthenticated, user } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [checkingGoogle, setCheckingGoogle] = useState(true);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (authenticated) {
      fetchMyEvents();
      checkGoogleConnection();
      
      // Check for success/error query params
      if (searchParams.get('google_connected') === 'true') {
        setSuccessMessage('Google Calendar connected successfully!');
        // Clear the query param
        router.replace('/dashboard');
      }
      if (searchParams.get('google_error') === 'true') {
        setError('Failed to connect Google Calendar. Please try again.');
        // Clear the query param
        router.replace('/dashboard');
      }
    }
  }, [authenticated, searchParams]);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getMyEvents();
      setEvents(response.data.data?.events || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const checkGoogleConnection = async () => {
    try {
      setCheckingGoogle(true);
      const response = await apiClient.isGoogleCalendarConnected();
      setIsGoogleConnected(response.data.data.isConnected || false);
    } catch (err) {
      console.error('Failed to check Google Calendar connection:', err);
      setIsGoogleConnected(false);
    } finally {
      setCheckingGoogle(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setConnectingGoogle(true);
      setError(null);
      const response = await apiClient.connectGoogle();
      
      // Backend returns: { success: true, isAlreadyConnected: true, authUrl: "..." }
      if (response.data.isAlreadyConnected) {
        setSuccessMessage('Google Calendar is already connected!');
        setIsGoogleConnected(true);
        setConnectingGoogle(false);
        return;
      }
      
      // Redirect to Google OAuth
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to connect Google Calendar');
      setConnectingGoogle(false);
    }
  };

  if (!ready) {
    return (
      <div className="container py-12">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="container py-12">
        <EmptyState
          icon="inbox"
          title="Connect Wallet"
          description="Please connect your wallet to view your dashboard"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-12">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  const upcomingEvents = events.filter(e => moment(e.dateTime).isAfter(moment()));
  const pastEvents = events.filter(e => moment(e.dateTime).isBefore(moment()));

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Events</h1>
        <p className="text-muted-foreground">
          Manage your events and track revenue
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <p className="text-sm text-green-800">
                <strong>{successMessage}</strong>
              </p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-600 hover:text-green-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Google Calendar Connection Banner */}
      {!checkingGoogle && !isGoogleConnected && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-1">
                📅 Connect Google Calendar
              </h3>
              <p className="text-sm text-yellow-800">
                Connect your Google account to automatically create calendar events and add attendees when they purchase tickets. This is required to create events.
              </p>
            </div>
            <button
              onClick={handleConnectGoogle}
              disabled={connectingGoogle}
              className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-6 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
            >
              {connectingGoogle ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Connecting...</span>
                </>
              ) : (
                'Connect Google Calendar'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Google Calendar Connected Success */}
      {!checkingGoogle && isGoogleConnected && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <p className="text-sm text-green-800">
              <strong>Google Calendar connected.</strong> Attendees will automatically be added to your calendar events when they purchase tickets.
            </p>
          </div>
        </div>
      )}

      {/* Create Event Button */}
      <div className="mb-8">
        <Link
          href="/events/create"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Create New Event
        </Link>
      </div>

      {/* Error */}
      {error && (
        <ErrorMessage message={error} onRetry={fetchMyEvents} />
      )}

      {/* Empty State */}
      {!error && events.length === 0 && (
        <EmptyState
          icon="calendar"
          title="No events yet"
          description="Create your first event to start selling tickets"
          actionLabel="Create Event"
          actionHref="/events/create"
        />
      )}

      {/* Events List */}
      {!error && events.length > 0 && (
        <div className="space-y-8">
          {/* Upcoming */}
          {upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
              <div className="grid gap-4">
                {upcomingEvents.map((event) => (
                  <EventCard 
                    key={event._id} 
                    event={event}
                    onWithdrawSuccess={fetchMyEvents}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Past Events</h2>
              <div className="grid gap-4">
                {pastEvents.map((event) => (
                  <EventCard 
                    key={event._id} 
                    event={event}
                    onWithdrawSuccess={fetchMyEvents}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, onWithdrawSuccess }) {
  const eventDate = moment(event.dateTime);
  const ticketsSold = event.ticketsSold || 0;
  const revenue = (event.revenue || 0).toFixed(2);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const handleWithdraw = async () => {
    if (!event.contractEventId) {
      setWithdrawError('Event not confirmed on blockchain');
      return;
    }

    setWithdrawing(true);
    setWithdrawError('');
    setWithdrawSuccess(false);

    try {
      // Call blockchain to withdraw revenue
      const { txHash, amount } = await withdrawRevenueOnChain(event.contractEventId);
      
      console.log('✅ Revenue withdrawn:', { txHash, amount });
      setWithdrawSuccess(true);
      
      // Show success message
      setTimeout(() => {
        if (onWithdrawSuccess) {
          onWithdrawSuccess();
        }
      }, 2000);
    } catch (err) {
      console.error('Withdraw error:', err);
      setWithdrawError(err.message || 'Failed to withdraw revenue');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex flex-col gap-4">
        {/* Event Info */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-lg">{event.title}</h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>{eventDate.format('MMM D, YYYY @ h:mm A')}</span>
              <span>•</span>
              <span>{ticketsSold} / {event.maxAttendees} tickets sold</span>
              <span>•</span>
              <span className="font-semibold text-primary">{revenue} PYUSD revenue</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href={`/events/${event._id}`}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              View
            </Link>
            {ticketsSold > 0 && !event.hasWithdrawn && !withdrawSuccess && (
              <button
                className="inline-flex h-9 items-center justify-center rounded-md bg-green-600 px-4 text-sm font-medium text-white shadow transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
                onClick={handleWithdraw}
                disabled={withdrawing}
              >
                {withdrawing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Withdrawing...</span>
                  </>
                ) : (
                  <>
                    <span>💰</span>
                    <span>Withdraw {revenue} PYUSD</span>
                  </>
                )}
              </button>
            )}
            {(event.hasWithdrawn || withdrawSuccess) && (
              <div className="inline-flex h-9 items-center justify-center rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-600">
                ✓ Withdrawn
              </div>
            )}
          </div>
        </div>

        {/* Withdraw Error */}
        {withdrawError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-800">{withdrawError}</p>
          </div>
        )}

        {/* Withdraw Success */}
        {withdrawSuccess && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <p className="text-sm text-green-800">
                <strong>Revenue withdrawn successfully!</strong> Check your wallet for {revenue} PYUSD (minus 2.5% platform fee).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

