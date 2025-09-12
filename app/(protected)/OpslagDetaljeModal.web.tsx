// app/(protected)/OpslagDetaljeModal.web.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../utils/supabase";

type Post = {
  id: string;
  overskrift: string | null;
  text: string | null;
  omraade: string | null;
  kategori: string | null;
  image_url: string | null;
  created_at: string | null;
};

const MOBILE_MAX = 719;
const HEADER_H = 64;

export default function OpslagDetaljeModalWeb() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [post, setPost]   = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply]   = useState("");
  const [sending, setSending] = useState(false);
  const canSend = reply.trim().length > 1;

  const isMobile = useMemo(
    () => (typeof window !== "undefined"
      ? window.matchMedia(`(max-width:${MOBILE_MAX}px)`).matches
      : false),
    []
  );

  // Hent post
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("posts")
          .select("id, overskrift, text, omraade, kategori, image_url, created_at")
          .eq("id", id)
          .single();
        if (error) throw error;
        if (mounted) setPost(data as Post);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // Lås kun baggrund på DESKTOP (mobil får en normal side)
    if (typeof document !== "undefined" && !isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
    return () => {};
  }, [id, isMobile]);

  const close = () => router.back();

  const onSend = async () => {
    if (!canSend) return;
    try {
      setSending(true);
      // TODO: gem i Supabase (messages)
      await new Promise(r => setTimeout(r, 400));
      setReply(""); setReplyOpen(false);
      alert("Din besked er sendt.");
    } catch (e: any) {
      alert(e?.message || "Kunne ikke sende beskeden.");
    } finally {
      setSending(false);
    }
  };

  return isMobile ? (
    <MobilePage
      post={post} loading={loading}
      replyOpen={replyOpen} setReplyOpen={setReplyOpen}
      reply={reply} setReply={setReply}
      canSend={canSend} sending={sending} onSend={onSend}
      onClose={close}
    />
  ) : (
    <DesktopModal
      post={post} loading={loading}
      replyOpen={replyOpen} setReplyOpen={setReplyOpen}
      reply={reply} setReply={setReply}
      canSend={canSend} sending={sending} onSend={onSend}
      onClose={close}
    />
  );
}

/* ───────────────────── Desktop (modal/overlay) ───────────────────── */
function DesktopModal(props: CommonProps) {
  const { post, loading, replyOpen, setReplyOpen, reply, setReply, canSend, sending, onSend, onClose } = props;
  return (
    <>
      <div className="overlay" role="dialog" aria-modal="true">
        <div className="sheet">
          <div className="card">
            <Header title={post?.overskrift || "Opslag"} onClose={onClose} onReply={() => setReplyOpen(true)} />
            {loading ? (
              <div className="loading">Indlæser…</div>
            ) : post ? (
              <PostContent post={post} />
            ) : (
              <div className="loading">Kunne ikke finde opslaget.</div>
            )}
          </div>
        </div>
      </div>

      {replyOpen && (
        <div className="overlay reply">
          <div className="sheet">
            <ReplyCard
              reply={reply} setReply={setReply}
              canSend={canSend} sending={sending}
              onCancel={() => setReplyOpen(false)}
              onSend={onSend}
            />
          </div>
        </div>
      )}

      <style>{desktopCss}</style>
      <style>{sharedCss}</style>
    </>
  );
}

/* ───────────────────── Mobil (fuld side) ───────────────────── */
function MobilePage(props: CommonProps) {
  const {
    post, loading, replyOpen, setReplyOpen,
    reply, setReply, canSend, sending, onSend, onClose
  } = props;

  const replyRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (replyOpen) replyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [replyOpen]);

  return (
    <>
      <div className="m-wrap">
        <div className="m-card">
          <Header title={post?.overskrift || "Opslag"} onClose={onClose} onReply={() => setReplyOpen(true)} />
          {loading ? (
            <div className="loading">Indlæser…</div>
          ) : post ? (
            <PostContent post={post} />
          ) : (
            <div className="loading">Kunne ikke finde opslaget.</div>
          )}
        </div>

        {replyOpen && (
          <div ref={replyRef} className="m-reply">
            <ReplyCard
              reply={reply} setReply={setReply}
              canSend={canSend} sending={sending}
              onCancel={() => setReplyOpen(false)}
              onSend={onSend}
            />
          </div>
        )}
      </div>

      <style>{mobileCss}</style>
      <style>{sharedCss}</style>
    </>
  );
}

/* ───────────────────── Små byggeklodser ───────────────────── */
function Header({ title, onClose, onReply }: { title: string; onClose: () => void; onReply: () => void }) {
  return (
    <div className="cardHead">
      <h2 className="title">{title}</h2>
      <div className="headBtns">
        <button className="pillBtn" onClick={onReply}>Svar</button>
        <button className="pillBtn" onClick={onClose}>Luk</button>
      </div>
    </div>
  );
}

function PostContent({ post }: { post: Post }) {
  return (
    <>
      {post.image_url ? <img className="hero" src={post.image_url} alt={post.overskrift ?? "Billede"} /> : null}
      <div className="metaRow">
        {post.kategori ? <span className="chip">{post.kategori}</span> : null}
        {post.omraade ? <span className="chip">{post.omraade}</span> : null}
        {post.created_at ? (
          <span className="chip">
            {new Date(post.created_at).toLocaleDateString("da-DK", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        ) : null}
      </div>
      {post.text ? <p className="body">{post.text}</p> : null}
    </>
  );
}

function ReplyCard({
  reply, setReply, canSend, sending, onCancel, onSend,
}: {
  reply: string; setReply: (v: string) => void; canSend: boolean; sending: boolean;
  onCancel: () => void; onSend: () => void;
}) {
  return (
    <div className="card small">
      <h3 className="replyTitle">Skriv en besked til opslagets ejer</h3>
      <textarea
        className="textarea"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Hej! Jeg er interesseret…"
        rows={8}
      />
      <div className="replyBtns">
        <button className="pillBtn" onClick={onCancel}>Annullér</button>
        <button className="pillBtn filled" disabled={!canSend || sending} onClick={onSend}>
          {sending ? "Sender…" : "Send"}
        </button>
      </div>
    </div>
  );
}

/* ───────────────────── CSS ───────────────────── */
const sharedCss = `
  .chip{ background:#eef2ff; color:#1e293b; border-radius:999px; padding:6px 10px; font-weight:800; font-size:12px; }
  .metaRow{ display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
  .hero{ width:100%; height:auto; max-height:60vh; object-fit:cover; border-radius:12px; background:#f1f5f9; border:1px solid #E6E9EE; }
  .body{ color:#111827; margin-top:12px; line-height:1.5; font-size:15px; }
  .replyTitle{ margin:0 0 10px 0; color:#0b1220; font-weight:900; font-size:18px; }
  .textarea{ width:100%; max-width:100%; border-radius:12px; border:1px solid #E6E9EE; padding:12px; resize:vertical; font:inherit; color:#0b1220; background:#fff; outline:none; display:block; box-sizing:border-box; }
  .replyBtns{ display:flex; gap:10px; justify-content:flex-end; margin-top:12px; }
  .loading{ color:#0b1220; padding:18px; font-weight:700; }
  .cardHead{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding-bottom:8px; }
  .title{ margin:0; font-size:20px; font-weight:900; color:#0b1220; }
  .headBtns{ display:flex; gap:8px; }
  .pillBtn{ appearance:none; border:1.5px solid #E6E9EE; background:#0b1220; color:#fff; font-weight:800; font-size:14px; line-height:1; padding:9px 14px; border-radius:999px; cursor:pointer; }
  .pillBtn.filled{ background:#0b1220; color:#fff; border-color:#0b1220; }
  .pillBtn:disabled{ opacity:.6; cursor:default; }
`;

const desktopCss = `
  .overlay, .overlay *{ box-sizing:border-box; }
  .overlay{ position:fixed; inset:0; height:100dvh; min-height:100dvh; background:rgba(2,6,23,0.60); z-index:100000; display:flex; }
  .sheet{ flex:1; display:flex; justify-content:center; align-items:center; padding:24px; overflow:auto; -webkit-overflow-scrolling:touch; }
  .card{ width:min(880px, 92vw); background:#fff; border-radius:18px; border:1px solid #E6E9EE; box-shadow:0 20px 50px rgba(0,0,0,.35); padding:14px; max-height:calc(100dvh - 48px); overflow:auto; }
  .reply .card{ width:min(560px, 94vw); padding:16px; }
`;

const mobileCss = `
  /* Normal side under headeren – ingen overlay, ingen fixed. */
  .m-wrap{
    min-height: 100vh;
    background: #0b1220;
    padding-top: calc(${HEADER_H}px + env(safe-area-inset-top, 0px));
  }
  .m-card{
    background:#fff;
    border:1px solid #E6E9EE;
    border-radius:18px;
    margin: 12px;
    padding: 14px;
    box-shadow:0 12px 30px rgba(0,0,0,.30);
  }
  .m-reply{ margin: 12px; }
  .card.small{ padding:16px; }
`;

type CommonProps = {
  post: Post | null;
  loading: boolean;
  replyOpen: boolean;
  setReplyOpen: (v: boolean) => void;
  reply: string;
  setReply: (v: string) => void;
  canSend: boolean;
  sending: boolean;
  onSend: () => void;
  onClose: () => void;
};