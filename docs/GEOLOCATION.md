# Geolocation integration

## Current scope

TOIC uses `@capacitor/geolocation` 8.2.0 to center the OpenStreetMap view on
the device's current position.

The application:

- starts location access only after the user selects **Center on my location**;
- checks and requests native foreground permission when necessary;
- uses the browser permission flow on regular web origins;
- requests the optional extension permission from the same button gesture;
- retrieves one position with a 15-second timeout;
- displays an ephemeral current-position marker and reported accuracy;
- does not save the position to IndexedDB or localStorage;
- does not run a location watcher or request background access.

Permission denial, disabled location services, timeout, invalid coordinates,
and general unavailability have localized English and Croatian messages.

## Adapter contract

`src/data/geolocation.js` isolates Capacitor and browser differences. It returns:

```js
{
  latitude: number,
  longitude: number,
  accuracy: number | null,
  timestamp: number
}
```

The map receives this object as transient UI state. This boundary is intended
to support a future automatic proximity mode without coupling the domain
calculator to a native plugin.

## Android permissions

After the Android Capacitor platform is added, place these entries in
`android/app/src/main/AndroidManifest.xml`, directly under `<manifest>` and
outside `<application>`:

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

Do not mark GPS hardware as required: manual calculation and map CRUD remain
usable on a device without GPS. Android 12 and newer may grant only approximate
location; the adapter accepts that result and reports its accuracy.

## iOS privacy descriptions

After the iOS Capacitor platform is added, place both keys in
`ios/App/App/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>TOIC uses your location to center the transmitter map.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>TOIC uses your location to center the transmitter map.</string>
```

The official plugin requires both descriptions because of its underlying iOS
location dependency, although TOIC itself requests and uses only foreground
location.

## Web and extension permissions

Standard web geolocation requires a secure context (`https://`) except during
localhost development. The browser controls the permission dialog.

The Manifest V3 and legacy Manifest V2 definitions declare:

```json
{
  "optional_permissions": ["geolocation"]
}
```

The permission is requested from the location-button gesture instead of at
extension installation time.

## Native platform status

The repository currently contains the Capacitor web bundle but does not contain
generated `android/` or `ios/` projects. Therefore the native manifest and
Info.plist entries above become actionable when the selected native platform is
added. After adding one:

```bash
npm run build
npx cap sync
```

Then verify the platform-specific file before running the native application on
a physical device.

## Future automatic mode

Automatic proximity calculations are intentionally not implemented yet. That
mode should:

1. explain why continuous location is needed;
2. start `watchPosition` only while automatic mode is enabled;
3. clear the watcher immediately when disabled or suspended;
4. define distance and accuracy thresholds;
5. avoid background collection unless separately designed and consented to;
6. feed nearby saved transmitters into the existing pure `calculateIm3`
   function.
