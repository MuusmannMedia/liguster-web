// Platform-fallback til Expo Router, så .web.tsx bruges i web-builds
import WebScreen from "./Beskeder.web";

export default WebScreen;
export const options = { headerShown: false };