import { loadSessionFromText } from "@/lib/driver-route/importSession";
import { transformSessionToDriverRoute } from "@/lib/driver-route/transformSession";

export const ROUTE_UPLOAD_ERROR_KEY = "routeUploadError";

export function parseRouteUploadText(text: string) {
  const session = loadSessionFromText(text);
  return transformSessionToDriverRoute(session);
}
