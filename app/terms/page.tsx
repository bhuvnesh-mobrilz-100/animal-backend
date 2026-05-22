import React from "react";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
      <p className="mb-4">
        Welcome to <strong>Animal Click</strong>. These Terms of Service govern your use of the platform and the management dashboard.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
      <p className="mb-4">
        By signing up, logging in, or otherwise accessing the Animal Click platform, you agree to these Terms of Service and the Privacy Policy.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-4">2. User Roles and Permissions</h2>
      <p className="mb-4">
        The platform supports multiple user roles including Guest, Subscriber, Provider, Admin, Approver, Manager, and Owner. Access to dashboard features is strictly governed by role-based permissions.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
      <p className="mb-4">
        You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-4">4. Content and Moderation</h2>
      <p className="mb-4">
        Community posts, reviews, event submissions, and provider updates may be subject to review and approval by Admin or Approver roles before becoming public.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-4">5. Donation and Rescue Campaigns</h2>
      <p className="mb-4">
        Donation campaigns are informational only in this version of the platform. No payment processing is provided through Animal Click at this time.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-4">6. Support</h2>
      <p className="mb-4">
        Support is provided through ticket-based requests. Please use the in-app support form to open a ticket.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-4">7. Changes to Terms</h2>
      <p className="mb-4">
        Animal Click may update these terms at any time. Users will be notified of material changes through the platform.
      </p>
      <p className="text-sm text-gray-500 mt-8">Last updated: {new Date().toLocaleDateString()}</p>
    </div>
  );
}
