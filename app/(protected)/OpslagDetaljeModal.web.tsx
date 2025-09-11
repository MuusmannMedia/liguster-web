// app/(protected)/OpslagDetaljeModal.web.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

export default function OpslagDetaljeModalWeb() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  // reply dialog
  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const canSend = reply.trim().length > 1;

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

    // lock background scroll a bit
    if (typeof document !== "undefined") {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
    return () => {};
  }, [id]);

  const close = () => router.back();
  const isMobile = useMemo(
    () => (typeof window !== "undefined" ? window.matchMedia(`(max-width:${MOBILE_MAX}px)`).matches : false),
    []
  );

  const onSend = async () => {
    if (!canSend) return;
    try {
      setSending(true);
      // TODO: save message in Supabase
      await new Promise(r => setTimeout(r, 450));
      setReply(""); setReplyOpen(false);
      alert("Din besked er sendt.");
    } catch (e: any) {
      alert(e?.message || "Kunne ikke sende beskeden.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="overlay" role="dialog" aria-modal="true">
        <div className="sheet">
          <div className="card">
            <div className="cardHead">
              <h2 className="title">{post?.overskrift || "Opslag"}</h2>
              <div className="headBtns">
                <button className="pillBtn" onClick={() => setReplyOpen(true)}>Svar</button>
                <button className="pillBtn" onClick={close}>Luk</button>
              </div>
            </div>

            {loading ? (
              <div className="loading">Indlæser…</div>
            ) : post ? (
              <>
                {post.image_url ? (
                  <img className="hero" src={post.image_url} alt={post.overskrift ?? "Billede"} />
                ) : null}

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
            ) : (
              <div className="loading">Kunne ikke finde opslaget.</div>
            )}
          </div>
        </div>
      </div>

      {replyOpen && (
        <div className="overlay reply">
          <div className="sheet">
            <div className="card small">
              <h3 className="replyTitle">Skriv en besked til opslagets ejer</h3>
              <textarea
                className="textarea"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Hej! Jeg er interesseret…"
                rows={isMobile ? 6 : 8}
              />
              <div className="replyBtns">
                <button className="pillBtn" onClick={() => setReplyOpen(false)}>Annullér</button>
                <button className="pillBtn filled" disabled={!canSend || sending} onClick={onSend}>
                  {sending ? "Sender…" : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* make sizing predictable so textarea never overflows the card */
        .overlay, .overlay * { box-sizing: border-box; }

        /* Always above fixed header, fill real viewport on iOS too */
        .overlay{
          position: fixed;
          inset: 0;
          height: 100dvh;
          min-height: 100dvh;
          background: rgba(2,6,23,0.60);
          z-index: 100000;
          display: flex;
          overscroll-behavior: contain;
        }

        .sheet{
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px;
          overflow: auto;
          -webkit-overflow-scrolling: touch;
        }
        @media (max-width: ${MOBILE_MAX}px){
          .sheet{
            align-items: flex-start;
            padding-top: calc(64px + max(env(safe-area-inset-top, 0px), 10px));
            padding-left: 12px;
            padding-right: 12px;
            padding-bottom: 24px;
          }
        }

        .card{
          width: min(880px, 92vw);
          background: #fff;
          border-radius: 18px;
          border: 1px solid #E6E9EE;
          box-shadow: 0 20px 50px rgba(0,0,0,.35);
          padding: 14px;
        }
        .card.small{
          width: min(560px, 94vw);
          padding: 16px;
        }

        .cardHead{
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 8px;
        }
        .title{
          margin: 0;
          font-size: 20px;
          font-weight: 900;
          color: #0b1220;
        }
        .headBtns{ display: flex; gap: 8px; }

        /* Unified buttons */
        .pillBtn{
          appearance: none;
          border: 1.5px solid #E6E9EE;
          background: #0b1220;
          color: #fff;
          font-weight: 800;
          font-size: 14px;
          line-height: 1;
          padding: 9px 14px;
          border-radius: 999px;
          cursor: pointer;
        }
        .pillBtn.filled{ background:#0b1220; color:#fff; border-color:#0b1220; }
        .pillBtn:disabled{ opacity:.6; cursor:default; }

        .loading{ color:#0b1220; padding:18px; font-weight:700; }

        .hero{
          width: 100%;
          height: auto;
          max-height: 60vh;
          object-fit: cover;
          border-radius: 12px;
          background: #f1f5f9;
          border: 1px solid #E6E9EE;
        }
        @media (max-width: ${MOBILE_MAX}px){ .hero{ max-height: 42vh; } }

        .metaRow{
          display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;
        }
        .chip{
          background:#eef2ff; color:#1e293b; border-radius:999px; padding:6px 10px;
          font-weight:800; font-size:12px;
        }

        .body{ color:#111827; margin-top:12px; line-height:1.5; font-size:15px; }

        /* Reply dialog */
        .replyTitle{ margin:0 0 10px 0; color:#0b1220; font-weight:900; font-size:18px; }
        .textarea{
          width: 100%;
          max-width: 100%;
          border-radius: 12px;
          border: 1px solid #E6E9EE;
          padding: 12px;
          resize: vertical;
          font: inherit;
          color: #0b1220;
          background: #fff;
          outline: none;
          display: block;
        }
        .replyBtns{
          display: flex; gap: 10px; justify-content: flex-end; margin-top: 12px;
        }
      `}</style>
    </>
  );
}