// app/privacy.web.tsx
import { Link } from "expo-router";
import Head from "expo-router/head";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function WebPrivacy() {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Head>
        <title>Privacy Policy – Liguster</title>
        <meta
          name="description"
          content="Læs Ligusters privatlivspolitik: hvilke data vi indsamler, hvordan vi bruger dem, og dine rettigheder."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Hero / Header */}
      <View style={styles.hero}>
        <View style={styles.heroInner}>
          <Text style={styles.heroEyebrow}>Liguster</Text>
          <Text style={styles.heroTitle}>Privacy Policy</Text>
          <Text style={styles.heroUpdated}>Last updated: August 04, 2025</Text>

          <View style={styles.heroLinks}>
            <Link href="/" style={styles.heroLink}>← Til forsiden</Link>
            <Text style={styles.dot}>·</Text>
            <Link href="/LoginScreen" style={styles.heroLink}>Log ind</Link>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.container}>
        <Section title="Introduction">
          <P>
            This Privacy Policy describes Our policies and procedures on the collection, use and
            disclosure of Your information when You use the Service and tells You about Your privacy
            rights and how the law protects You. We use Your Personal Data to provide and improve
            the Service. By using the Service, You agree to the collection and use of information
            in accordance with this Privacy Policy.
          </P>
        </Section>

        <Section title="Definitions">
          <P><B>Account</B> means a unique account created for You to access our Service.</P>
          <P><B>Application</B> refers to Liguster, the software provided by the Company.</P>
          <P><B>Company</B> (“We”, “Us”, “Our”) refers to Liguster (Country: Denmark).</P>
          <P><B>Device</B> means any device that can access the Service.</P>
          <P><B>Personal Data</B> is any information relating to an identified or identifiable individual.</P>
          <P><B>Service</B> refers to the Application.</P>
          <P><B>Service Provider</B> means any natural or legal person who processes the data on behalf of the Company.</P>
          <P><B>Usage Data</B> refers to data collected automatically by the Service.</P>
          <P><B>You</B> means the individual using the Service, or the entity on whose behalf it is used.</P>
        </Section>

        <Section title="Data We Collect">
          <Sub>Personal Data you provide</Sub>
          <P>• Email address • First name and last name</P>

          <Sub>Usage Data</Sub>
          <P>
            We automatically collect Usage Data, such as IP address, browser type/version, pages visited,
            time and date of visits, time spent, unique identifiers and diagnostics. On mobile we may collect
            device model, OS, and similar diagnostics.
          </P>

          <Sub>Location (with your permission)</Sub>
          <P>
            With your consent, the Application may collect location information to provide features such as
            nearby content. You can enable/disable access at any time in your Device settings.
          </P>
        </Section>

        <Section title="How We Use Your Data">
          <P>
            • To provide and maintain the Service, including monitoring usage.<br />
            • To manage Your Account and provide registered-user functionality.<br />
            • To perform and administer contracts with You.<br />
            • To contact You (email, calls, SMS, or push notifications about updates and service information).<br />
            • To provide news and information about similar services unless you opt out.<br />
            • To manage requests from You and improve Our Service through analysis and research.<br />
            • For business transfers (e.g., merger or acquisition) under appropriate safeguards.
          </P>
        </Section>

        <Section title="Sharing Your Information">
          <P>
            We may share Personal Data with Service Providers, Affiliates, business partners, during business
            transfers, with other users when you share content publicly, and otherwise with Your consent.
          </P>
        </Section>

        <Section title="Retention">
          <P>
            We retain Personal Data only as long as necessary for the purposes set out here, to comply with
            legal obligations, resolve disputes, and enforce agreements. Usage Data is retained for shorter
            periods unless used to strengthen security or improve functionality, or where we are legally
            obliged to retain it longer.
          </P>
        </Section>

        <Section title="International Transfers">
          <P>
            Your information may be processed outside your jurisdiction. We take reasonable steps to ensure
            Your data is treated securely and in accordance with this Policy and applicable safeguards.
          </P>
        </Section>

        <Section title="Your Rights & Deletion">
          <P>
            You can delete certain information in the app, and you may contact us to access, correct, or delete
            Personal Data we hold about you. We may retain some information where required by law or for
            legitimate interests.
          </P>
        </Section>

        <Section title="Disclosure">
          <P>
            We may disclose Personal Data if required by law or in response to valid public authority requests,
            to protect Our rights or property, investigate wrongdoing, protect user safety, or defend against
            legal liability.
          </P>
        </Section>

        <Section title="Security">
          <P>
            We use commercially acceptable means to protect Your Personal Data, but no method of transmission
            or storage is 100% secure.
          </P>
        </Section>

        <Section title="Children’s Privacy">
          <P>
            Our Service is not directed to children under 13. We do not knowingly collect Personal Data from
            children under 13. If you believe a child has provided us data, please contact us.
          </P>
        </Section>

        <Section title="Third-Party Links">
          <P>
            Our Service may contain links to third-party sites. We are not responsible for their content or
            privacy practices. Review their policies when visiting.
          </P>
        </Section>

        <Section title="Changes">
          <P>
            We may update this Policy. We will post the new Policy on this page and update the “Last updated”
            date. In some cases we may notify you by email and/or an in-app notice.
          </P>
        </Section>

        <Section title="Contact">
          <P>Email: kontakt@liguster-app.dk</P>
          <Text style={styles.smallNote}>Generated using Free Privacy Policy Generator (customised for Liguster).</Text>
        </Section>

        {/* Footer links */}
        <View style={styles.footerNav}>
          <Link href="/" style={styles.footerLink}>← Til forsiden</Link>
          <Text style={styles.dot}>·</Text>
          <Link href="/LoginScreen" style={styles.footerLink}>Log ind</Link>
        </View>

        <Text style={styles.copy}>© {new Date().getFullYear()} Liguster</Text>
      </View>
    </ScrollView>
  );
}

/* ----- Helpers (typography wrappers) ----- */
function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>{title}</Text>
      <View>{children}</View>
    </View>
  );
}
function Sub({ children }: React.PropsWithChildren) {
  return <Text style={styles.h3}>{children}</Text>;
}
function P({ children }: React.PropsWithChildren) {
  return <Text style={styles.p}>{children}</Text>;
}
function B({ children }: React.PropsWithChildren) {
  return <Text style={styles.bold}>{children}</Text>;
}

/* ----- Styles ----- */
const styles = StyleSheet.create({
  page: { backgroundColor: "#0f1623" },

  hero: { paddingVertical: 48, backgroundColor: "#0f1623", borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  heroInner: { maxWidth: 1000, width: "100%", alignSelf: "center", paddingHorizontal: 24 },
  heroEyebrow: { color: "#94a3b8", fontWeight: "800", letterSpacing: 1, marginBottom: 6 },
  heroTitle: { color: "white", fontSize: 40, fontWeight: "800" },
  heroUpdated: { color: "#94a3b8", marginTop: 6 },
  heroLinks: { flexDirection: "row", gap: 12, marginTop: 12, alignItems: "center" },
  heroLink: { color: "#93c5fd", textDecorationLine: "underline", fontWeight: "700" },
  dot: { color: "#475569", fontSize: 18, marginTop: -2 },

  container: {
    maxWidth: 1000,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 28,
  },

  section: { marginBottom: 22 },
  h2: { color: "#e2e8f0", fontSize: 22, fontWeight: "800", marginBottom: 10 },
  h3: { color: "#cbd5e1", fontSize: 16, fontWeight: "700", marginTop: 8, marginBottom: 6 },
  p: { color: "#94a3b8", lineHeight: 22, marginBottom: 10 },
  bold: { fontWeight: "800", color: "#e2e8f0" },

  smallNote: { color: "#64748b", fontSize: 12, marginTop: 6 },

  footerNav: { flexDirection: "row", gap: 12, alignItems: "center", marginTop: 8 },
  footerLink: { color: "#cbd5e1" },
  copy: { color: "#64748b", fontSize: 12, marginTop: 16, marginBottom: 24, textAlign: "left" },
});