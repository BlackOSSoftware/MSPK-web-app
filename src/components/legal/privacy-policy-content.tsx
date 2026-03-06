"use client";

export function PrivacyPolicyContent() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
      <p>
        This Privacy Policy explains how MSPK Trading Solutions collects, uses, and protects your personal
        information when you use our website, app, and services.
      </p>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Information We Collect</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>Account details such as name, email, phone number, and city.</li>
          <li>Login activity, device identifiers, and app usage analytics.</li>
          <li>Notification tokens to deliver alerts and updates.</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">How We Use Your Data</h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>To provide access to signals, analytics, and subscription services.</li>
          <li>To secure your account and prevent unauthorized access.</li>
          <li>To send important service and trading notifications.</li>
          <li>To improve platform performance and user experience.</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Data Sharing</h3>
        <p>
          We do not sell your personal data. Information is shared only with trusted service providers that
          help us operate the platform, and only when required by law.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Security</h3>
        <p>
          We use industry-standard safeguards to protect your data. However, no system is 100% secure, and
          you should keep your credentials confidential.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Your Choices</h3>
        <p>
          You can request updates or deletion of your data by contacting support. You may also disable
          notifications in your device settings.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Contact</h3>
        <p>
          For privacy-related questions, contact MSPK Trading Solutions support.
        </p>
      </div>
    </div>
  );
}
