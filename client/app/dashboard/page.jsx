'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import moment from 'moment';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyState from '@/components/EmptyState';

export default function DashboardPage() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { isAuthenticated, user } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authenticated) {
      fetchMyEvents();
    }
  }, [authenticated]);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getMyEvents();
      setEvents(response.data.events || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load events');
    } finally {
      setLoading(false);
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
                  <EventCard key={event._id} event={event} />
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
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }) {
  const eventDate = moment(event.dateTime);
  const ticketsSold = event.ticketsSold || 0;
  const revenue = (event.revenue || 0).toFixed(2);

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Event Info */}
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
          {ticketsSold > 0 && !event.hasWithdrawn && (
            <button
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              onClick={() => alert('Withdraw functionality coming in 4.12!')}
            >
              Withdraw
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

