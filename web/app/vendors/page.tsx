"use client";

import { useEffect, useState } from "react";

type Service = {
  name: string;
  description: string;
  tags: string[];
  priceBand: string;
};

type Vendor = {
  vendorId: string;
  businessName: string;
  category: string;
  serviceAreas: string[];
  bio: string;
  services: Service[];
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadVendors() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (category) {
        params.set("category", category);
      }

      const query = params.toString();
      const response = await fetch(`/api/vendors${query ? `?${query}` : ""}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Unable to load vendors");
      }

      setVendors(Array.isArray(data.vendors) ? data.vendors : []);

    } catch (err) {
      setError("Unable to load vendor data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVendors();
  }, []);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadVendors();
  }

  return (
    <main className="vendors-page">
      <nav className="topbar">
        <a className="brand" href="/">
          <div className="brand-mark">E</div>
          <div>
            <strong>EventForge</strong>
            <span>Vendor scheduling platform</span>
          </div>
        </a>

        <a className="outline-button" href="/">
          Back to dashboard
        </a>
      </nav>

      <section className="vendors-header">
        <p className="eyebrow">VENDOR DISCOVERY</p>
        <h1>Find the right team for your event.</h1>
        <p>
          Search approved vendors by service category and discover flexible
          vendor profiles powered by MongoDB.
        </p>
      </section>

      <section className="vendor-search-card">
        <form onSubmit={handleSearch} className="vendor-search-form">
          <label>
            Keyword
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Try projector, catering, sound..."
            />
          </label>

          <label>
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">All categories</option>
              <option value="Audio Visual">Audio Visual</option>
              <option value="Catering">Catering</option>
            </select>
          </label>

          <button className="primary-button" type="submit">
            Search vendors
          </button>
        </form>
      </section>

      <section className="vendor-results">
        <div className="vendor-results-heading">
          <div>
            <p className="eyebrow">AVAILABLE PARTNERS</p>
            <h2>
  {loading ? "Searching..." : `${vendors?.length ?? 0} vendors found`}
</h2>

          </div>
        </div>

        {error && <p className="vendor-error">{error}</p>}

        {!loading && !error && vendors.length === 0 && (
          <div className="empty-vendors">
            No vendors match your search. Try a different keyword or category.
          </div>
        )}

        <div className="vendor-grid">
          {(vendors ?? []).map((vendor) => (

            <article className="vendor-card" key={vendor.vendorId}>
              <div className="vendor-card-top">
                <div className="vendor-avatar">
                  {vendor.businessName.substring(0, 1)}
                </div>
                <span className="vendor-approved">Approved</span>
              </div>

              <h3>{vendor.businessName}</h3>
              <p className="vendor-category">{vendor.category}</p>
              <p className="vendor-bio">{vendor.bio}</p>

              <div className="vendor-locations">
                {vendor.serviceAreas.map((area) => (
                  <span key={area}>{area}</span>
                ))}
              </div>

              <div className="vendor-services">
                <strong>Services</strong>
                {vendor.services.map((service) => (
                  <div className="service-row" key={service.name}>
                    <span>{service.name}</span>
                    <small>{service.priceBand}</small>
                  </div>
                ))}
              </div>

              <a
  className="secondary-button vendor-button"
  href={`/vendors/${vendor.vendorId}`}
>
  View vendor
</a>

            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
