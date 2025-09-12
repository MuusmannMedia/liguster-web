// app/(protected)/Chat.web.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../utils/supabase";

type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  post_id: string | null;
  created_at: string;
  posts?: { overskrift?: string | null } | null;
};

const AVATAR_SIZE = 40;
const FALLBACK_COLOR = "#6337c4";

export default function ChatWeb() {
  const { threadId, postId, otherUserId } = useLocalSearchParams<{
    threadId: string;
    postId?: string;
    otherUserId: string;
  }>();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState("UKENDT OPSLAG");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");

  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  const [emails, setEmails]   = useState<Record<string, string | null>>({});

  const scrollerRef = useRef<HTMLDivElement>(null);

  // current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // initial load
  useEffect(() => {
    let cancelled = false;
    const tId = String(threadId || "");

    if (!tId) return;

    const run = async () => {
      setLoading(true);

      const { data: msgs, error } = await supabase
        .from("messages")
        .select(
          "id,thread_id,sender_id,receiver_id,text,post_id,created_at,posts!left(overskrift)"
        )
        .eq("thread_id", tId)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.warn("Load messages error:", error.message);
        setMessages([]);
      } else {
        const rows = (msgs || []) as Message[];
        setMessages(rows);

        // Title
        let title =
          rows.find((m) => m.posts?.overskrift)?.posts?.overskrift || undefined;
        if (!title) {
          const realPostId = (postId as string) || rows[0]?.post_id || "";
          if (realPostId) {
            const { data: p } = await supabase
              .from("posts")
              .select("overskrift")
              .eq("id", realPostId)
              .maybeSingle();
            if (p?.overskrift) title = p.overskrift;
          }
        }
        setPostTitle(title || "UKENDT OPSLAG");

        // Avatars + emails
        const uniqIds = Array.from(
          new Set<string>(
            rows
              .flatMap((m) => [m.sender_id, m.receiver_id])
              .concat(userId || "", (otherUserId as string) || "")
              .filter(Boolean)
          )
        );

        if (uniqIds.length) {
          const { data: usersData } = await supabase
            .from("users")
            .select("id, avatar_url, email")
            .in("id", uniqIds);

          const a: Record<string, string | null> = {};
          const e: Record<string, string | null> = {};
          for (const u of usersData || []) {
            e[u.id] = u.email ?? null;
            if (u.avatar_url) {
              const { data: urlObj } = supabase.storage
                .from("avatars")
                .getPublicUrl(u.avatar_url);
              a[u.id] = urlObj?.publicUrl || null;
            } else {
              a[u.id] = null;
            }
          }
          setAvatars(a);
          setEmails(e);
        }
      }

      setLoading(false);
      // scroll to bottom
      setTimeout(() => scrollerRef.current?.scrollTo?.({ top: 999999, behavior: "smooth" }), 50);
    };

    run();
    return () => { cancelled = true; };
  }, [threadId, postId, otherUserId, userId]);

  // realtime for this thread
  useEffect(() => {
    const tId = String(threadId || "");
    if (!tId) return;

    const channel = supabase
      .channel(`messages:${tId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${tId}` },
        (payload) => {
          const row = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            const next = [...prev, row].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            return next;
          });
          setTimeout(() => scrollerRef.current?.scrollTo?.({ top: 999999, behavior: "smooth" }), 60);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages", filter: `thread_id=eq.${tId}` },
        (payload) => {
          const deletedId = (payload.old as any)?.id;
          if (deletedId) {
            setMessages((prev) => prev.filter((m) => m.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [threadId]);

  const otherId = useMemo(() => String(otherUserId || ""), [otherUserId]);
  const me = userId;

  const send = async () => {
    const text = input.trim();
    if (!text || !me || !otherId || !threadId) return;

    setInput("");
    const tempId = `temp-${Date.now()}`;

    const temp: Message = {
      id: tempId,
      thread_id: String(threadId),
      sender_id: me,
      receiver_id: otherId,
      text,
      post_id: (postId as string) || null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, temp]);

    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({
        thread_id: String(threadId),
        sender_id: me,
        receiver_id: otherId,
        text,
        post_id: (postId as string) || null,
      })
      .select()
      .single();

    if (error || !inserted) {
      // rollback optimistic
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert(error?.message ?? "Kunne ikke sende beskeden.");
      return;
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === tempId ? (inserted as any as Message) : m))
    );
    setTimeout(() => scrollerRef.current?.scrollTo?.({ top: 999999, behavior: "smooth" }), 60);
  };

  /* UI helpers */
  const initialFor = (uid: string | null) => {
    if (!uid) return "U";
    const email = emails[uid];
    return email && email.length > 0 ? email[0]!.toUpperCase() : "U";
  };
  const Avatar = ({ uid }: { uid: string }) =>
    avatars[uid] ? (
      <img src={avatars[uid] as string} className="avatar" />
    ) : (
      <div className="avatarBadge">
        <span className="avatarInitial">{initialFor(uid)}</span>
      </div>
    );

  return (
    <div className="page">
      <div className="topbar">
        <button className="back" onClick={() => router.back()}>‹</button>
        <div className="title" title={postTitle}>{postTitle.toUpperCase()}</div>
        <div style={{ width: 34 }} />
      </div>

      <div className="scroller" ref={scrollerRef}>
        {loading ? (
          <div className="loading">Indlæser…</div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === me;
            return (
              <div key={m.id} className={`row ${isMe ? "right" : "left"}`}>
                {!isMe && <Avatar uid={m.sender_id} />}
                <div className="bubbleWrap">
                  <div className={`bubble ${isMe ? "me" : "them"}`}>
                    <span className={`bubbleText ${isMe ? "meTxt" : ""}`}>{m.text}</span>
                  </div>
                  <div className={`time ${isMe ? "timeRight" : "timeLeft"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                {isMe && me && <Avatar uid={me} />}
              </div>
            );
          })
        )}
      </div>

      <div className="inputRow">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="input"
          placeholder="Skriv en besked…"
          rows={2}
        />
        <button className="sendBtn" onClick={send}>SEND</button>
      </div>

      <style>{`
        .page{ min-height:100vh; background:#7C8996; display:flex; flex-direction:column; padding-top:42px; }

        .topbar{
          display:flex; align-items:center; justify-content:space-between;
          padding: 0 14px 8px;
        }
        .back{
          width:32px; height:32px; border-radius:16px; background:#131921; color:#fff; font-weight:800; border:3px solid #fff; cursor:pointer;
        }
        .title{ color:#fff; font-weight:bold; font-size:18px; text-align:center; flex:1; padding:0 6px; text-transform:uppercase; }

        .scroller{ flex:1; overflow:auto; padding: 12px 0 12px; }
        .loading{ color:#fff; font-size:18px; display:flex; align-items:center; justify-content:center; height:100%; }

        .row{ width:100%; display:flex; align-items:flex-end; padding: 0 12px; margin-bottom:10px; }
        .row.left{ justify-content:flex-start; }
        .row.right{ justify-content:flex-end; }

        .bubbleWrap{ max-width:76%; flex-shrink:1; }
        .bubble{ padding:12px 16px; border-radius:18px; box-shadow:0 2px 7px rgba(0,0,0,.08); }
        .bubble.me{ background:#131921; }
        .bubble.them{ background:#fff; }
        .bubbleText{ font-size:15px; color:#222; line-height:20px; }
        .bubbleText.meTxt{ color:#fff; }

        .time{ font-size:11px; color:#a1a1a1; margin-top:4px; }
        .timeLeft{ text-align:left; margin-left:6px; }
        .timeRight{ text-align:right; margin-right:6px; }

        .avatar, .avatarBadge{ width:${AVATAR_SIZE}px; height:${AVATAR_SIZE}px; border-radius:${AVATAR_SIZE/2}px; margin:0 6px; }
        .avatar{ object-fit:cover; background:#ddd; }
        .avatarBadge{ background:${FALLBACK_COLOR}; display:flex; align-items:center; justify-content:center; }
        .avatarInitial{ color:#fff; font-weight:bold; font-size:22px; }

        .inputRow{
          display:flex; align-items:center; gap:9px; background:#131921; padding:12px; border-radius:8px; margin: 0 12px 14px;
        }
        .input{
          flex:1; background:#fff; border:0; border-radius:8px; padding:10px 14px; font-size:16px; min-height:44px; max-height:140px; resize:vertical; color:#1e2330;
        }
        .sendBtn{
          background:transparent; color:#fff; font-weight:bold; font-size:17px; letter-spacing:1px; text-transform:uppercase; border:0; cursor:pointer; min-width:64px; height:44px;
        }

        @media (max-width: 720px){
          .bubbleWrap{ max-width:86%; }
        }
      `}</style>
    </div>
  );
}