import { router } from "expo-router";
import { useEffect } from "react";
export default function NabolagWebRedirect() {
  useEffect(() => { router.replace("/(protected)/Nabolag"); }, []);
  return null;
}