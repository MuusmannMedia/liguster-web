import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image } from "react-native";
import { useSession } from "../../hooks/useSession";
import { supabase } from "../../utils/supabase";

type Post = {
  id: string;
  overskrift: string;
  text: string;
  image_url?: string;
  omraade?: string;
  kategori?: string;
  created_at: string;
  user_id: string;
};

export default function OpslagDetaljeModalWeb() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const { data, error } = await supabase
          .from("posts")
          .select("id,overskrift,text,image_url,omraade,kategori,created_at,user_id")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        if (!alive) return;

        if (!data) {
          setErr("Opslag ikke fundet.");
        } else {
          setPost(data as Post);
        }
      } catch (e: any) {
        if (alive) setErr(e.message ?? "Kunne ikke hente opslag.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  async function handleContact() {
    if (!session?.user || !post) return;
    setContacting(true);

    try {
      // Tjek om en tråd allerede findes
      const { data: existing, error: exErr } = await supabase
        .from("forening_threads")
        .select("id")
        .eq("is_private", true)
        .contains("participants", [session.user.id, post.user_id])
        .maybeSingle();

      if (exErr) throw exErr;

      let threadId: string;

      if (existing) {
        threadId = existing.id;
      } else {
        // Opret en ny privat tråd
        const { data: newThread, error: newErr } = await supabase
          .from("forening_threads")
          .insert({
            is_private: true,
            participants: [session.user.id, post.user_id],
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (newErr) throw newErr;
        threadId = newThread.id;
      }

      // Naviger til tråden
      router.push(`/(protected)/threads/${threadId}`);
    } catch (e: any) {
      console.error("Kontakt fejl:", e.message);
      alert("Kunne ikke starte samtale.");
    } finally {
      setContacting(false);
    }
  }

  if (loading) {
    return <main className="content"><p>Henter opslag…</p>{styles}</main>;
  }

  if (err || !post) {
    return (
      <main className="content">
        <div className="error">{err ?? "Ukendt fejl"}</div>
        <button onClick={() => router.back()} className="btn-secondary">Tilbage</button>
        {styles}
      </main>
    );
  }

  return (
    <main className="content">
      {post.image_url && (
        <div className="hero">
          <Image
            source={{ uri: post.image_url }}
            style={{ width: "100%", height: "auto" as any, borderRadius: 12 }}
          />
        </div>
      )}

      <h1 className="title">{post.overskrift}</h1>

      <div className="meta">
        {post.kategori && <span className="pill">{post.kategori}</span>}
        {post.omraade && <span className="pill">{post.omraade}</span>}
      </div>

      <p className="body">{post.text}</p>

      <div className="actions">
        <button className="btn-secondary" onClick={() => router.back()}>
          Luk
        </button>
        {session?.user?.id !== post.user_id && (
          <button
            className="btn-primary"
            onClick={handleContact}
            disabled={contacting}
          >
            {contacting ? "Åbner…" : "Kontakt"}
          </button>
        )}
      </div>
      {styles}
    </main>
  );
}

const styles = (
  <style>{`
    .content{
      margin: 0 auto;
      padding: 16px;
      max-width: 900px;
    }
    .hero{ margin-bottom: 16px; }
    .title{
      font-size: 28px;
      font-weight: 800;
      margin: 12px 0;
      color: #0b1220;
    }
    .meta{ display:flex; gap:8px; margin-bottom:12px; }
    .pill{
      background:#f1f5f9;
      border-radius:6px;
      padding:4px 8px;
      font-size:14px;
      color:#475569;
    }
    .body{
      font-size:16px;
      line-height:1.6;
      margin-bottom:20px;
      color:#0b1220;
    }
    .actions{ margin-top:20px; display:flex; gap:12px; }
    .btn-secondary{
      padding:10px 14px;
      border-radius:10px;
      border:1px solid #334155;
      background:#fff;
      font-weight:700;
      cursor:pointer;
    }
    .btn-primary{
      padding:10px 14px;
      border-radius:10px;
      border:0;
      background:#0b1220;
      color:#fff;
      font-weight:700;
      cursor:pointer;
    }
    .error{
      background:#fee2e2;
      border:1px solid #ef4444;
      color:#7f1d1d;
      padding:10px;
      border-radius:8px;
      margin-bottom:12px;
    }
    @media (max-width:719px){
      .content{ max-width: 92vw; padding:12px; }
      .title{ font-size:22px; }
      .body{ font-size:15px; }
    }
  `}</style>
);