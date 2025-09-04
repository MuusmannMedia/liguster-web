// app/(protected)/Nabolag.tsx
import React from "react";
import WebAuthGate from "../components/WebAuthGate"; // (protected) -> components
import Nabolag from "../Nabolag";                     // henter app/Nabolag.tsx

export default function Page() {
  return (
    <WebAuthGate>
      <Nabolag />
    </WebAuthGate>
  );
}