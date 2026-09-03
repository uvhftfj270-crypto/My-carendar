export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      const result = await env.DB
        .prepare("SELECT COUNT(*) AS count FROM events")
        .first();

      return Response.json({
        ok: true,
        events: result.count
      });
    }

    return new Response("My Calendar API OK");
  }
};
