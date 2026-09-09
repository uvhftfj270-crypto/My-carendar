export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    /*
     * =========================
     * Health Check
     * =========================
     */

    if (
      url.pathname === "/api/health" &&
      request.method === "GET"
    ) {
      try {
        const result = await env.DB
          .prepare(
            "SELECT COUNT(*) AS count FROM events"
          )
          .first();

        return Response.json({
          ok: true,
          events: result.count
        });

      } catch (error) {
        return Response.json(
          {
            ok: false,
            error: error.message
          },
          {
            status: 500
          }
        );
      }
    }


    /*
     * =========================
     * GET /api/events
     * 全予定を取得
     * =========================
     */

    if (
      url.pathname === "/api/events" &&
      request.method === "GET"
    ) {
      try {
        const { results } = await env.DB
          .prepare(`
            SELECT
              id,
              name,
              event_date,
              event_time,
              priority
            FROM events
            ORDER BY
              event_date,
              event_time
          `)
          .all();

        return Response.json(results);

      } catch (error) {
        return Response.json(
          {
            error: error.message
          },
          {
            status: 500
          }
        );
      }
    }


    /*
     * =========================
     * POST /api/events
     * 予定を追加
     * =========================
     */

    if (
      url.pathname === "/api/events" &&
      request.method === "POST"
    ) {
      try {

        const body =
          await request.json();

        const {
          name,
          event_date,
          event_time,
          priority
        } = body;


        /*
         * 必須項目チェック
         */

        if (
          !name ||
          !event_date ||
          !event_time
        ) {
          return Response.json(
            {
              error:
                "name, event_date, event_time are required"
            },
            {
              status: 400
            }
          );
        }


        /*
         * priority
         */

        const eventPriority =
          Number(priority) || 1;


        /*
         * D1へ追加
         */

        const result =
          await env.DB
            .prepare(`
              INSERT INTO events
                (
                  name,
                  event_date,
                  event_time,
                  priority
                )
              VALUES
                (?, ?, ?, ?)
            `)
            .bind(
              name,
              event_date,
              event_time,
              eventPriority
            )
            .run();


        return Response.json({
          ok: true,
          id: result.meta.last_row_id
        });

      } catch (error) {

        return Response.json(
          {
            error: error.message
          },
          {
            status: 500
          }
        );

      }
    }


    /*
     * =========================
     * PUT /api/events/:id
     * 予定を編集
     * =========================
     */

    if (
      url.pathname.startsWith("/api/events/") &&
      request.method === "PUT"
    ) {
      try {

        /*
         * URLからIDを取得
         *
         * /api/events/123
         * ↓
         * 123
         */

        const id =
          url.pathname
            .split("/")
            .pop();


        const body =
          await request.json();


        const {
          name,
          event_date,
          event_time,
          priority
        } = body;


        /*
         * 必須項目チェック
         */

        if (
          !name ||
          !event_date ||
          !event_time
        ) {
          return Response.json(
            {
              error:
                "name, event_date, event_time are required"
            },
            {
              status: 400
            }
          );
        }


        const eventPriority =
          Number(priority) || 1;


        /*
         * D1を更新
         */

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
            eventPriority,
            id
          )
          .run();


        return Response.json({
          ok: true
        });

      } catch (error) {

        return Response.json(
          {
            error: error.message
          },
          {
            status: 500
          }
        );

      }
    }


    /*
     * =========================
     * DELETE /api/events/:id
     * 予定を削除
     * =========================
     */

    if (
      url.pathname.startsWith("/api/events/") &&
      request.method === "DELETE"
    ) {
      try {

        /*
         * URLからIDを取得
         */

        const id =
          url.pathname
            .split("/")
            .pop();


        /*
         * D1から削除
         */

        await env.DB
          .prepare(
            "DELETE FROM events WHERE id = ?"
          )
          .bind(id)
          .run();


        return Response.json({
          ok: true
        });

      } catch (error) {

        return Response.json(
          {
            error: error.message
          },
          {
            status: 500
          }
        );

      }
    }


    /*
     * =========================
     * その他
     *
     * /api/* 以外は
     * カレンダー本体を返す
     * =========================
     */

    return env.ASSETS.fetch(request);
  }
};
