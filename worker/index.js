// Cloudflare Worker: 부부 자금관리 데이터 저장 API
// GET  /api/data  -> 저장된 전체 데이터(JSON) 반환
// PUT  /api/data  -> body(JSON)를 통째로 저장 (덮어쓰기)
//
// 인증: 헤더 X-Pin 값이 환경변수 PIN과 일치해야 함 (wrangler secret put PIN 로 설정)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = env.ALLOWED_ORIGIN || "*";
    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,X-Pin",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (url.pathname !== "/api/data") {
      return new Response("Not found", { status: 404, headers: cors });
    }

    const pin = request.headers.get("X-Pin") || "";
    if (!env.PIN || pin !== env.PIN) {
      return new Response(JSON.stringify({ error: "invalid pin" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (request.method === "GET") {
      const row = await env.DB.prepare("SELECT data FROM ledger WHERE id = 1").first();
      return new Response(row ? row.data : "null", {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (request.method === "PUT") {
      let body;
      try {
        body = await request.text();
        JSON.parse(body); // 유효성 검사
      } catch (e) {
        return new Response(JSON.stringify({ error: "invalid json" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      await env.DB.prepare(
        `INSERT INTO ledger (id, data, updated_at) VALUES (1, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
      )
        .bind(body)
        .run();
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405, headers: cors });
  },
};
