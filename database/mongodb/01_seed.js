// Run with: mongosh "$MONGODB_URI" eventforge database/mongodb/01_seed.js
const profiles = db.vendor_profiles;
profiles.drop();
profiles.createIndex({ vendorId: 1 }, { unique: true });
profiles.createIndex({ category: 1, serviceAreas: 1 });
profiles.createIndex({ businessName: "text", bio: "text", "services.name": "text", "services.tags": "text", "services.description": "text" });
profiles.insertMany([
  {
    vendorId: "44444444-4444-4444-4444-444444444444",
    businessName: "Rohan Sound & Light",
    category: "Audio Visual",
    serviceAreas: ["Bengaluru", "Mysuru"],
    bio: "Conference and wedding production team specialising in reliable event technology.",
    services: [{ serviceId: "66666666-6666-6666-6666-666666666666", name: "Conference AV Package", tags: ["sound", "projector", "microphones", "stage lighting"], description: "Professional sound, stage lighting, microphones, projector and on-site technician.", priceBand: "PREMIUM" }],
    portfolio: [{ title: "Tech Summit 2026", url: "https://example.com/portfolio/tech-summit" }],
    faq: [{ question: "Do you provide an on-site technician?", answer: "Yes, for the complete package." }],
    updatedAt: new Date("2026-10-27T00:00:00Z")
  },
  {
    vendorId: "55555555-5555-5555-5555-555555555555",
    businessName: "Maya Gourmet Catering",
    category: "Catering",
    serviceAreas: ["Bengaluru", "Tumakuru"],
    bio: "Custom vegetarian menus for conferences, weddings, and formal celebrations.",
    services: [{ serviceId: "77777777-7777-7777-7777-777777777777", name: "Premium Vegetarian Buffet", tags: ["vegetarian", "buffet", "desserts", "service staff"], description: "Vegetarian buffet with regional starters, main course, desserts and service staff.", priceBand: "PREMIUM" }],
    portfolio: [{ title: "PES Alumni Dinner", url: "https://example.com/portfolio/alumni-dinner" }],
    faq: [{ question: "Can menus be customised?", answer: "Yes, menus are finalised after a guest and budget consultation." }],
    updatedAt: new Date("2026-10-27T00:00:00Z")
  }
]);

// Example NoSQL aggregation: keyword and city discovery
profiles.aggregate([
  { $match: { $text: { $search: "projector sound" }, serviceAreas: "Bengaluru" } },
  { $set: { relevance: { $meta: "textScore" } } },
  { $project: { _id: 0, vendorId: 1, businessName: 1, category: 1, relevance: 1, services: 1 } },
  { $sort: { relevance: -1 } }
]);
