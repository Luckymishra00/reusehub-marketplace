"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Mail, MapPin, MessageSquare, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const { user, showToast } = useAuth();

  const [name, setName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (Array.isArray(json.errors)) {
          const map: Record<string, string> = {};
          json.errors.forEach((er: { field: string; message: string }) => {
            map[er.field] = er.message;
          });
          setFieldErrors(map);
        }
        showToast(json.message || "Please check the form fields", "error");
        return;
      }

      setSubmitted(true);
      setSubject("");
      setMessage("");
      showToast("Your message has been saved!", "success");
    } catch {
      showToast("Failed to submit contact message", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Info Column */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9A8174]">
              Community Support
            </span>
            <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#3B2B25] mt-1">
              Get in Touch with ReUseHub
            </h1>
            <p className="text-sm text-[#5C534E] mt-2 leading-relaxed">
              Have a question about a listing, condition guidelines, or account
              stewardship? Send us a note and it will be logged directly for our
              support team.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-[#E6E1DA]">
              <Mail className="w-5 h-5 text-[#3B2B25] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-[#242424]">
                  Support Desk
                </h2>
                <p className="text-xs text-[#737373]">
                  stewardship@reusehub.demo
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-[#E6E1DA]">
              <MapPin className="w-5 h-5 text-[#3B2B25] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-[#242424]">
                  Community Hubs
                </h2>
                <p className="text-xs text-[#737373]">
                  Portland, OR • Seattle, WA • Austin, TX
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-[#E6E1DA]">
              <MessageSquare className="w-5 h-5 text-[#6D8065] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-[#242424]">
                  Database-Backed Persistence
                </h2>
                <p className="text-xs text-[#737373]">
                  Every submission is validated and stored in the relational
                  <code className="mx-1 font-mono-price">contact_messages</code>
                  table.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-[#E6E1DA] p-6 sm:p-8 shadow-xs">
            {submitted ? (
              <div className="py-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#EBF2EA] text-[#2F472B] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="font-serif-display text-2xl font-semibold text-[#242424]">
                  Message Received!
                </h2>
                <p className="text-sm text-[#737373] max-w-md mx-auto">
                  Thank you for reaching out to ReUseHub. Your inquiry has been
                  persisted in our database and our stewardship team will follow
                  up shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#3B2B25] text-white text-xs font-semibold"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold text-[#242424] mb-1.5"
                    >
                      Your Name *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Clara Vance"
                      className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
                      required
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-[#B93829] mt-1">
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold text-[#242424] mb-1.5"
                    >
                      Email Address *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="clara@example.com"
                      className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
                      required
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-[#B93829] mt-1">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-subject"
                    className="block text-xs font-semibold text-[#242424] mb-1.5"
                  >
                    Subject *
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Question about listing guidelines or item exchange"
                    className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
                    required
                  />
                  {fieldErrors.subject && (
                    <p className="text-xs text-[#B93829] mt-1">
                      {fieldErrors.subject}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-semibold text-[#242424] mb-1.5"
                  >
                    Message *
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can our team help you?"
                    className="w-full p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
                    required
                  />
                  {fieldErrors.message && (
                    <p className="text-xs text-[#B93829] mt-1">
                      {fieldErrors.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm font-semibold hover:bg-[#2A1E1A] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? "Sending..." : "Send Message"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
