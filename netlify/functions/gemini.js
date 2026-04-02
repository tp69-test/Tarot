// Netlify Function để gọi Gemini API an toàn
exports.handler = async function(event, context) {
    // Chỉ cho phép method POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        const { prompt, systemInstruction } = body;

        // LẤY API KEY TỪ BIẾN MÔI TRƯỜNG CỦA NETLIFY
        // Tuyệt đối không hardcode (viết thẳng) key vào đây
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Server chưa cấu hình API Key" })
            };
        }

        // Gọi đến Google Gemini (Dùng model flash cho tốc độ nhanh)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        if (systemInstruction) {
            payload.systemInstruction = { parts: [{ text: systemInstruction }] };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Google API lỗi: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        
        // Trả kết quả về cho Frontend
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: data.candidates[0].content.parts[0].text
            })
        };

    } catch (error) {
        console.error("Lỗi Function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Lỗi nội bộ server, vũ trụ đang nhiễu động." })
        };
    }
};

