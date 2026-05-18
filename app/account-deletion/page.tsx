'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Mail, Shield, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AccountDeletionRequest() {
  const [formData, setFormData] = useState({
    email: '',
    reason: '',
    additionalInfo: '',
    confirmEmail: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.confirmEmail) {
      newErrors.confirmEmail = 'Please confirm your email';
    } else if (formData.email !== formData.confirmEmail) {
      newErrors.confirmEmail = 'Email addresses do not match';
    }

    if (!formData.reason) {
      newErrors.reason = 'Please provide a reason for deletion';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Here you would typically send the request to your backend
      // For now, we'll simulate the submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting deletion request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Request Submitted Successfully</CardTitle>
            <CardDescription>
              Your account deletion request has been received and will be processed within 7-14 business days.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              We've sent a confirmation email to <strong>{formData.email}</strong> with your request details.
            </p>
            <p className="text-sm text-gray-500">
              If you have any questions or need to modify your request, please contact us at{' '}
              <a href="mailto:delete@animalclick.co.za" className="text-blue-600 hover:underline">
                delete@animalclick.co.za
              </a>
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="mt-6"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
          <Trash2 className="w-8 h-8 text-red-600" />
          Account Deletion Request
        </h1>
        <p className="text-gray-600 text-lg">
          We're sorry to see you go. Please fill out the form below to request the deletion of your Animal Click account.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Deletion Request Form</CardTitle>
              <CardDescription>
                Please provide the required information to process your account deletion request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your registered email address"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmEmail">Confirm Email Address *</Label>
                  <Input
                    id="confirmEmail"
                    name="confirmEmail"
                    type="email"
                    value={formData.confirmEmail}
                    onChange={handleInputChange}
                    placeholder="Confirm your email address"
                    className={errors.confirmEmail ? 'border-red-500' : ''}
                  />
                  {errors.confirmEmail && (
                    <p className="text-sm text-red-600">{errors.confirmEmail}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Deletion *</Label>
                  <Textarea
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    placeholder="Please tell us why you want to delete your account"
                    rows={4}
                    className={errors.reason ? 'border-red-500' : ''}
                  />
                  {errors.reason && (
                    <p className="text-sm text-red-600">{errors.reason}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                  <Textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    placeholder="Any additional information or feedback you'd like to share"
                    rows={3}
                  />
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Account deletion is permanent and cannot be undone. 
                    All your data, including posts, reviews, and account information will be permanently removed.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {isSubmitting ? 'Submitting Request...' : 'Submit Deletion Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                What Happens Next?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">1. Request Review</h4>
                <p className="text-sm text-gray-600">
                  We'll review your request within 2-3 business days to verify your identity.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">2. Confirmation</h4>
                <p className="text-sm text-gray-600">
                  You'll receive an email confirmation once your request is approved.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">3. Data Deletion</h4>
                <p className="text-sm text-gray-600">
                  Your account and all associated data will be permanently deleted within 30 days.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                If you have questions about account deletion or need assistance:
              </p>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:delete@animalclick.co.za" className="text-blue-600 hover:underline">
                    delete@animalclick.co.za
                  </a>
                </p>
                <p className="text-sm">
                  <strong>Support:</strong>{' '}
                  <a href="mailto:support@animalclick.co.za" className="text-blue-600 hover:underline">
                    support@animalclick.co.za
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alternative Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Before deleting your account, consider these alternatives:
              </p>
              <ul className="text-sm space-y-1">
                <li>• Temporarily deactivate your account</li>
                <li>• Update your privacy settings</li>
                <li>• Contact support for assistance</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
