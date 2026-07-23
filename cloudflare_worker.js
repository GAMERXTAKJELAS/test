export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Standard CORS headers allowing cross-origin requests from your frontend
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle browser preflight CORS options request
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    // -------------------------------------------------------------
    // ENDPOINT 1: DATABASE HEALTH CHECK
    // Route: GET /api/health
    // -------------------------------------------------------------
    if (url.pathname === '/api/health' && request.method === 'GET') {
      try {
        // Verify D1 Database binding 'DB' exists
        if (!env.DB) {
          return new Response(JSON.stringify({
            connected: false,
            message: "Database binding 'DB' is missing in wrangler.json configuration."
          }), { status: 500, headers });
        }

        // Test database response by counting users
        const countQuery = await env.DB.prepare("SELECT COUNT(*) as user_count FROM users").first();

        return new Response(JSON.stringify({
          connected: true,
          message: "Database connected successfully!",
          database_name: "webtest",
          total_users: countQuery ? countQuery.user_count : 0,
          timestamp: new Date().toISOString()
        }), { status: 200, headers });

      } catch (error) {
        return new Response(JSON.stringify({
          connected: false,
          message: "Database connection or query failed.",
          error_details: error.message
        }), { status: 500, headers });
      }
    }

    // -------------------------------------------------------------
    // ENDPOINT 2: USER LOGIN TEST
    // Route: POST /api/login
    // Payload: { "username": "...", "password": "..." }
    // -------------------------------------------------------------
    if (url.pathname === '/api/login' && request.method === 'POST') {
      try {
        if (!env.DB) {
          return new Response(JSON.stringify({
            success: false,
            message: "Database binding 'DB' is missing."
          }), { status: 500, headers });
        }

        const body = await request.json();
        const username = body.username ? body.username.trim() : "";
        const password = body.password ? body.password.trim() : "";

        if (!username || !password) {
          return new Response(JSON.stringify({
            success: false,
            message: "Username and password are required."
          }), { status: 400, headers });
        }

        // Query the D1 'users' table using prepared statements to prevent SQL injection
        const user = await env.DB.prepare(
          "SELECT id, username, role, full_name, created_at FROM users WHERE username = ? AND password = ?"
        ).bind(username, password).first();

        const timestamp = new Date().toISOString();

        if (user) {
          // Log successful login attempt to 'operations_log' table
          try {
            await env.DB.prepare(
              "INSERT INTO operations_log (username, action_type, timestamp, details) VALUES (?, ?, ?, ?)"
            ).bind(username, "LOGIN_SUCCESS", timestamp, `Successful login by ${username}`).run();
          } catch (logErr) {
            console.error("Failed to write to operations_log:", logErr);
          }

          return new Response(JSON.stringify({
            success: true,
            message: "Login successful!",
            user: {
              id: user.id,
              username: user.username,
              role: user.role,
              full_name: user.full_name,
              created_at: user.created_at
            }
          }), { status: 200, headers });

        } else {
          // Log failed login attempt to 'operations_log' table
          try {
            await env.DB.prepare(
              "INSERT INTO operations_log (username, action_type, timestamp, details) VALUES (?, ?, ?, ?)"
            ).bind(username || "UNKNOWN", "LOGIN_FAILED", timestamp, "Invalid credentials entered").run();
          } catch (logErr) {
            console.error("Failed to write to operations_log:", logErr);
          }

          return new Response(JSON.stringify({
            success: false,
            message: "Invalid username or password."
          }), { status: 401, headers });
        }

      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          message: "Server error during authentication.",
          error_details: error.message
        }), { status: 500, headers });
      }
    }

    // Default response for root or unknown endpoints
    return new Response(JSON.stringify({
      status: "online",
      message: "D1 Access Control Worker API is running.",
      endpoints: ["GET /api/health", "POST /api/login"]
    }), { status: 200, headers });
  }
}