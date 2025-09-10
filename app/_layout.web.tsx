import { Slot } from "expo-router";
import Head from "expo-router/head";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function RootWebLayout() {
  return (
    <View style={styles.page}>
      <Head>
        {/* Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Favicons */}
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Styling overrides */}
        <style>{`
          html, body, #root, #__next {
            height: auto !important;
            overflow: auto !important;
          }
          body {
            margin: 0;
            -webkit-overflow-scrolling: touch;
            background: #7C8996;
          }
          /* Fjern evt. uønskede footere */
          footer, .footer, #footer, .bottom-nav, #bottom-nav, [data-footer],
          [role="contentinfo"] {
            display: none !important;
          }
        `}</style>
      </Head>

      {/* Indsætter den aktive route */}
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#7C8996",
  },
});