<template>
  <div class="map-shell">
    <div ref="mapElement" class="map" aria-label="Map of meat shops in Oriental Mindoro"></div>
    <span class="map-label">Oriental Mindoro</span>
  </div>
</template>

<script setup lang="ts">
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

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
let map: L.Map | undefined;
let marker: L.Marker | undefined;
let shopMarkers: L.LayerGroup | undefined;

const orientalMindoroBounds = L.latLngBounds(
  [12.35, 120.95],
  [13.65, 121.8],
);

onMounted(() => {
  if (!mapElement.value) return;
  map = L.map(mapElement.value, { zoomControl: false }).setView([props.latitude, props.longitude], 10);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);
  shopMarkers = L.layerGroup().addTo(map);
  renderShopMarkers();
  if (props.selectable) {
    map.on('click', (event) => {
      marker?.remove();
      marker = L.marker(event.latlng).addTo(map!);
      emit('selected', event.latlng.lat, event.latlng.lng);
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
    L.marker([shop.latitude!, shop.longitude!])
      .bindPopup(`<strong>${shop.name}</strong><br>${shop.address}`)
      .addTo(shopMarkers!);
  });
  if (locations.length > 1) {
    map.fitBounds(
      L.latLngBounds(locations.map((shop) => [shop.latitude!, shop.longitude!])),
      { padding: [28, 28], maxZoom: 14 },
    );
  } else if (locations.length === 1) {
    map.setView([locations[0].latitude!, locations[0].longitude!], 14);
  } else {
    map.fitBounds(orientalMindoroBounds, { padding: [12, 12] });
  }
}

onBeforeUnmount(() => map?.remove());
</script>

<style scoped>
.map-shell {
  position: relative;
}
.map {
  border-radius: 14px;
  height: 360px;
  overflow: hidden;
  width: 100%;
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
</style>
