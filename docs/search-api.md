# QuickCourt Search & Discovery API

## Phase 2A: Enhanced Search & Discovery

This document covers the advanced search and discovery APIs for the QuickCourt platform.

---

## Table of Contents

1. [Advanced Search API](#1-advanced-search-api)
2. [Search Suggestions API](#2-search-suggestions-api)
3. [Nearby Venues API](#3-nearby-venues-api)

---

## 1. Advanced Search API

**Endpoint:** `GET /api/venues/search`

Comprehensive venue search with multiple filters and sorting options.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Text search across name, description, city, address |
| `city` | string | No | Filter by city name |
| `state` | string | No | Filter by state name |
| `sportType` | string | No | Filter by sport type (BADMINTON, TENNIS, etc.) |
| `amenities` | string | No | Comma-separated amenity IDs |
| `minPrice` | number | No | Minimum price per hour |
| `maxPrice` | number | No | Maximum price per hour |
| `latitude` | number | No | User's latitude for distance calculation |
| `longitude` | number | No | User's longitude for distance calculation |
| `radius` | number | No | Search radius in km (requires lat/lng) |
| `sortBy` | string | No | Sort option (see below) |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Results per page (default: 10, max: 50) |

### Sort Options

- `relevance` - Best match first (default)
- `price_low` - Cheapest courts first
- `price_high` - Most expensive first
- `rating` - Highest rated first
- `newest` - Recently added first
- `popular` - Most courts first
- `distance` - Nearest first (requires lat/lng)

### Example Request

```bash
# Search for badminton venues in Delhi with parking, sorted by rating
curl "http://localhost:3000/api/venues/search?search=badminton&city=Delhi&amenities=amenity-001&sortBy=rating&limit=10"
```

### Example Response

```json
{
  "success": true,
  "data": {
    "venues": [
      {
        "id": "facility-001",
        "name": "Sports Arena Delhi",
        "description": "Premium badminton facility",
        "address": "123 Sports Complex Road",
        "city": "Delhi",
        "state": "Delhi",
        "pincode": "110001",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "thumbnail": "https://example.com/photo.jpg",
        "owner": {
          "id": "owner-001",
          "name": "John Doe"
        },
        "sportTypes": ["BADMINTON", "TABLE_TENNIS"],
        "priceRange": {
          "min": 300,
          "max": 500
        },
        "averageRating": 4.5,
        "reviewCount": 25,
        "courtCount": 4,
        "amenities": [
          {
            "id": "amenity-001",
            "name": "Parking",
            "icon": "parking"
          }
        ],
        "distance": 2.3,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasMore": true
    },
    "filters": {
      "search": "badminton",
      "city": "Delhi",
      "sportType": null,
      "amenities": ["amenity-001"],
      "priceRange": null,
      "location": null,
      "sortBy": "rating"
    }
  }
}
```

---

## 2. Search Suggestions API

**Endpoint:** `GET /api/venues/suggestions`

Provides autocomplete suggestions for the search bar.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search term (min 2 characters) |
| `type` | string | No | Filter type: `all`, `venues`, `cities`, `sports` (default: all) |
| `limit` | number | No | Max results per category (default: 5, max: 10) |

### Example Request

```bash
# Get suggestions for "bad"
curl "http://localhost:3000/api/venues/suggestions?query=bad&type=all&limit=5"
```

### Example Response

```json
{
  "success": true,
  "data": {
    "suggestions": {
      "venues": [
        {
          "id": "facility-001",
          "name": "Badminton Arena",
          "city": "Delhi",
          "type": "venue"
        }
      ],
      "cities": [
        {
          "name": "Badaun",
          "type": "city"
        }
      ],
      "sports": [
        {
          "name": "BADMINTON",
          "venueCount": 15,
          "type": "sport"
        }
      ]
    },
    "total": 3
  }
}
```

---

## 3. Nearby Venues API

**Endpoint:** `GET /api/venues/nearby`

Finds venues near a given location using geolocation.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `latitude` | number | Yes | User's latitude |
| `longitude` | number | Yes | User's longitude |
| `radius` | number | No | Search radius in km (default: 10, max: 50) |
| `sportType` | string | No | Filter by sport type |
| `limit` | number | No | Max results (default: 10, max: 20) |

### Example Request

```bash
# Find venues within 5km of Delhi center
curl "http://localhost:3000/api/venues/nearby?latitude=28.6139&longitude=77.2090&radius=5"

# Find badminton courts nearby
curl "http://localhost:3000/api/venues/nearby?latitude=28.6139&longitude=77.2090&radius=10&sportType=BADMINTON"
```

### Example Response

```json
{
  "success": true,
  "data": {
    "venues": [
      {
        "id": "facility-001",
        "name": "Sports Arena Delhi",
        "address": "123 Sports Complex Road",
        "city": "Delhi",
        "latitude": 28.6145,
        "longitude": 77.2095,
        "thumbnail": "https://example.com/photo.jpg",
        "sportTypes": ["BADMINTON", "TENNIS"],
        "priceRange": {
          "min": 300,
          "max": 500
        },
        "averageRating": 4.5,
        "reviewCount": 25,
        "amenities": [
          {
            "id": "amenity-001",
            "name": "Parking",
            "icon": "parking"
          }
        ],
        "distance": 0.8,
        "distanceText": "800m away"
      }
    ],
    "search": {
      "latitude": 28.6139,
      "longitude": 77.2090,
      "radius": 5,
      "sportType": null
    },
    "count": 5,
    "message": null
  }
}
```

---

## Implementation Notes

### Distance Calculation (Haversine Formula)

The nearby venues API uses the Haversine formula to calculate distances:

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)
c = 2 × atan2(√a, √(1−a))
distance = R × c
```

Where R = 6371 km (Earth's radius)

### Amenity Filtering

Amenities are filtered using AND logic - venues must have ALL specified amenities:

```
?amenities=amenity-001,amenity-002
```

Returns venues that have BOTH Parking AND WiFi.

### Price Range Filtering

Price filtering works on court prices within a venue:

- `minPrice=200` - At least one court costs ≥ ₹200/hour
- `maxPrice=500` - At least one court costs ≤ ₹500/hour
- Both together - At least one court in range ₹200-500/hour

---

## Sport Types (Enum Values)

- `BADMINTON`
- `TENNIS`
- `BASKETBALL`
- `FOOTBALL`
- `CRICKET`
- `VOLLEYBALL`
- `TABLE_TENNIS`
- `SQUASH`
- `SWIMMING`
- `GYM`
- `YOGA`
- `OTHER`

---

## Error Responses

### Invalid Parameters (400)

```json
{
  "success": false,
  "message": "Invalid search parameters",
  "errors": [
    {
      "field": "latitude",
      "message": "Expected number, received nan"
    }
  ]
}
```

### Server Error (500)

```json
{
  "success": false,
  "message": "Internal server error"
}
```
