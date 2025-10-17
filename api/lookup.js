// /api/lookup.js on Vercel

export default async function (req, res) {
    // 1. Get the barcode from the query string (e.g., ?code=123)
    const barcode = req.query.code;

    if (!barcode) {
        return res.status(400).json({ error: "Barcode 'code' parameter is missing." });
    }

    // 2. **SECURELY** get the API key from Vercel Environment Variables
    // **CRUCIAL: Ensure BARCODE_API_KEY is set in Vercel's project settings!**
    const API_KEY = process.env.BARCODE_API_KEY;
    
    if (!API_KEY) {
        return res.status(500).json({ error: "Server configuration error: API key missing." });
    }

    // **3. IMPORTANT: Replace this URL with your actual Barcode API endpoint structure**
    // This example uses a placeholder URL. Adjust parameters as required by your API.
    const BARCODE_API_URL = `https://api.example-barcode.com/v1/products/${barcode}?key=${API_KEY}`; 

    try {
        const apiResponse = await fetch(BARCODE_API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // 4. Read data and check for errors from the external API
        const apiData = await apiResponse.json();
        
        if (!apiResponse.ok || apiData.status === 'error' || apiData.error) {
            // Forward the error from the external API
            const errorMessage = apiData.error || apiData.message || "Product not found or API returned an error.";
            return res.status(apiResponse.status).json({ 
                error: errorMessage,
                barcode: barcode 
            });
        }

        // 5. Success: Extract and return only the necessary, sanitized data
        const product = apiData.products ? apiData.products[0] : apiData; 
        // Adjust based on if the API returns an array (products) or a single object

        return res.status(200).json({
            product_name: product.product_name || product.title || 'Unknown Product',
            barcode: barcode,
            price: product.price || product.sale_price || 'Price not listed'
            // Include any other required fields here
        });

    } catch (error) {
        console.error('External API fetch error:', error);
        return res.status(500).json({ error: "Failed to communicate with the external Barcode API." });
    }
}