// app/PostsWeb.tsx
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { supabase } from "../utils/supabase"; // samme klient som appen bruger

type Post = {
  id: string;
  overskrift: string | null;
  omraade: string | null;
  text: string | null;
};

export default function PostsWeb() {
  const [data, setData] = useState<Post[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("posts").select("id,overskrift,omraade,text").order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setErr(error.message);
        else setData(data ?? []);
      });
  }, []);

  if (err) return <Text style={{color:"#f66"}}>Fejl: {err}</Text>;
  if (!data) return <Text style={{color:"#ddd"}}>Loader…</Text>;

  return (
    <View style={{ padding: 16 }}>
      {data.map(p => (
        <View key={p.id} style={{ marginBottom: 12, backgroundColor: "#fff", padding: 12, borderRadius: 8 }}>
          <Text style={{ fontWeight: "bold" }}>{p.overskrift ?? "(uden titel)"}</Text>
          <Text>{p.omraade}</Text>
          <Text numberOfLines={2}>{p.text}</Text>
        </View>
      ))}
    </View>
  );
}