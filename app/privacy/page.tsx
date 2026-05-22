import React from "react";

export default function PrivacyShortPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">
        Welcome to <strong>Animal Click</strong>. Your privacy is important to us. This page explains how we collect, use, and protect your information.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information Collection</h2>
      <p className="mb-4">
        We collect information such as email, profile settings, subscription status, and role assignments to provide the management dashboard and related services.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-4">2. Use of Data</h2>
      <p className="mb-4">
        Your data is used to manage authentication, permissions, notifications, and analytic reporting. We do not sell personal data to third parties.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-4">3. Security</h2>
      <p className="mb-4">
        We store profile and dashboard data securely and use access controls to limit who can view sensitive information.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-4">4. Your Choices</h2>
      <p className="mb-4">
        You can update your profile and notification preferences in the dashboard, and you may request deletion of your account at any time.
      </p>
      <h2 className="text-2xl font-semibold mt-8 mb-4">5. Contact</h2>
      <p className="mb-4">
        For privacy questions, contact <strong>privacy@animalclick.co.za</strong>.
      </p>
      <p className="text-sm text-gray-500 mt-8">Last updated: {new Date().toLocaleDateString()}</p>
    </div>
  );
}
