'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api';
import { createEventOnChain, setWalletProvider } from '@/lib/contracts';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function CreateEventPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { user } = useAuthStore();
  
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Date/Time, 3: Pricing, 4: Review
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingGoogle, setCheckingGoogle] = useState(true);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null,
    imagePreview: null,
    dateTime: '',
    duration: 60,
    price: '',
    maxAttendees: 50,
  });

  // Redirect if not authenticated with wallet
  useEffect(() => {
    if (ready && !authenticated) {
      setError('Please connect your wallet to create events');
      setTimeout(() => router.push('/'), 2000);
    }
  }, [ready, authenticated, router]);

  // Set up the wallet provider when wallets are available
  useEffect(() => {
    const setupWalletProvider = async () => {
      if (wallets.length > 0) {
        // Use the first wallet - Privy orders them with the active wallet first
        const activeWallet = wallets[0];
        
        // Get the EIP-1193 provider from the wallet
        const provider = await activeWallet.getEthereumProvider();
        setWalletProvider(provider);
      }
    };
    
    setupWalletProvider();
  }, [wallets]);

  // Check Google Calendar connection
  useEffect(() => {
    const checkGoogleConnection = async () => {
      if (authenticated) {
        try {
          setCheckingGoogle(true);
          const response = await apiClient.isGoogleCalendarConnected();
          // Backend returns: { success: true, data: { isConnected: true } }
          setIsGoogleConnected(response.data.data.isConnected || false);
        } catch (err) {
          console.error('Failed to check Google Calendar connection:', err);
          setIsGoogleConnected(false);
        } finally {
          setCheckingGoogle(false);
        }
      }
    };
    checkGoogleConnection();
  }, [authenticated]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (8MB limit)
    if (file.size > 8 * 1024 * 1024) {
      setError('Image size must be less than 8MB');
      return;
    }

    // Check file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Image must be JPEG, PNG, or WebP');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: reader.result
      }));
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.title || formData.title.length < 3) {
      setError('Title must be at least 3 characters');
      return false;
    }
    if (!formData.description || formData.description.length < 10) {
      setError('Description must be at least 10 characters');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.dateTime) {
      setError('Please select event date and time');
      return false;
    }
    
    const eventDate = moment(formData.dateTime);
    if (!eventDate.isValid() || eventDate.isBefore(moment())) {
      setError('Event date must be in the future');
      return false;
    }

    if (formData.duration < 15 || formData.duration > 1440) {
      setError('Duration must be between 15 minutes and 24 hours');
      return false;
    }
    
    return true;
  };

  const validateStep3 = () => {
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      setError('Price must be greater than 0');
      return false;
    }
    
    // Check max 2 decimal places
    if (!/^\d+(\.\d{1,2})?$/.test(formData.price)) {
      setError('Price can have maximum 2 decimal places');
      return false;
    }

    const maxAttendees = parseInt(formData.maxAttendees);
    if (isNaN(maxAttendees) || maxAttendees < 1 || maxAttendees > 10000) {
      setError('Max attendees must be between 1 and 10,000');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    let isValid = false;
    
    if (step === 1) isValid = validateStep1();
    if (step === 2) isValid = validateStep2();
    if (step === 3) isValid = validateStep3();
    
    if (isValid) {
      setStep(prev => prev + 1);
      setError('');
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    
    setLoading(true);
    setError('');

    try {
      // Ensure we're using the correct wallet provider
      if (wallets.length > 0) {
        const activeWallet = wallets[0];
        const provider = await activeWallet.getEthereumProvider();
        setWalletProvider(provider);
      }

      // Step 1: Create event in backend (draft mode)
      setError('Creating event in backend...');
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('dateTime', moment(formData.dateTime).utc().toISOString());
      submitData.append('duration', formData.duration);
      submitData.append('price', parseFloat(formData.price));
      submitData.append('maxAttendees', parseInt(formData.maxAttendees));
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      const response = await apiClient.createEvent(submitData);
      const draftEvent = response.data.data.event;

      // Step 2: Create event on blockchain
      setError('Creating event on blockchain (please confirm in wallet)...');
      const { eventId: contractEventId } = await createEventOnChain(
        parseFloat(formData.price),
        parseInt(formData.maxAttendees),
        Math.floor(moment(formData.dateTime).unix())
      );

      // Step 3: Update backend with blockchain ID (activates event)
      setError('Activating event...');
      await apiClient.updateEventContractId(draftEvent._id, contractEventId);

      // Success - redirect to event page
      router.push(`/events/${draftEvent._id}`);
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to create event';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while Privy initializes
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  // Show message if not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please connect your wallet to create events</p>
          <LoadingSpinner size="lg" text="Redirecting..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
          <p className="text-gray-600">
            Create a virtual event and sell tickets with PYUSD
          </p>
        </div>

        {/* Google Calendar Warning */}
        {!checkingGoogle && !isGoogleConnected && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <span className="text-red-600 text-xl">⚠️</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">
                    Google Calendar Not Connected
                  </h3>
                  <p className="text-sm text-red-800">
                    You need to connect your Google Calendar before creating events. This allows automatic calendar event creation and attendee management.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-6 text-sm font-medium text-white shadow transition-colors hover:bg-red-700 self-start"
              >
                Go to Dashboard to Connect
              </Link>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {['Basic Info', 'Date & Time', 'Pricing', 'Review'].map((label, index) => (
            <div key={index} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step > index + 1
                      ? 'bg-green-600 text-white'
                      : step === index + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > index + 1 ? '✓' : index + 1}
                </div>
                <span className="text-xs mt-2 text-center">{label}</span>
              </div>
              {index < 3 && (
                <div
                  className={`h-1 flex-1 ${
                    step > index + 1 ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className={`bg-white rounded-lg shadow-sm p-6 mb-6 ${!isGoogleConnected && !checkingGoogle ? 'opacity-50 pointer-events-none' : ''}`}>
          {error && (
            <div className="mb-6">
              <ErrorMessage message={error} />
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Web3 Workshop: Building with PYUSD"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/200 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your event, what attendees will learn, and any prerequisites..."
                  maxLength={5000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/5000 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Event Banner Image
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max 8MB. JPEG, PNG, or WebP. Recommended: 1200x630px
                </p>
                
                {formData.imagePreview && (
                  <div className="mt-4">
                    <img
                      src={formData.imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Event Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="dateTime"
                  value={formData.dateTime}
                  onChange={handleChange}
                  min={moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm')}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {/* <p className="text-xs text-gray-500 mt-1">
                  Your local timezone: {moment.tz.guess()}
                </p> */}
                {formData.dateTime && (
                  <p className="text-sm text-blue-600 mt-2">
                    Selected: {moment(formData.dateTime).format('LLLL')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Duration (minutes) *
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={240}>4 hours</option>
                  <option value={480}>8 hours</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Ticket Price (PYUSD) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 pr-20 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="10.50"
                  />
                  <span className="absolute right-4 top-2.5 text-gray-500 font-medium">
                    PYUSD
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Max 2 decimal places. Platform fee: 2.5%
                </p>
                {formData.price && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                    <div className="flex justify-between mb-1">
                      <span>You receive per ticket:</span>
                      <span className="font-semibold">
                        {(parseFloat(formData.price) * 0.975).toFixed(2)} PYUSD
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Platform fee (2.5%):</span>
                      <span>
                        {(parseFloat(formData.price) * 0.025).toFixed(2)} PYUSD
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Attendees *
                </label>
                <input
                  type="number"
                  name="maxAttendees"
                  value={formData.maxAttendees}
                  onChange={handleChange}
                  min="1"
                  max="10000"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of tickets available (1-10,000)
                </p>
                {formData.price && formData.maxAttendees && (
                  <p className="mt-2 text-sm text-green-600">
                    Potential revenue: {(parseFloat(formData.price) * parseInt(formData.maxAttendees) * 0.975).toFixed(2)} PYUSD
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Review Your Event</h3>
              
              {formData.imagePreview && (
                <img
                  src={formData.imagePreview}
                  alt={formData.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Title</label>
                  <p className="font-semibold">{formData.title}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Description</label>
                  <p className="text-gray-700">{formData.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Date & Time</label>
                    <p className="font-semibold">
                      {moment(formData.dateTime).format('lll')}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500">Duration</label>
                    <p className="font-semibold">{formData.duration} minutes</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500">Price</label>
                    <p className="font-semibold">{formData.price} PYUSD</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500">Max Attendees</label>
                    <p className="font-semibold">{formData.maxAttendees}</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Important:</strong> After tickets are sold, you can only edit the title, description, and image. Price, date/time, and capacity will be locked.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={step === 1 ? () => router.push('/dashboard') : handleBack}
            disabled={loading || (!isGoogleConnected && !checkingGoogle)}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={loading || (!isGoogleConnected && !checkingGoogle)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || (!isGoogleConnected && !checkingGoogle)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creating Event...
                </>
              ) : (
                'Create Event'
              )}
            </button>
          )}
        </div>

        {wallets.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              📝 <strong>Connected Wallet:</strong> {wallets[0].address}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
