'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import moment from 'moment';
import { apiClient } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyState from '@/components/EmptyState';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getEvents({ upcoming: true });
      setEvents(response.data.events || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(search.toLowerCase()) ||
    event.description.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container py-12">
        <LoadingSpinner size="lg" text="Loading events..." />
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Events</h1>
        <p className="text-muted-foreground">
          Discover and attend amazing online events
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-w-md"
        />
      </div>

      {/* Error */}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={fetchEvents}
        />
      )}

      {/* Events Grid */}
      {!error && filteredEvents.length === 0 && (
        <EmptyState
          icon="calendar"
          title="No events found"
          description="There are no upcoming events at the moment. Check back later or create your own!"
          actionLabel="Create Event"
          actionHref="/events/create"
        />
      )}

      {!error && filteredEvents.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }) {
  const eventDate = moment(event.dateTime);
  const spotsRemaining = event.maxAttendees - (event.ticketsSold || 0);

  return (
    <Link href={`/events/${event._id}`} className="block">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
        {/* Image */}
        {event.imageUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-secondary">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        
        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">{event.title}</h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {event.description}
          </p>
          
          {/* Meta */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
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
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>{eventDate.format('MMM D, YYYY @ h:mm A')}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-semibold text-primary">{event.price} PYUSD</span>
              <span className="text-muted-foreground">
                {spotsRemaining} {spotsRemaining === 1 ? 'spot' : 'spots'} left
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

