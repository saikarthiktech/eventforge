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
  portfolio?: {
    title: string;
    url: string;
  }[];
  faq?: {
    question: string;
    answer: string;
  }[];
};

export default function VendorDetailsPage({
  params,
}: {
  params: { vendorId: string };
}) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVendor() {
      try {
        const response = await fetch("/api/vendors");
        const data = await response.json();

        const selectedVendor = data.vendors.find(
          (item: Vendor) => item.vendorId === params.vendorId
        );

        setVendor(selectedVendor || null);
      } catch (error) {
        console.error("Unable to load vendor:", error);
      } finally {
        setLoading(false);
      }
    }

    loadVendor();
  }, [params.vendorId]);

  if (loading) {
    return <main className="vendor-detail-page">Loading vendor...</main>;
  }

  if (!vendor) {
    return (
      <main className="vendor-detail-page">
        <h1>Vendor not found</h1>
        <a href="/vendors">Back to vendors</a>
      </main>
    );
  }

  return (
    <main className="vendor-detail-page">
      <nav className="topbar">
        <a className="brand" href="/">
          <div className="brand-mark">E</div>
          <div>
            <strong>EventForge</strong>
            <span>Vendor scheduling platform</span>
          </div>
        </a>

        <a className="outline-button" href="/vendors">
          Back to vendors
        </a>
      </nav>

      <section className="vendor-detail-card">
        <div className="vendor-detail-header">
          <div className="vendor-avatar">
            {vendor.businessName.substring(0, 1)}
          </div>

          <span className="vendor-approved">Approved vendor</span>
        </div>

        <p className="eyebrow">{vendor.category}</p>

        <h1>{vendor.businessName}</h1>

        <p className="vendor-detail-bio">{vendor.bio}</p>

        <h2>Service areas</h2>

        <div className="vendor-locations">
          {vendor.serviceAreas.map((area) => (
            <span key={area}>{area}</span>
          ))}
        </div>

        <h2>Services offered</h2>

        <div className="vendor-detail-services">
          {vendor.services.map((service) => (
            <article className="detail-service" key={service.name}>
              <div>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
              </div>

              <strong>{service.priceBand}</strong>
            </article>
          ))}
        </div>

        {vendor.portfolio && vendor.portfolio.length > 0 && (
          <>
            <h2>Portfolio</h2>

            <div className="portfolio-list">
              {vendor.portfolio.map((item) => (
                <div className="portfolio-item" key={item.title}>
                  <strong>{item.title}</strong>
                  <span>Portfolio item available</span>
                </div>
              ))}
            </div>
          </>
        )}

        {vendor.faq && vendor.faq.length > 0 && (
          <>
            <h2>Frequently asked questions</h2>

            <div className="faq-list">
              {vendor.faq.map((item) => (
                <div className="faq-item" key={item.question}>
                  <strong>{item.question}</strong>
                  <p>{item.answer}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <a className="primary-button detail-book-button" href="/events/new">
          Create an event with this vendor
        </a>
      </section>
    </main>
  );
}
