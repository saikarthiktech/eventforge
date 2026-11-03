"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Service = {
  name: string;
  description: string;
  tags?: string[];
  priceBand: string;
};

type PortfolioItem = {
  title: string;
  url?: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type Vendor = {
  vendorId: string;
  businessName: string;
  category: string;
  serviceAreas: string[];
  bio: string;
  services: Service[];
  portfolio?: PortfolioItem[];
  faq?: FaqItem[];
};

export default function VendorDetailsPage() {
  const params = useParams();
  const vendorId = params.vendorId as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadVendor() {
      try {
        const response = await fetch("/api/vendors");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Unable to load vendor");
        }

        const selectedVendor = data.vendors.find(
          (item: Vendor) => item.vendorId === vendorId
        );

        if (!selectedVendor) {
          setError("Vendor not found");
        } else {
          setVendor(selectedVendor);
        }
      } catch (loadError) {
        console.error(loadError);
        setError("Unable to load vendor details");
      } finally {
        setLoading(false);
      }
    }

    if (vendorId) {
      loadVendor();
    }
  }, [vendorId]);

  if (loading) {
    return (
      <main className="vendor-detail-page">
        <div className="vendor-detail-card">
          <h1>Loading vendor...</h1>
        </div>
      </main>
    );
  }

  if (error || !vendor) {
    return (
      <main className="vendor-detail-page">
        <div className="vendor-detail-card">
          <h1>Vendor not found</h1>
          <p>{error}</p>
          <a className="primary-button" href="/vendors">
            Back to vendors
          </a>
        </div>
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

                {service.tags && service.tags.length > 0 && (
                  <div className="vendor-locations detail-tags">
                    {service.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                )}
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
