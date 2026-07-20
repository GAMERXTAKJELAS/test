export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        
        // Parse inbound JSON request body parameters safely
        const { username, password } = await request.json();

        // 1. Basic payload structural validation
        if (!username || !password) {
            return new Response(JSON.stringify({ success: false, message: "Missing login parameters." }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // 2. Query your live D1 database. 
        // Note: Using ? injection parameters ensures maximum security protection.
        const { results } = await env.DB.prepare(
            "SELECT username, role FROM users WHERE username = ? AND password = ? LIMIT 1"
        ).bind(username, password).all();

        // 3. Evaluate matching metrics record
        if (results && results.length > 0) {
            const user = results[0];
            return new Response(JSON.stringify({
                success: true,
                role: user.role
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Fallback profile failure state
        return new Response(JSON.stringify({ success: false, message: "Credentials not matching records in D1 database." }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        // Capture unexpected pipeline script structural failures
        return new Response(JSON.stringify({ success: false, message: "Cloudflare Runtime Error: " + error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}