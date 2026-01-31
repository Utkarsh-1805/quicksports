# QuickCourt Search & Discovery API

## Phase 8: Advanced Search & Filtering

This document covers the advanced search and discovery APIs for the QuickCourt platform.

---

## Table of Contents

1. [Advanced Search API](#1-advanced-search-api)
2. [Search Suggestions API](#2-search-suggestions-api)
3. [Nearby Venues API](#3-nearby-venues-api)
4. [Trending Venues API](#4-trending-venues-api)
5. [Featured Cities API](#5-featured-cities-api)
6. [Filter Options API](#6-filter-options-api)
7. [Availability Search API](#7-availability-search-api)
8. [Popular Sports API](#8-popular-sports-api)
9. [Similar Venues API](#9-similar-venues-api)
10. [Search Analytics API (Admin)](#10-search-analytics-api-admin)

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
| `minRating` | number | No | Minimum rating (1-5) |
| `hasReviews` | string | No | Filter by review presence: `true` or `false` |
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
- `reviews` - Most reviewed first
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

## 4. Trending Venues API

**Endpoint:** `GET /api/venues/trending`

Get trending venues based on recent booking activity and ratings.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Max results (default: 10, max: 50) |
| `city` | string | No | Filter by city |
| `sportType` | string | No | Filter by sport type |
| `includeSports` | string | No | Include popular sports (true/false) |

### Example Request

```bash
curl "http://localhost:3000/api/venues/trending?limit=10&includeSports=true"
```

### Example Response

```json
{
  "success": true,
  "message": "Trending venues fetched successfully",
  "data": {
    "venues": [
      {
        "id": "facility-001",
        "name": "Sports Arena Delhi",
        "city": "Delhi",
        "address": "123 Sports Complex Road",
        "photo": "https://example.com/photo.jpg",
        "rating": 4.5,
        "reviewCount": 25,
        "bookingsThisMonth": 150,
        "minPrice": 300,
        "sports": ["BADMINTON", "TENNIS"],
        "amenities": ["Parking", "AC"],
        "trendingScore": 345
      }
    ],
    "popularSports": [
      {
        "sport": "BADMINTON",
        "courtCount": 50,
        "bookingsThisMonth": 500,
        "popularityScore": 1050
      }
    ]
  }
}
```

---

## 5. Featured Cities API

**Endpoint:** `GET /api/venues/cities`

Get featured cities with venue counts and available sports.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Max results (default: 10, max: 50) |

### Example Request

```bash
curl "http://localhost:3000/api/venues/cities?limit=10"
```

### Example Response

```json
{
  "success": true,
  "message": "Featured cities fetched successfully",
  "data": {
    "cities": [
      {
        "city": "Delhi",
        "venueCount": 45,
        "sportsAvailable": ["BADMINTON", "TENNIS", "CRICKET"],
        "priceRange": {
          "min": 200,
          "max": 1500,
          "avg": 450
        }
      }
    ],
    "total": 10
  }
}
```

---

## 6. Filter Options API

**Endpoint:** `GET /api/venues/filters`

Get available filter options for search UI (cities, sports, amenities, price range).

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `city` | string | No | Get filters specific to a city |

### Example Request

```bash
curl "http://localhost:3000/api/venues/filters?city=Delhi"
```

### Example Response

```json
{
  "success": true,
  "message": "Filter options fetched successfully",
  "data": {
    "cities": ["Delhi", "Mumbai", "Bangalore", "Chennai"],
    "sports": ["BADMINTON", "TENNIS", "BASKETBALL", "CRICKET"],
    "amenities": [
      { "id": "amenity-001", "name": "Parking", "icon": "parking" },
      { "id": "amenity-002", "name": "AC", "icon": "ac" }
    ],
    "priceRange": {
      "min": 100,
      "max": 2000
    }
  }
}
```

---

## 7. Availability Search API

**Endpoint:** `POST /api/venues/search/available`

Search venues with real-time availability for a specific date/time.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | No | Date to check (YYYY-MM-DD) |
| `startTime` | string | No | Start time (HH:MM) |
| `endTime` | string | No | End time (HH:MM) |
| `sportType` | string | No | Filter by sport |
| `city` | string | No | Filter by city |
| `latitude` | number | No | User latitude |
| `longitude` | number | No | User longitude |
| `radius` | number | No | Search radius in km |
| `minPrice` | number | No | Minimum price |
| `maxPrice` | number | No | Maximum price |
| `page` | number | No | Page number |
| `limit` | number | No | Results per page |

### Example Request

```bash
curl -X POST "http://localhost:3000/api/venues/search/available" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-02-15",
    "startTime": "18:00",
    "endTime": "21:00",
    "sportType": "BADMINTON",
    "city": "Delhi",
    "page": 1,
    "limit": 10
  }'
```

### Example Response

```json
{
  "success": true,
  "message": "Venues with availability fetched successfully",
  "data": {
    "venues": [
      {
        "id": "facility-001",
        "name": "Sports Arena Delhi",
        "city": "Delhi",
        "address": "123 Sports Complex",
        "photo": "https://example.com/photo.jpg",
        "rating": 4.5,
        "reviewCount": 25,
        "distance": null,
        "minPrice": 300,
        "sports": ["BADMINTON"],
        "amenities": ["Parking", "AC"],
        "courtCount": 4,
        "availableCourts": 3,
        "matchingSlots": [
          {
            "courtId": "court-001",
            "courtName": "Court 1",
            "sportType": "BADMINTON",
            "price": 300,
            "startTime": "18:00",
            "endTime": "19:00"
          }
        ],
        "hasAvailability": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

## 8. Popular Sports API

**Endpoint:** `GET /api/sports/popular`

Get popular sports ranked by court count and booking activity.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `city` | string | No | Filter by city |

### Example Request

```bash
curl "http://localhost:3000/api/sports/popular?city=Delhi"
```

### Example Response

```json
{
  "success": true,
  "message": "Popular sports fetched successfully",
  "data": {
    "sports": [
      {
        "sport": "BADMINTON",
        "courtCount": 50,
        "bookingsThisMonth": 500,
        "popularityScore": 1050
      },
      {
        "sport": "TENNIS",
        "courtCount": 30,
        "bookingsThisMonth": 200,
        "popularityScore": 430
      }
    ],
    "city": "Delhi"
  }
}
```

---

## 9. Similar Venues API

**Endpoint:** `GET /api/venues/:id/similar`

Get venues similar to a specific venue based on sports, amenities, and location.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Venue ID |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Max results (default: 5, max: 20) |

### Example Request

```bash
curl "http://localhost:3000/api/venues/facility-001/similar?limit=5"
```

### Example Response

```json
{
  "success": true,
  "message": "Similar venues fetched successfully",
  "data": {
    "referenceVenue": "Sports Arena Delhi",
    "venues": [
      {
        "id": "facility-002",
        "name": "Badminton Hub",
        "city": "Delhi",
        "photo": "https://example.com/photo.jpg",
        "rating": 4.3,
        "reviewCount": 18,
        "minPrice": 350,
        "sports": ["BADMINTON"],
        "amenities": ["Parking", "Cafeteria"],
        "similarityScore": 15
      }
    ]
  }
}
```

---

## 10. Search Analytics API (Admin)

**Endpoint:** `GET /api/admin/analytics/search`

Get search and inventory analytics (Admin only).

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Bearer token (Admin) |

### Example Request

```bash
curl "http://localhost:3000/api/admin/analytics/search" \
  -H "Authorization: Bearer <admin_token>"
```

### Example Response

```json
{
  "success": true,
  "message": "Search analytics fetched successfully",
  "data": {
    "inventory": {
      "totalVenues": 150,
      "totalCourts": 450,
      "activeCourts": 420,
      "inactiveCourts": 30
    },
    "geography": {
      "topCities": [
        { "city": "Delhi", "venueCount": 45 },
        { "city": "Mumbai", "venueCount": 38 },
        { "city": "Bangalore", "venueCount": 32 }
      ]
    },
    "sports": [
      { "sport": "BADMINTON", "courtCount": 180 },
      { "sport": "TENNIS", "courtCount": 95 }
    ],
    "pricing": {
      "minPrice": 100,
      "maxPrice": 2500,
      "avgPrice": 450
    }
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
