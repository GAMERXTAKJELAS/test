export async function onRequestGet(context) {
    try {
        const { env } = context;

        // 1. Fetch entire rooms configuration grid array directly out of your D1 instance table
        const roomsQuery = await env.DB.prepare(
            "SELECT room_number, block, capacity, current_occupants, status FROM rooms ORDER BY room_number ASC"
        ).all();
        
        const roomsList = roomsQuery.results || [];

        // 2. Compute aggregate layout totals programmatically via standard reductions
        const totalRooms = roomsList.length;
        let totalOccupants = 0;

        roomsList.forEach(room => {
            totalOccupants += Number(room.current_occupants || 0);
        });

        // 3. Assemble composite data package payload response object
        return new Response(JSON.stringify({
            success: true,
            summary: {
                totalRooms: totalRooms,
                totalOccupants: totalOccupants
            },
            rooms: roomsList
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store, max-age=0" // Always retrieve absolute live data values
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({ 
            success: false, 
            message: "Cloudflare D1 Dashboard Query Error: " + error.message 
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}