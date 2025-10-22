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

export default function MyTicketsPage() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { isAuthenticated } = useAuthStore();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authenticated) {
      fetchMyTickets();
    }
  }, [authenticated]);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getMyTickets();
      setTickets(response.data.tickets || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load tickets');
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
          icon="ticket"
          title="Connect Wallet"
          description="Please connect your wallet to view your tickets"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-12">
        <LoadingSpinner size="lg" text="Loading tickets..." />
      </div>
    );
  }

  const upcomingTickets = tickets.filter(t => 
    moment(t.event?.dateTime).isAfter(moment())
  );
  const pastTickets = tickets.filter(t => 
    moment(t.event?.dateTime).isBefore(moment())
  );

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Tickets</h1>
        <p className="text-muted-foreground">
          View and manage your purchased tickets
        </p>
      </div>

      {/* Error */}
      {error && (
        <ErrorMessage message={error} onRetry={fetchMyTickets} />
      )}

      {/* Empty State */}
      {!error && tickets.length === 0 && (
        <EmptyState
          icon="ticket"
          title="No tickets yet"
          description="You haven't purchased any tickets. Browse events to get started!"
          actionLabel="Browse Events"
          actionHref="/events"
        />
      )}

      {/* Tickets List */}
      {!error && tickets.length > 0 && (
        <div className="space-y-8">
          {/* Upcoming */}
          {upcomingTickets.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {upcomingTickets.map((ticket) => (
                  <TicketCard key={ticket._id} ticket={ticket} />
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {pastTickets.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Past Events</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {pastTickets.map((ticket) => (
                  <TicketCard key={ticket._id} ticket={ticket} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TicketCard({ ticket }) {
  const event = ticket.event;
  if (!event) return null;

  const eventDate = moment(event.dateTime);
  const timeUntil = eventDate.fromNow();
  const isPast = eventDate.isBefore(moment());

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Image */}
      {event.imageUrl && (
        <div className="aspect-video w-full bg-secondary overflow-hidden">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
          <p className="text-sm text-muted-foreground">
            {eventDate.format('MMMM D, YYYY @ h:mm A')}
          </p>
          {!isPast && (
            <p className="text-sm text-primary mt-1">{timeUntil}</p>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-sm">
          <div className={`h-2 w-2 rounded-full ${
            ticket.status === 'calendar_added' ? 'bg-green-500' : 
            ticket.status === 'blockchain_added' ? 'bg-yellow-500' : 
            'bg-gray-500'
          }`}></div>
          <span className="capitalize">{ticket.status.replace('_', ' ')}</span>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {event.googleMeetLink && ticket.status === 'calendar_added' && (
            <a
              href={event.googleMeetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-green-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="m22 8-6 4 6 4V8Z"></path>
                <rect x="2" y="6" width="14" height="12" rx="2" ry="2"></rect>
              </svg>
              Join Meeting
            </a>
          )}
          
          <Link
            href={`/events/${event._id}`}
            className="w-full inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            View Event Details
          </Link>
        </div>
      </div>
    </div>
  );
}

