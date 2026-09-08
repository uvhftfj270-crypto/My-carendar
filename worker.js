export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // GET /api/health
    // =========================
    if (url.pathname === "/api/health") {
      const result = await env.DB
        .prepare("SELECT COUNT(*) AS count FROM events")
        .first();

      return Response.json({
        ok: true,
        events: result.count
      });
    }

    // =========================
    // GET /api/events
    // =========================
    if (url.pathname === "/api/events" && request.method === "GET") {
      const { results } = await env.DB
        .prepare(`
          SELECT id, name, event_date, event_time, priority
          FROM events
          ORDER BY event_date, event_time
        `)
        .all();

      return Response.json(results);
    }

    // =========================
    // POST /api/events
    // =========================
    if (url.pathname === "/api/events" && request.method === "POST") {
      try {
        const body = await request.json();

        const { name, event_date, event_time, priority } = body;

        if (!name || !event_date || !event_time) {
          return Response.json(
            { error: "name, event_date, event_time are required" },
            { status: 400 }
          );
        }

        const result = await env.DB
          .prepare(`
            INSERT INTO events
              (name, event_date, event_time, priority)
            VALUES (?, ?, ?, ?)
          `)
          .bind(
            name,
            event_date,
            event_time,
            priority || 1
          )
          .run();

        return Response.json({
          ok: true,
          id: result.meta.last_row_id
        });
      } catch (error) {
        return Response.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    // =========================
    // PUT /api/events/:id
    // =========================
    if (
      url.pathname.startsWith("/api/events/") &&
      request.method === "PUT"
    ) {
      try {
        const id = url.pathname.split("/").pop();
        const body = await request.json();

        const { name, event_date, event_time, priority } = body;

        await env.DB
          .prepare(`
            UPDATE events
            SET
              name = ?,
              event_date = ?,
              event_time = ?,
              priority = ?
            WHERE id = ?
          `)
          .bind(
            name,
            event_date,
            event_time,
            priority || 1,
            id
          )
          .run();

        return Response.json({
          ok: true
        });
      } catch (error) {
        return Response.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    // =========================
    // DELETE /api/events/:id
    // =========================
    if (
      url.pathname.startsWith("/api/events/") &&
      request.method === "DELETE"
    ) {
      try {
        const id = url.pathname.split("/").pop();

        await env.DB
          .prepare("DELETE FROM events WHERE id = ?")
          .bind(id)
          .run();

        return Response.json({
          ok: true
        });
      } catch (error) {
        return Response.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    // =========================
    // その他 → カレンダー本体
    // =========================
    return env.ASSETS.fetch(request);
  }
};
