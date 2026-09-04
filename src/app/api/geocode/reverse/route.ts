import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for reverse geocoded coordinates
const geocodeCache = new Map<string, any>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Parameter lat dan lon wajib disertakan.' },
      { status: 400 }
    );
  }

  const numLat = parseFloat(lat);
  const numLon = parseFloat(lon);

  if (isNaN(numLat) || isNaN(numLon)) {
    return NextResponse.json(
      { error: 'Koordinat latitude atau longitude tidak valid.' },
      { status: 400 }
    );
  }

  // Cache key rounded to ~10 meters precision
  const cacheKey = `${numLat.toFixed(4)},${numLon.toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    return NextResponse.json(geocodeCache.get(cacheKey));
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${numLat}&lon=${numLon}&zoom=18&addressdetails=1`;

    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'EnterpriseTimeAttendance/1.0 (support@enterprise-presence.id)',
        'Accept-Language': 'id,en;q=0.8',
      },
      // Cache response for 1 hour
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Nominatim returned status: ${res.status}`);
    }

    const data = await res.json();
    const addr = data.address || {};

    const building =
      addr.building ||
      addr.amenity ||
      addr.office ||
      addr.commercial ||
      addr.shop ||
      addr.leisure ||
      data.name ||
      null;

    const road = addr.road || addr.pedestrian || addr.street || null;
    const suburb = addr.suburb || addr.neighbourhood || addr.village || addr.quarter || null;
    const city = addr.city || addr.town || addr.city_district || addr.county || 'Indonesia';
    const state = addr.state || 'Daerah Khusus Ibukota Jakarta';
    const country = addr.country || 'Indonesia';
    const postcode = addr.postcode || null;

    // Build human-friendly primary line
    let primaryLocation = '';
    if (building && road) {
      primaryLocation = `${building}, ${road}`;
    } else if (building) {
      primaryLocation = building;
    } else if (road) {
      primaryLocation = road;
    } else if (suburb) {
      primaryLocation = `Kawasan ${suburb}`;
    } else {
      primaryLocation = `Area Koordinat (${numLat.toFixed(5)}, ${numLon.toFixed(5)})`;
    }

    // Build secondary area descriptor
    const areaComponents = [suburb, city, state].filter(Boolean);
    const secondaryLocation = areaComponents.join(', ');

    const payload = {
      latitude: numLat,
      longitude: numLon,
      primaryLocation,
      secondaryLocation,
      displayName: data.display_name || `${numLat}, ${numLon}`,
      details: {
        building,
        road,
        suburb,
        city,
        state,
        country,
        postcode,
      },
      raw: data,
    };

    // Store in cache (cap at 200 items)
    if (geocodeCache.size > 200) {
      const firstKey = geocodeCache.keys().next().value;
      if (firstKey) geocodeCache.delete(firstKey);
    }
    geocodeCache.set(cacheKey, payload);

    return NextResponse.json(payload);
  } catch (error: any) {
    console.warn('Reverse geocode fetch error:', error?.message);

    // Fallback response with calculated coordinates
    const fallbackPayload = {
      latitude: numLat,
      longitude: numLon,
      primaryLocation: `Titik GPS (${numLat.toFixed(5)}, ${numLon.toFixed(5)})`,
      secondaryLocation: 'Lokasi Terdeteksi Perangkat',
      displayName: `Koordinat GPS: ${numLat.toFixed(5)}, ${numLon.toFixed(5)}`,
      details: {
        building: null,
        road: 'Jalan / Area Sekitar',
        suburb: null,
        city: 'Indonesia',
        state: 'Indonesia',
        country: 'Indonesia',
        postcode: null,
      },
    };

    return NextResponse.json(fallbackPayload);
  }
}
