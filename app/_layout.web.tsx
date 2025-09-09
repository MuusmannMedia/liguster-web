import { Slot } from "expo-router";
import Head from "expo-router/head";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function RootWebLayout() {
  return (
    <View style={styles.page}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Allow scrolling and force-hide ANY legacy footer elements */}
        <style>{`
          html, body, #root, #__next { height: auto !important; overflow: auto !important; }
          body { margin: 0; -webkit-overflow-scrolling: touch; background: #7C8996; }
          /* Nuke every possible footer hook */
          footer, .footer, #footer, .bottom-nav, #bottom-nav, [data-footer],
          [role="contentinfo"] { display: none !important; }
        `}</style>
      </Head>
      {/* No navbar/footer here – those live in (public)/_layout.web.tsx and (protected)/_layout.web.tsx */}
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#7C8996" },
});