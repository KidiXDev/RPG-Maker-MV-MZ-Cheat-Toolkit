import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { z } from 'zod';
import type { SavedLocation } from '../game/cheats/location.ts';
import { createCheatStorage } from '../game/storage.ts';

const locationSchema = z.object({
  id: z.string(),
  alias: z.string(),
  mapId: z.number(),
  mapName: z.string(),
  x: z.number(),
  y: z.number()
});

type LocationState = {
  locations: SavedLocation[];
  addLocation(location: SavedLocation): void;
  removeLocation(id: string): void;
  renameLocation(id: string, alias: string): void;
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      locations: [],
      addLocation: (location) =>
        set((state) => ({ locations: [location, ...state.locations] })),
      removeLocation: (id) =>
        set((state) => ({ locations: state.locations.filter((location) => location.id !== id) })),
      renameLocation: (id, alias) =>
        set((state) => ({
          locations: state.locations.map((location) =>
            location.id === id ? { ...location, alias } : location
          )
        }))
    }),
    {
      name: 'rmc-cheat-locations',
      partialize: (state) => ({
        locations: z.array(locationSchema).catch([]).parse(state.locations)
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        locations: z
          .object({ locations: z.array(locationSchema).catch([]) })
          .catch({ locations: [] })
          .parse(persistedState).locations
      }),
      storage: createJSONStorage(createCheatStorage)
    }
  )
);
