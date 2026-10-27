# MongoDB data model – vendor discovery documents

## Collection: `vendor_profiles`

MongoDB stores flexible, descriptive data used for discovery and vendor profile pages. PostgreSQL remains the source of truth for identity, availability, bookings, payments, and reviews.

```json
{
  "vendorId": "44444444-4444-4444-4444-444444444444",
  "businessName": "Rohan Sound & Light",
  "category": "Audio Visual",
  "serviceAreas": ["Bengaluru", "Mysuru"],
  "bio": "Conference and wedding production team specialising in reliable event technology.",
  "services": [
    {
      "serviceId": "66666666-6666-6666-6666-666666666666",
      "name": "Conference AV Package",
      "tags": ["sound", "projector", "microphones", "stage lighting"],
      "description": "Professional sound, stage lighting, microphones, projector and on-site technician.",
      "priceBand": "PREMIUM"
    }
  ],
  "portfolio": [
    {"title": "Tech Summit 2026", "url": "https://example.com/portfolio/tech-summit"}
  ],
  "faq": [
    {"question": "Do you provide an on-site technician?", "answer": "Yes, for the complete package."}
  ],
  "updatedAt": {"$date": "2026-10-27T00:00:00Z"}
}
```

## Indexes and retrieval strategy

- Unique index on `vendorId`.
- Compound index on `category` and `serviceAreas`.
- Text index on `businessName`, `bio`, service names, tags, and descriptions for keyword discovery.
- Aggregation pipeline filters by city/category, unwinds services, scores text matches, and returns a compact vendor card.
- Phase 2 can add embeddings if semantic search is required; the current milestone uses the permitted SQL + NoSQL option and keeps retrieval explainable.
