

export default {
  async fetch(request, env) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }
    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405, headers });
    }
    if (!env.DB) {
      return Response.json({ error: "D1 database binding DB is missing" }, { status: 500, headers });
    }

    try {
      const body = await request.json();
      const visitorId = typeof body.visitorId === "string" ? body.visitorId : "";

      if (!/^[a-zA-Z0-9-]{12,80}$/.test(visitorId)) {
        return Response.json({ error: "Invalid visitor ID" }, { status: 400, headers });
      }


      await env.DB.prepare(
        "INSERT OR IGNORE INTO visitors (visitor_id) VALUES (?)"
      ).bind(visitorId).run();

      const row = await env.DB.prepare(
        "SELECT COUNT(*) AS total FROM visitors"
      ).first();

      return Response.json({ total: Number(row?.total || 0) }, { headers });
    } catch {
      return Response.json({ error: "Counter temporarily unavailable" }, { status: 500, headers });
    }
  }
};
