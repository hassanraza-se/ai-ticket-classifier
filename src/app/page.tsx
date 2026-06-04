"use client";

import { useState, SubmitEvent } from "react";

interface ClassificationResult {
  category: string;
  priority: "Urgent" | "High" | "Medium" | "Low";
  suggested_reply: string;
  estimated_resolution_time: string;
}

const categoryColors: Record<string, string> = {
  Billing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Technical: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "General Inquiry": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  Complaint: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "Feature Request": "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
};

const priorityColors: Record<string, string> = {
  Urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  High: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

function getCategoryBadgeClass(category: string): string {
  return (
    categoryColors[category] ??
    "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
  );
}

function SkeletonBlock() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-4">
        <div className="h-8 w-28 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-8 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-4/6 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setValidationError(null);
    setError(null);
    setResult(null);
    setCopied(false);

    const trimmed = message.trim();
    if (trimmed.length < 10) {
      setValidationError(
        "Please enter at least 10 characters to analyse the ticket."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        throw new Error("Server responded with an error.");
      }

      const data: ClassificationResult = await res.json();
      setResult(data);
    } catch {
      setError(
        "Something went wrong while analysing the ticket. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.suggested_reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard API may fail in insecure contexts */
    }
  }

  return (
    <main className="mx-auto max-w-4xl w-full px-4 py-10 space-y-8">
      {/* Header */}
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          AI Ticket Classifier
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Paste a customer message below and get an instant classification,
          priority, suggested reply, and resolution estimate.
        </p>
      </header>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="ticket-message"
            className="block text-sm font-medium mb-1"
          >
            Customer Message
          </label>
          <textarea
            id="ticket-message"
            rows={6}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            placeholder="Paste or type the customer message here..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (validationError) setValidationError(null);
            }}
          />
          {validationError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading && (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          )}
          {loading ? "Analysing..." : "Analyse Ticket"}
        </button>
      </form>

      {/* Output section */}
      {(loading || result || error) && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-5">
          <h2 className="text-lg font-semibold">Analysis Result</h2>

          {/* Loading skeleton */}
          {loading && <SkeletonBlock />}

          {/* Error */}
          {error && !loading && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div className="space-y-5">
              {/* Badges row */}
              <div className="flex flex-wrap gap-3">
                {/* Category */}
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getCategoryBadgeClass(result.category)}`}
                >
                  {result.category}
                </span>

                {/* Priority */}
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${priorityColors[result.priority] ?? "bg-gray-100 text-gray-800"}`}
                >
                  {result.priority} Priority
                </span>
              </div>

              {/* Estimated resolution time */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Estimated Resolution Time
                </h3>
                <p className="text-sm">{result.estimated_resolution_time}</p>
              </div>

              {/* Suggested reply */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Suggested Reply
                  </h3>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 dark:border-gray-600 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <svg
                          className="h-3.5 w-3.5 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3a2.25 2.25 0 00-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                          />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-4 text-sm leading-relaxed whitespace-pre-wrap select-text">
                  {result.suggested_reply}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <div className={"text-gray-500 text-center"}>Made with ❤️ by <a href={"https://hassanraza.net/"} target={"_blank"} className={"text-blue-600"}>Hassan Raza</a></div>
    </main>
  );
}
