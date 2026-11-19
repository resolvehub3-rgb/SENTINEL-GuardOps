import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Mail, MessageSquare, Building2 } from 'lucide-react';
import { MarketingLayout } from '../../components/marketing/MarketingLayout';
import { validateContactFormInput } from '../../utils/operations';
import { usePageMeta } from '../../utils/seo';

export function ContactPage() {
  usePageMeta(
    'Contact Us | Sentinel GuardOps',
    'Get in touch with the Sentinel GuardOps team about onboarding your private security company, platform features, or subscription questions.',
  );

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<{
    fullName: string;
    companyName: string;
    subject: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const check = validateContactFormInput({
      fullName,
      companyName,
      email,
      subject,
      message,
    });
    if (!check.valid) {
      setError(check.error ?? 'Please review the highlighted fields.');
      return;
    }

    setSubmittedRecord({
      fullName: fullName.trim(),
      companyName: companyName.trim(),
      subject: subject.trim(),
    });
  };

  const resetForm = () => {
    setSubmittedRecord(null);
    setFullName('');
    setCompanyName('');
    setEmail('');
    setPhone('');
    setSubject('');
    setMessage('');
    setError(null);
  };

  return (
    <MarketingLayout>
      <section className="py-14 sm:py-20 bg-[#10213D] text-white border-b border-[#1E355C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[#10A878] mb-3">
              Contact Samley Technologies
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Let&apos;s Talk About Your Security Operations.
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              Have questions about deploying Sentinel GuardOps across your security locations or
              setting up your company subscription? Send us an inquiry below.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-white dark:bg-[#0B1324]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Form */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-[#1E2E4A] bg-slate-50/70 dark:bg-[#121E36] p-6 sm:p-8">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">
              Send an Inquiry
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Complete the details below regarding your security company.
            </p>

            {submittedRecord ? (
              <div
                role="status"
                className="rounded-xl border border-[#10A878]/40 bg-emerald-500/10 p-6 space-y-3"
              >
                <div className="flex items-center gap-2.5 text-[#10A878]">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Inquiry Recorded in Frontend Preview
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  Thank you, <span className="font-semibold">{submittedRecord.fullName}</span> (
                  {submittedRecord.companyName}). Your message regarding{' '}
                  <span className="font-semibold">&ldquo;{submittedRecord.subject}&rdquo;</span> has
                  been validated. Note: this UI prototype validates inquiries locally and does not
                  transmit live outbound email yet.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="h-10 px-4 rounded-xl bg-[#10A878] hover:bg-[#0E9369] text-white text-xs font-bold cursor-pointer"
                  >
                    Send Another Inquiry
                  </button>
                  <Link
                    to="/register"
                    className="h-10 px-4 rounded-xl border border-slate-300 dark:border-[#24395D] text-xs font-bold text-slate-800 dark:text-white inline-flex items-center gap-1.5"
                  >
                    <span>Proceed to Company Registration</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-600 dark:text-red-300"
                  >
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Full Name *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Kwame Boateng"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-[#24395D] bg-white dark:bg-[#0D182D] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#10A878]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-company"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Company Name *
                    </label>
                    <input
                      id="contact-company"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Vanguard Shield Security Ltd"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-[#24395D] bg-white dark:bg-[#0D182D] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#10A878]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Email Address *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operations@yourcompany.com"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-[#24395D] bg-white dark:bg-[#0D182D] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#10A878]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Phone Number (Optional)
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+233 ..."
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-[#24395D] bg-white dark:bg-[#0D182D] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#10A878]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-subject"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Subject *
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Onboarding inquiry for our security team"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-[#24395D] bg-white dark:bg-[#0D182D] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#10A878]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Message *
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share how many locations or supervisors you coordinate and how we can assist..."
                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-[#24395D] bg-white dark:bg-[#0D182D] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#10A878]"
                  />
                </div>

                <button
                  type="submit"
                  className="h-12 px-7 rounded-xl bg-[#10A878] hover:bg-[#0E9369] text-white text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Submit Inquiry</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Guidance & Direct Channels Panel */}
          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-2xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-[#10A878]" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Company Onboarding
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Ready to start setting up your company immediately? You can register your security
                company online without waiting for an inquiry call.
              </p>
              <Link
                to="/register"
                className="h-10 px-4 rounded-xl bg-[#10213D] hover:bg-[#162C50] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors"
              >
                <span>Register Your Company</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-[#1E2E4A] bg-white dark:bg-[#121E36] p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-[#10A878]" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Samley Technologies Product Support
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Existing company administrators, supervisors, and guards can sign in directly to
                their role portal for live operational tools.
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-[#1E2E4A] flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-[#10A878]" />
                  <span>Direct organization contact channels configurable per deployment</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
