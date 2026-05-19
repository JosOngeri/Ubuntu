import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function OfferResponse() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validationToken, setValidationToken] = useState('');
  const [action, setAction] = useState(null); // 'accept' or 'negotiate'
  const [counterOfferSalary, setCounterOfferSalary] = useState('');

  useEffect(() => {
    if (token) {
      fetchApplication();
    }
  }, [token]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const res = await api.post('/jobs/offers/validate', { token });
      setApplication(res.data);
    } catch (err) {
      toast.error('Invalid or expired offer link');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!validationToken) {
      toast.error('Please enter your verification token');
      return;
    }
    try {
      await api.post('/jobs/offers/accept', { offerToken: token, verificationToken: validationToken });
      toast.success('Offer accepted successfully!');
      setApplication({ ...application, status: 'offer_accepted', offerStatus: 'accepted' });
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to accept offer');
    }
  };

  const handleNegotiate = async () => {
    if (!validationToken) {
      toast.error('Please enter your verification token');
      return;
    }
    if (!counterOfferSalary) {
      toast.error('Please enter your expected salary');
      return;
    }
    try {
      await api.post('/jobs/offers/negotiate', { offerToken: token, verificationToken: validationToken, counterOfferSalary });
      toast.success('Salary negotiation submitted successfully!');
      setApplication({ ...application, offerStatus: 'negotiating', counterOfferSalary });
      setAction(null);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to submit salary negotiation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p>Loading offer details...</p>
        </Card>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p className="text-red-600">Invalid or expired offer link</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <h1 className="text-2xl font-bold mb-6">Job Offer Response</h1>
          
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-4">Offer Details</h2>
            <div className="space-y-2">
              <p><strong>Position:</strong> {application.positionDetails?.position || 'Not specified'}</p>
              <p><strong>Department:</strong> {application.positionDetails?.department || 'Not specified'}</p>
              <p><strong>Offered Salary:</strong> {application.offeredSalary || 'Not specified'}</p>
              <p><strong>Offer Sent:</strong> {application.offerSentAt ? new Date(application.offerSentAt).toLocaleDateString() : 'Not specified'}</p>
            </div>
          </div>

          {action === 'negotiate' ? (
            <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg mb-6">
              <h3 className="font-semibold mb-4">Salary Negotiation</h3>
              <div className="form-group mb-4">
                <label>Expected Salary</label>
                <input
                  type="number"
                  className="form-input"
                  value={counterOfferSalary}
                  onChange={(e) => setCounterOfferSalary(e.target.value)}
                  placeholder="Enter your expected salary"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="primary" onClick={handleNegotiate}>Submit Negotiation</Button>
                <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Verification Required</h3>
                <p className="text-sm mb-2">Please enter the last 4 digits of your phone number to verify your identity.</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Phone: {application.applicantPhone?.slice(-4) || 'Not available'}
                </p>
              </div>

              <div className="form-group">
                <label>Verification Token (Last 4 digits of phone)</label>
                <input
                  type="text"
                  className="form-input"
                  value={validationToken}
                  onChange={(e) => setValidationToken(e.target.value)}
                  placeholder="Enter last 4 digits"
                  maxLength={4}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="success" onClick={handleAccept}>Accept Offer</Button>
                <Button variant="outline" onClick={() => setAction('negotiate')}>Negotiate Salary</Button>
              </div>
            </div>
          )}

          {application.offerStatus === 'accepted' && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900 rounded-lg">
              <p className="text-green-800 dark:text-green-200 font-semibold">
                ✓ You have accepted this offer. We will contact you soon with next steps.
              </p>
            </div>
          )}

          {application.offerStatus === 'negotiating' && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200 font-semibold">
                Your salary negotiation has been submitted. We will review it and get back to you.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
