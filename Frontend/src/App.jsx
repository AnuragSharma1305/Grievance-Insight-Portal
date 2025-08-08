import React, { useState } from "react";

export default function App() {
  const [complaint, setComplaint] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("http://localhost:7071/api/analyzeComplaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: complaint }), // ✅ FIX: backend expects 'text'
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      console.log("Backend says:", data);
      setResult(data);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-indigo-600">
          Grievance Insight Portal
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows="5"
            placeholder="Enter your complaint here..."
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            required
          ></textarea>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition duration-300 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Submit Complaint"}
          </button>
        </form>

        {error && (
          <div className="mt-4 text-red-600 text-center font-medium">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
            <p><strong>Message:</strong> {result.message}</p>
            <p><strong>Input:</strong> {result.input}</p>
            <p><strong>Classification:</strong> {result.classification}</p>
            <p><strong>Sentiment:</strong> {result.sentiment}</p>
            <p><strong>Urgency:</strong> {result.urgency}</p>
            <p><strong>Recommended Action:</strong> {result.recommendedAction}</p>
          </div>
        )}
      </div>
    </div>
  );
}
