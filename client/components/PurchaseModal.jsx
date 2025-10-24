'use client';

import { useState, useEffect } from 'react';
import moment from 'moment';
import { formatPYUSD, parsePYUSD } from '@/lib/contracts';
import { apiClient } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

export default function PurchaseModal({ event, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Details, 2: Approve, 3: Purchase, 4: Success
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    
    // Validate email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setStep(2);
  };

  const handlePurchase = async () => {
    setLoading(true);
    setError('');

    try {
      // Step 1: Initiate purchase in database
      const purchaseResponse = await apiClient.purchaseTicket(event._id, email);
      const ticketId = purchaseResponse.data.data?.ticket?._id;

      // TODO: Step 2: Check PYUSD balance
      // const balance = await checkPYUSDBalance();
      // if (balance < event.price) {
      //   setError('Insufficient PYUSD balance');
      //   return;
      // }

      // TODO: Step 3: Check allowance and approve if needed
      // const allowance = await checkPYUSDAllowance();
      // if (allowance < event.price) {
      //   await approvePYUSD(event.price);
      // }
      
      setStep(3);

      // TODO: Step 4: Call smart contract purchaseTicket()
      // const tx = await purchaseTicketOnChain(event.contractEventId);
      // await tx.wait();
      // const txHash = tx.hash;
      
      // Placeholder transaction hash
      const placeholderTxHash = '0x' + '0'.repeat(64);
      setTxHash(placeholderTxHash);

      // Step 5: Confirm with backend (adds to Google Calendar, sends email)
      await apiClient.confirmTicket(ticketId, placeholderTxHash);

      setStep(4);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Purchase failed');
      setStep(2); // Go back to approval step
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          disabled={loading}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Purchase Ticket</h2>
            
            {/* Event Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">{event.title}</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>📅 {moment(event.dateTime).format('lll')}</p>
                <p>⏱️ {event.duration} minutes</p>
                <p className="font-semibold text-lg text-blue-600">
                  {event.price} PYUSD
                </p>
              </div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  You'll receive Google Calendar invite and ticket confirmation at this email
                </p>
              </div>

              {error && <ErrorMessage message={error} />}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Approve PYUSD */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Approve Payment</h2>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                To purchase this ticket, you need to approve Ticketify to spend {event.price} PYUSD from your wallet.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span>Ticket Price:</span>
                <span className="font-semibold">{event.price} PYUSD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Platform Fee (2.5%):</span>
                <span>{(event.price * 0.025).toFixed(2)} PYUSD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Est. Gas Fee:</span>
                <span className="text-gray-500">~0.002 ETH</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total PYUSD:</span>
                <span>{event.price} PYUSD</span>
              </div>
            </div>

            {error && <ErrorMessage message={error} />}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Processing...
                  </>
                ) : (
                  'Purchase Ticket'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 3 && (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" />
            <h2 className="text-xl font-bold mt-4 mb-2">Confirming Transaction</h2>
            <p className="text-gray-600 text-sm">
              Please wait while we verify your payment and add you to the event...
            </p>
            <div className="mt-6 space-y-2 text-sm text-left bg-gray-50 rounded-lg p-4">
              <p className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Blockchain payment confirmed
              </p>
              <p className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Adding to Google Calendar...
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-600"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <h2 className="text-2xl font-bold mb-2">Ticket Purchased!</h2>
            <p className="text-gray-600 mb-6">
              You've been successfully added to the event. Check your email for the Google Calendar invite with the Meet link.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm mb-2">
                <strong>Event:</strong> {event.title}
              </p>
              <p className="text-sm mb-2">
                <strong>Date:</strong> {moment(event.dateTime).format('lll')}
              </p>
              <p className="text-sm mb-2">
                <strong>Email:</strong> {email}
              </p>
              {txHash && (
                <p className="text-sm break-all">
                  <strong>Transaction:</strong>{' '}
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View on Etherscan
                  </a>
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

