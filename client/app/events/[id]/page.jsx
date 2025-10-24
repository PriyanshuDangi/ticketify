'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import moment from 'moment';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (params.id) {
      fetchEvent();
    }
  }, [params.id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getEvent(params.id);
      setEvent(response.data.data?.event);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyTicket = () => {
    if (!isAuthenticated) {
      alert('Please connect your wallet first');
      return;
    }
    // Will implement purchase modal in step 4.7
    alert('Purchase modal coming soon!');
  };

  if (loading) {
    return (
      <div className="container py-12">
        <LoadingSpinner size="lg" text="Loading event..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <ErrorMessage message={error} onRetry={fetchEvent} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-12">
        <p>Event not found</p>
      </div>
    );
  }

  const eventDate = moment(event.dateTime);
  const spotsRemaining = event.maxAttendees - (event.ticketsSold || 0);
  const isSoldOut = spotsRemaining <= 0;
  const hasStarted = eventDate.isBefore(moment());

  return (
    <div className="container py-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
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
        >
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        Back to events
      </button>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          {event.imageUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-secondary">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Title and description */}
          <div>
            <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {event.description}
            </p>
          </div>

          {/* Organizer */}
          <div className="border-t pt-6">
            <h2 className="font-semibold mb-2">Hosted by</h2>
            <p className="text-sm text-muted-foreground">{event.owner?.name || 'Unknown'}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            {/* Event details card */}
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <div>
                <div className="text-3xl font-bold text-primary mb-1">
                  {event.price} PYUSD
                </div>
                <div className="text-sm text-muted-foreground">
                  per ticket
                </div>
              </div>

              <div className="space-y-3 text-sm border-t pt-4">
                <div className="flex items-start gap-3">
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
                    className="mt-0.5 flex-shrink-0"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <div>
                    <div className="font-medium">{eventDate.format('MMMM D, YYYY')}</div>
                    <div className="text-muted-foreground">{eventDate.format('h:mm A')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
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
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{event.duration} minutes</span>
                </div>

                <div className="flex items-center gap-3">
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
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>
                    {spotsRemaining} of {event.maxAttendees} spots remaining
                  </span>
                </div>

                {event.googleMeetLink && (
                  <div className="flex items-center gap-3 text-green-600">
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
                      <path d="m22 8-6 4 6 4V8Z"></path>
                      <rect x="2" y="6" width="14" height="12" rx="2" ry="2"></rect>
                    </svg>
                    <span>Google Meet included</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleBuyTicket}
                disabled={isSoldOut || hasStarted}
                className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                {isSoldOut ? 'Sold Out' : hasStarted ? 'Event Started' : 'Buy Ticket'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

