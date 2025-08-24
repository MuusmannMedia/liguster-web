import React from "react";
import WebPage from "../../components/WebPage";
import BeskederScreen from "../Beskeder";

export default function BeskederWeb() {
  return (
    <WebPage title="Beskeder" description="Dine beskeder på Liguster.">
      <BeskederScreen />
    </WebPage>
  );
}