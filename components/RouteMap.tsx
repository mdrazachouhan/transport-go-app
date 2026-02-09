import React, { useRef, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import Colors from '@/constants/colors';
import { INDORE_REGION } from '@/lib/locations';

interface RouteMapProps {
  pickup: { name: string; lat: number; lng: number };
  delivery: { name: string; lat: number; lng: number };
}

export default function RouteMap({ pickup, delivery }: RouteMapProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    setTimeout(() => {
      mapRef.current?.fitToCoordinates(
        [
          { latitude: pickup.lat, longitude: pickup.lng },
          { latitude: delivery.lat, longitude: delivery.lng },
        ],
        { edgePadding: { top: 80, right: 60, bottom: 200, left: 60 }, animated: true }
      );
    }, 300);
  }, [pickup, delivery]);

  const routeCoords = [
    { latitude: pickup.lat, longitude: pickup.lng },
    { latitude: (pickup.lat + delivery.lat) / 2 + 0.003, longitude: (pickup.lng + delivery.lng) / 2 + 0.002 },
    { latitude: delivery.lat, longitude: delivery.lng },
  ];

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_DEFAULT}
      initialRegion={INDORE_REGION}
      showsUserLocation={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
    >
      <Marker
        coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
        title={pickup.name}
        pinColor={Colors.success}
      />
      <Marker
        coordinate={{ latitude: delivery.lat, longitude: delivery.lng }}
        title={delivery.name}
        pinColor={Colors.danger}
      />
      <Polyline
        coordinates={routeCoords}
        strokeColor={Colors.primary}
        strokeWidth={4}
        lineDashPattern={[0]}
      />
    </MapView>
  );
}
