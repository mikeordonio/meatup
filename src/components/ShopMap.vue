<template>
  <div class="map-shell">
    <div ref="mapElement" class="map" aria-label="Map of meat shops in Oriental Mindoro"></div>
    <div v-if="!shops.length" class="map-empty">No mapped shops yet</div>
    <div class="map-actions">
      <button class="location-button" type="button" :disabled="locating" @click="useCurrentLocation">
        {{ locating ? 'Locating...' : 'Use my location' }}
      </button>
      <button class="map-control" type="button" aria-label="Reset map view" @click="resetView">Reset view</button>
      <span v-if="locationError" class="location-error" role="alert">{{ locationError }}</span>
    </div>
    <span class="map-label">Oriental Mindoro</span>
  </div>
</template>

<script setup lang="ts">
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import type { Shop } from '@/models';

const props = withDefaults(
  defineProps<{
    shops?: Shop[];
    selectable?: boolean;
    latitude?: number;
    longitude?: number;
  }>(),
  { shops: () => [], selectable: false, latitude: 13.0, longitude: 121.4 },
);
const emit = defineEmits<{ selected: [latitude: number, longitude: number] }>();
const mapElement = ref<HTMLElement>();
const locating = ref(false);
const locationError = ref('');
let map: L.Map | undefined;
let marker: L.Marker | undefined;
let userMarker: L.CircleMarker | undefined;
let accuracyCircle: L.Circle | undefined;
let shopMarkers: L.LayerGroup | undefined;
let hasFittedShopLocations = false;

const orientalMindoroBounds = L.latLngBounds(
  [12.35, 120.95],
  [13.65, 121.8],
);

onMounted(() => {
  if (!mapElement.value) return;
  map = L.map(mapElement.value, {
    attributionControl: true,
    maxZoom: 19,
    minZoom: 8,
    zoomControl: false,
  }).setView([props.latitude, props.longitude], 10);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    updateWhenIdle: true,
  }).addTo(map);
  shopMarkers = L.layerGroup().addTo(map);
  renderShopMarkers();
  map.whenReady(() => {
    void nextTick(() => map?.invalidateSize());
  });
  if (props.selectable) {
    map.on('click', (event) => {
      selectLocation(event.latlng.lat, event.latlng.lng);
    });
  }
});

watch(() => props.shops, renderShopMarkers, { deep: true });

function renderShopMarkers(): void {
  if (!map || !shopMarkers) return;
  shopMarkers.clearLayers();
  const locations = props.shops.filter(
    (shop) => typeof shop.latitude === 'number' && typeof shop.longitude === 'number',
  );
  locations.forEach((shop) => {
    const popup = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = shop.name;
    const address = document.createElement('span');
    address.textContent = shop.address;
    popup.append(name, address);
    L.marker([shop.latitude!, shop.longitude!], {
      icon: L.divIcon({
        className: 'shop-pin-wrapper',
        html: '<span class="shop-pin">🥩</span>',
        iconAnchor: [18, 36],
        iconSize: [36, 36],
        popupAnchor: [0, -34],
      }),
      title: shop.name,
    })
      .bindPopup(popup, { closeButton: true, offset: [0, -8] })
      .addTo(shopMarkers!);
  });
  if (locations.length > 1) {
    map.fitBounds(
      L.latLngBounds(locations.map((shop) => [shop.latitude!, shop.longitude!])),
      { padding: [48, 48], maxZoom: 15 },
    );
    hasFittedShopLocations = true;
  } else if (locations.length === 1) {
    map.setView([locations[0].latitude!, locations[0].longitude!], 14);
    hasFittedShopLocations = true;
  } else {
    resetView();
  }
  void nextTick(() => map?.invalidateSize());
}

function selectLocation(latitude: number, longitude: number): void {
  if (!map) return;
  marker?.remove();
  marker = L.marker([latitude, longitude]).addTo(map);
  map.setView([latitude, longitude], Math.max(map.getZoom(), 15));
  emit('selected', latitude, longitude);
}

function useCurrentLocation(): void {
  if (!navigator.geolocation) {
    locationError.value = 'Location services are not available on this device.';
    return;
  }

  locating.value = true;
  locationError.value = '';
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const { latitude, longitude, accuracy } = coords;
      if (!map) {
        locating.value = false;
        locationError.value = 'The map is not ready yet. Please try again.';
        return;
      }
      userMarker?.remove();
      accuracyCircle?.remove();
      userMarker = L.circleMarker([latitude, longitude], {
        color: '#2563eb',
        fillColor: '#2563eb',
        fillOpacity: 1,
        radius: 8,
        weight: 3,
      })
        .bindTooltip('Your location', { direction: 'top', offset: [0, -8] })
        .addTo(map);
      accuracyCircle = L.circle([latitude, longitude], {
        color: '#2563eb',
        fillColor: '#2563eb',
        fillOpacity: 0.12,
        radius: accuracy,
        weight: 1,
      }).addTo(map);
      map.setView([latitude, longitude], 16);
      if (props.selectable) selectLocation(latitude, longitude);
      locating.value = false;
    },
    (error) => {
      locationError.value =
        error.code === error.PERMISSION_DENIED
          ? 'Allow location access in your browser or device settings, then try again.'
          : 'Unable to find your location. Please try again.';
      locating.value = false;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
  );
}

function resetView(): void {
  if (!map) return;
  if (hasFittedShopLocations && props.shops.length) {
    const locations = props.shops.filter(
      (shop) => typeof shop.latitude === 'number' && typeof shop.longitude === 'number',
    );
    if (locations.length > 1) {
      map.fitBounds(L.latLngBounds(locations.map((shop) => [shop.latitude!, shop.longitude!])), {
        padding: [48, 48],
        maxZoom: 15,
      });
    } else if (locations.length === 1) {
      map.setView([locations[0].latitude!, locations[0].longitude!], 14);
    }
    return;
  }
  map.fitBounds(orientalMindoroBounds, { padding: [24, 24] });
}

onBeforeUnmount(() => map?.remove());
</script>

<style scoped>
.map-shell {
  position: relative;
}
.map {
  background: #dcecf4;
  border-radius: 14px;
  height: 360px;
  overflow: hidden;
  width: 100%;
}
.map-empty {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 999px;
  color: var(--meatup-muted);
  font-size: 0.75rem;
  left: 50%;
  padding: 0.5rem 0.75rem;
  pointer-events: none;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 400;
}
.map-label {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 999px;
  box-shadow: 0 2px 10px rgba(37, 37, 37, 0.12);
  color: var(--meatup-primary);
  font-size: 0.75rem;
  font-weight: 800;
  left: 0.75rem;
  padding: 0.45rem 0.7rem;
  pointer-events: none;
  position: absolute;
  top: 0.75rem;
  z-index: 400;
}
.map-actions {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  position: absolute;
  right: 0.75rem;
  top: 0.75rem;
  z-index: 400;
}
.location-button {
  background: white;
  border: 0;
  border-radius: 999px;
  box-shadow: 0 2px 10px rgba(37, 37, 37, 0.16);
  color: var(--meatup-primary);
  cursor: pointer;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.55rem 0.8rem;
}
.map-control {
  background: white;
  border: 0;
  border-radius: 999px;
  box-shadow: 0 2px 10px rgba(37, 37, 37, 0.16);
  color: var(--meatup-text);
  cursor: pointer;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.45rem 0.7rem;
}
.location-button:disabled {
  cursor: wait;
  opacity: 0.65;
}
.location-error {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(37, 37, 37, 0.16);
  color: #b42318;
  font-size: 0.72rem;
  max-width: 220px;
  padding: 0.45rem 0.6rem;
  text-align: right;
}
:global(.shop-pin-wrapper) {
  background: transparent;
  border: 0;
}
:global(.shop-pin) {
  align-items: center;
  background: var(--meatup-primary);
  border: 3px solid white;
  border-radius: 50% 50% 50% 0;
  box-shadow: 0 3px 8px rgba(37, 37, 37, 0.25);
  color: white;
  display: flex;
  font-size: 1rem;
  height: 30px;
  justify-content: center;
  transform: rotate(-45deg);
  width: 30px;
}
:global(.shop-pin::first-letter) {
  transform: rotate(45deg);
}
:global(.leaflet-popup-content) {
  margin: 0.75rem 0.9rem;
}
:global(.leaflet-popup-content strong),
:global(.leaflet-popup-content span) {
  display: block;
}
:global(.leaflet-popup-content strong) {
  color: var(--meatup-primary);
  margin-bottom: 0.25rem;
}
:global(.leaflet-popup-content span) {
  color: var(--meatup-muted);
  font-size: 0.78rem;
}
</style>
