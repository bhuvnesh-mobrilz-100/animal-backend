// app/privacy-policy/page.tsx
import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>

      <p className="mb-4">
        Welcome to <strong>Animal Click</strong>. Your privacy is important to
        us. This policy outlines how we collect, use, and protect your
        information in accordance with the General Data Protection Regulation
        (GDPR) and South Africa's Protection of Personal Information Act (POPIA).
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
      <p className="mb-4">
        We collect data such as your location, preferences, device data, and
        interaction history to help improve our services. This includes searches
        for vets, pet-friendly locations, and interactions with features within
        the app.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Data</h2>
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li>To personalize your experience in the app</li>
        <li>To improve our platform and provide relevant recommendations</li>
        <li>To troubleshoot and enhance app functionality</li>
        <li>To communicate with you, when necessary</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">3. Data Protection & Compliance</h2>
      <p className="mb-4">
        We take your privacy seriously and ensure compliance with the GDPR and
        POPI Act. Your data is securely stored and never sold to third parties.
        You may request to view, update, or delete your personal data at any
        time by contacting us.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">4. Refund Policy</h2>
      <p className="mb-4">
        Animal Click offers services which may be subject to paid subscriptions
        or one-time purchases. Refunds are only processed in cases of duplicate
        billing or system errors. All refund requests must be made within 7 days
        of the transaction by contacting support@animalclick.co.za.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">5. Account Deletion</h2>
      <p className="mb-4">
        You may delete your account at any time through the app’s account
        settings. Once deleted, your data will be permanently removed from our
        systems within 30 days. For immediate deletion or related inquiries,
        email us at delete@animalclick.co.za.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">6. Contact Information</h2>
      <p className="mb-4">
        If you have any questions regarding this policy or your data, please
        contact us at <strong>privacy@animalclick.co.za</strong>.
      </p>

      <p className="text-sm text-gray-500 mt-8">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
