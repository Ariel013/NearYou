type DeviceOrientationEventWithPerm = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export async function requestCompassPermission(): Promise<boolean> {
  const DOE = DeviceOrientationEvent as DeviceOrientationEventWithPerm;
  if (typeof DOE.requestPermission !== "function") return true; // Android / desktop
  try {
    const result = await DOE.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}
