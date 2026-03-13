# Donate2Cause - Explore Page & Cause Details Plan

## 1. Project Overview

Add two new pages to the existing Donate2Cause website:
- **Explore Page** - Browse and filter all fundraising causes
- **Cause Details Page** - Individual cause with full story and donation CTA

Also fix the existing mobile navigation toggle which currently doesn't work.

---

## 2. Data Model

### File: `data/causes.json`

```json
{
  "causes": [
    {
      "id": "cause-001",
      "title": "Emergency Surgery for 8-Year-Old Priya",
      "shortDescription": "Help young Priya get the life-saving surgery she needs",
      "fullStory": "Detailed story with paragraphs...",
      "category": "medical",
      "goalAmount": 500000,
      "raisedAmount": 325000,
      "donorCount": 142,
      "daysLeft": 12,
      "status": "active",
      "featured": true,
      "beneficiary": {
        "name": "Priya Sharma",
        "age": 8,
        "location": "Kavrepalanchok, Bagmati"
      },
      "organizer": {
        "name": "Ram Shrestha",
        "relationship": "Father",
        "verified": true
      },
      "imageUrl": "assets/medical_emergency.png",
      "createdAt": "2026-03-01",
      "updates": [
        {
          "date": "2026-03-10",
          "title": "Surgery scheduled",
          "content": "Good news! The surgery has been scheduled..."
        }
      ]
    }
  ],
  "categories": [
    { "id": "all", "name": "All Causes", "icon": "solar:grid-bold" },
    { "id": "medical", "name": "Medical", "icon": "solar:health-bold" },
    { "id": "education", "name": "Education", "icon": "solar:book-bold" },
    { "id": "community", "name": "Community", "icon": "solar:users-group-two-rounded" },
    { "id": "emergency", "name": "Emergency", "icon": "solar:alert-bold" }
  ]
}
```

---

## 3. File Structure

```
Donate2CauseWebsite/
├── index.html           # Updated: CTAs link to explore.html
├── explore.html         # NEW: Browse all causes
├── cause.html           # NEW: Individual cause details
├── data/
│   └── causes.json      # NEW: 8 dummy causes
├── js/
│   ├── explore.js       # NEW: Load, filter, render causes
│   └── scripts.js       # Updated: Add nav toggle
├── styles.css           # Updated: Add nav + card styles
└── assets/              # Existing images
    ├── medical_emergency.png
    ├── education_rural.png
    ├── community_development.png
    ├── diaspora_connection.png
    ├── hero_himalayas.png
    └── payment_security.png
```

---

## 4. Page Specifications

### 4.1 Explore Page (explore.html)

**Header:**
- Same as index.html (logo + working mobile nav)
- Logo links to index.html

**Hero Section:**
- Title: "Discover Causes That Matter"
- Subtitle: "Join thousands of donors making a difference in Nepal"
- Stats: "₹48M+ raised • 2,587 families helped • 450+ projects"

**Filter Bar:**
- Category chips: All, Medical, Education, Community, Emergency
- Sort dropdown: Featured, Newest, Most Funded, Ending Soon
- Both filter and sort update the grid dynamically

**Cause Grid:**
- Responsive: 1 col mobile, 2 col tablet, 3 col desktop
- Card design:
  - Image with category badge overlay (top-left)
  - Title (max 2 lines)
  - Short description (max 2 lines)
  - Progress bar (green fill based on %)
  - Amount: "₹325,000 raised of ₹500,000"
  - Meta: "142 donors • 12 days left"
  - "View Cause" button → cause.html?id=cause-001

**Footer:**
- Same as index.html

---

### 4.2 Cause Details Page (cause.html)

**Header:** Same as explore.html

**Hero Section:**
- Full-width cover image
- Category badge (top-left overlay)
- Breadcrumb: Home > Explore > Medical
- Title: Large heading
- Organizer info: "Organized by Ram Shrestha (Father) • Verified ✓"

**Content Grid (2-column on desktop):**

*Left Column (65%):*
- **Story Section:** Full description with paragraphs
- **Updates Timeline:** List of updates with date, title, content
- **Organizer Card:** Name, relationship, verified badge, message

*Right Column (35%) - Sticky:*
- **Progress Card:**
  - Amount raised (large, bold): "₹325,000"
  - Goal amount: "of ₹500,000 goal"
  - Progress bar (% filled)
  - "65% funded"
- **Stats:** "142 donors • 12 days left"
- **Donation Section:**
  - Preset buttons: ₹500, ₹1000, ₹2000
  - Custom amount input
  - "Donate Now" button (primary CTA - lime-400)
- **Share Section:** Facebook, WhatsApp, Copy Link
- **Trust Indicators:** Verified badge, secure payment icons (eSewa, Khalti)

**Footer:** Same as index.html

---

## 5. Navigation Updates

### 5.1 Mobile Navigation Toggle Fix

**Current Issue:**
- Hamburger button exists but has no click handler
- No mobile menu content

**Solution:**
1. Add mobile navigation drawer HTML (hidden by default)
2. Add JavaScript to toggle open/close
3. Add CSS for slide-in animation

**HTML Changes:**
- Add mobile menu container inside header
- Add `data-mobile-nav` attribute to toggle button
- Add close button in mobile menu

**JavaScript (scripts.js):**
- Add click handler for hamburger button
- Toggle `open` class on mobile nav
- Close on link click or close button

**CSS (styles.css):**
- Mobile nav: fixed, right: 0, top: 0, full height
- Transform translateX for slide animation
- Backdrop overlay when open

---

### 5.2 CTA Link Updates (index.html)

| Location | Current | Change To |
|----------|---------|-----------|
| Header nav "Home" | `#` | index.html |
| Header nav "Causes" | `#medical` | explore.html |
| Header nav "About" | `#about` | #about |
| Header nav "How It Works" | `#how-it-works` | #how-it-works |
| Header nav "Contact" | `#start` | #start |
| Hero "Donate now" button | `#` | explore.html |
| Hero "Watch Video" button | `#` | # (keep as is) |
| Hero card - Success Rate | #medical | explore.html?category=medical |
| Hero card - Medical image | #medical | explore.html?category=medical |
| Hero card - Community | #community | explore.html?category=community |
| Hero card - Education | #education | explore.html?category=education |
| Hero card - Explore More | #about | explore.html |
| Problem section | - | No change |
| Solution section | - | No change |
| How It Works CTA | - | No change |
| Final CTA "Start Fundraiser" | # | explore.html |
| Final CTA "Become Partner" | # | # (keep as is) |

---

## 6. Dummy Data (8 Causes)

| # | ID | Title | Category | Goal | Raised | Days | Image |
|---|-----|-------|----------|------|--------|------|-------|
| 1 | cause-001 | Emergency Surgery for 8-Year-Old Priya | medical | ₹500,000 | ₹325,000 | 12 | medical_emergency.png |
| 2 | cause-002 | Education Supplies for Kaski Rural School | education | ₹150,000 | ₹89,000 | 24 | education_rural.png |
| 3 | cause-003 | Clean Water Project for Sindhuli Village | community | ₹300,000 | ₹45,000 | 45 | community_development.png |
| 4 | cause-004 | Flood Relief - Sindhuli District | emergency | ₹1,000,000 | ₹720,000 | 8 | diaspora_connection.png |
| 5 | cause-005 | Scholarship Fund for 10 Students | education | ₹200,000 | ₹34,000 | 60 | education_rural.png |
| 6 | cause-006 | Cancer Treatment for Radhika | medical | ₹800,000 | ₹456,000 | 18 | medical_emergency.png |
| 7 | cause-007 | Rural Road Construction Project | community | ₹500,000 | ₹12,000 | 90 | community_development.png |
| 8 | cause-008 | Elderly Care Home - Monthly Support | medical | ₹250,000 | ₹178,000 | 30 | medical_emergency.png |

---

## 7. Filtering Logic (explore.js)

```javascript
// URL params: ?category=medical&sort=most-funded

// Filter by category
const filtered = causes.filter(cause => 
  selectedCategory === 'all' || cause.category === selectedCategory
);

// Sort options
switch(sortBy) {
  case 'featured': // featured first, then by raised
  case 'newest': // by createdAt desc
  case 'most-funded': // by raisedAmount desc
  case 'ending-soon': // by daysLeft asc
}

// Render grid
filtered.forEach(cause => {
  // Create card HTML
  // Append to grid container
});
```

---

## 8. Implementation Order

1. **Create data/causes.json** - 8 dummy causes with full metadata
2. **Fix mobile navigation** - Add HTML, JS, CSS for toggle
3. **Create js/explore.js** - Load data, filter, sort, render functions
4. **Create explore.html** - Page with grid and filters
5. **Create cause.html** - Individual cause details page
6. **Update index.html** - Change CTAs to link to explore.html
7. **Test** - Verify all links work, filtering works, nav toggle works

---

## 9. Design Consistency

- Use existing color palette (zinc, lime-400, emerald)
- Use existing fonts (Playfair Display for headings, Inter for body)
- Use existing icon set (iconify solar icons)
- Match card styles to index.html hero cards
- Use same parallax and animation effects where appropriate
- Responsive breakpoints: mobile (<640px), tablet (640-1024px), desktop (>1024px)

---

## 10. Future Enhancements (Out of Scope)

- Real donation flow with payment gateway
- User authentication
- Campaign creation form
- Admin dashboard
- Search functionality
- Analytics tracking
