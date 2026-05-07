import type { Request, Response } from 'express';

export const fetchPharmacies = async (req: Request, res: Response) => {
    const { latitude, longitude, radius } = req.query as { latitude?: string; longitude?: string; radius?: string };

    if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const searchRadius = parseInt(radius || '2000', 10);

    if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'Invalid latitude or longitude.' });
    }

    const query = `
[out:json][timeout:25];
(
  node["amenity"="pharmacy"](around:${searchRadius},${lat},${lon});
  way["amenity"="pharmacy"](around:${searchRadius},${lat},${lon});
  relation["amenity"="pharmacy"](around:${searchRadius},${lat},${lon});
);
out center;
`;

    try {
        // Try a list of Overpass endpoints (some instances may reject requests from certain hosts)
        const endpoints = [
            'https://overpass-api.de/api/interpreter',
            'https://lz4.overpass-api.de/api/interpreter',
            'https://overpass.kumi.systems/api/interpreter',
        ];

        let lastError: any = null;
        let fetchResponse: any = null;

        for (const endpoint of endpoints) {
            try {
                fetchResponse = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain',
                        'Accept': 'application/json',
                        'User-Agent': 'marsakit-backend/1.0 (+https://github.com/charlesczar/salaMars)'
                    },
                    body: query,
                });

                if (!fetchResponse.ok) {
                    const text = await fetchResponse.text();
                    console.warn(`Overpass endpoint ${endpoint} returned ${fetchResponse.status}: ${text}`);
                    lastError = { status: fetchResponse.status, text };
                    fetchResponse = null;
                    continue; // try next endpoint
                }

                // success
                const data = await fetchResponse.json();
                return res.status(200).json(data);
            } catch (err) {
                console.warn(`Failed to call Overpass endpoint ${endpoint}:`, err);
                lastError = err;
                fetchResponse = null;
                // try next endpoint
            }
        }

        console.error('All Overpass endpoints failed', lastError);
        return res.status(502).json({ error: 'Failed to fetch pharmacies from Overpass API.' });
    } catch (error) {
        console.error('Unexpected error fetching pharmacies:', error);
        return res.status(500).json({ error: 'Failed to fetch pharmacies.' });
    }
};
