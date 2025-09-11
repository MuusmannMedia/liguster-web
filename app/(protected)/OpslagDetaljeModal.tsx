// Platform-fallback til Expo Router, så .web.tsx kan bruges i web-builds
import WebScreen from "./OpslagDetaljeModal.web";

export default WebScreen;
// Hvis du vil styre header osv., kan du også eksportere options her:
export const options = { headerShown: false };