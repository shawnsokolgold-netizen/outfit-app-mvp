"use client";

import { useState } from "react";

export default function AdminPage() {
  const [form, setForm] = useState({
    amazonUrl: "",
    title: "",
    brand: "",
    category: "top",
    colors: "",
    tags: "",
    imageUrl: "",
    affiliateUrl: "",
    priceText: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const payload = {
      ...form,
      colors: form.colors.split(",").map((x) => x.trim()).filter(Boolean),
      tags: form.tags.split(",").map((x) => x.trim()).filter(Boolean),
    };

    const res = await fetch("/api/import-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 20 }}>
      <h1>Add Product</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <input placeholder="Amazon URL" value={form.amazonUrl} onChange={(e) => updateField("amazonUrl", e.target.value)} />
        <input placeholder="Title" value={form.title} onChange={(e) => updateField("title", e.target.value)} />
        <input placeholder="Brand" value={form.brand} onChange={(e) => updateField("brand", e.target.value)} />

        <select value={form.category} onChange={(e) => updateField("category", e.target.value)}>
          <option value="top">top</option>
          <option value="bottom">bottom</option>
          <option value="hat">hat</option>
          <option value="shoe">shoe</option>
        </select>

        <input placeholder="Colors (comma separated)" value={form.colors} onChange={(e) => updateField("colors", e.target.value)} />
        <input placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => updateField("tags", e.target.value)} />
        <input placeholder="Image URL" value={form.imageUrl} onChange={(e) => updateField("imageUrl", e.target.value)} />
        <input placeholder="Affiliate URL" value={form.affiliateUrl} onChange={(e) => updateField("affiliateUrl", e.target.value)} />
        <input placeholder="Price text" value={form.priceText} onChange={(e) => updateField("priceText", e.target.value)} />

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Product"}
        </button>
      </form>

      {result ? (
        <pre style={{ marginTop: 20, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </main>
  );
}