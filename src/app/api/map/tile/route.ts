import { NextRequest, NextResponse } from 'next/server';

// Server-side Tile Proxy: Eliminates CORS, Browser AdBlocker, and ISP blocking issues
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const theme = searchParams.get('theme') || 'streets';
  const z = searchParams.get('z');
  const x = searchParams.get('x');
  const y = searchParams.get('y');

  if (!z || !x || !y) {
    return new NextResponse('Missing z, x, y tile parameters', { status: 400 });
  }

  const numZ = parseInt(z, 10);
  const numX = parseInt(x, 10);
  const numY = parseInt(y, 10);

  let targetUrl = '';
  let contentType = 'image/png';

  if (theme === 'satellite') {
    // Esri World Imagery uses {z}/{row}/{col} which maps to {z}/{y}/{x}
    targetUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${numZ}/${numY}/${numX}`;
    contentType = 'image/jpeg';
  } else {
    // High-speed OpenStreetMap France tile server
    const sub = ['a', 'b', 'c'][Math.abs(numX + numY) % 3];
    targetUrl = `https://${sub}.tile.openstreetmap.fr/osmfr/${numZ}/${numX}/${numY}.png`;
    contentType = 'image/png';
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EnterpriseTimeAttendance/1.0',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      next: { revalidate: 86400 }, // Cache on server for 24 hours
    });

    if (!upstreamRes.ok) {
      // Fallback to Esri Street Map if OSMFr fails
      if (theme !== 'satellite') {
        const fallbackUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${numZ}/${numY}/${numX}`;
        const fallbackRes = await fetch(fallbackUrl, {
          headers: { 'User-Agent': 'EnterpriseTimeAttendance/1.0' },
        });
        if (fallbackRes.ok) {
          const buffer = await fallbackRes.arrayBuffer();
          return new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=86400, immutable',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      }
      return new NextResponse('Tile not found', { status: upstreamRes.status });
    }

    const buffer = await upstreamRes.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Tile proxy error:', error?.message);
    return new NextResponse('Internal Tile Error', { status: 502 });
  }
}
