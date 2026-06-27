import { loadDriverRouteFromText } from "@/lib/driver-route/importSession";

export const ROUTE_UPLOAD_ERROR_KEY = "routeUploadError";

export function parseRouteUploadText(text: string) {
  return loadDriverRouteFromText(text);
}
