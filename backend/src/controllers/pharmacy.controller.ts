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
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: query,
        });

        if (!response.ok) {
            console.error(`Overpass API error: ${response.status} ${await response.text()}`);
            return res.status(response.status).json({ error: 'Failed to fetch pharmacies from Overpass API.' });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Failed to fetch pharmacies:', error);
        return res.status(500).json({ error: 'Failed to fetch pharmacies.' });
    }
};
