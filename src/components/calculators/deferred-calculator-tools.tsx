'use client';

import dynamic from 'next/dynamic';

// These tools are rendered only by their matching calculator modes. Keep their
// policy data and map code out of ordinary calculator downloads, with SSR
// retained for the pages that actually use them.
export const VehiclePolicy = dynamic(() => import('./vehicle-policy').then(module => module.VehiclePolicy));
export const RoadLocations = dynamic(() => import('./road-locations').then(module => module.RoadLocations));
export const RoadAttribution = dynamic(() => import('./road-locations').then(module => module.RoadAttribution));
