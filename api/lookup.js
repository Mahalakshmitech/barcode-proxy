// /api/lookup.js on Vercel - Corrected for UPCItemDB Free Trial

export default async function (req, res) {
    // 1. Get the barcode from the query string (e.g., ?code=123)
    const barcode = req.query.code;

    if (!barcode) {
        // If no barcode is provided, return a 400 Bad Request error.
        return res.status(400).json({ error: "Barcode 'code' parameter is missing." });
    }

    // Since we are using the free UPCItemDB trial endpoint,
    // we do not need the API_KEY or the key check.
    
    // **CRITICAL CHANGE: Use the UPCItemDB trial URL without a key parameter**
    const BARCODE_API_URL = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;

    try {
        const apiResponse = await fetch(BARCODE_API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Optional: Adding gzip compression for faster responses
                'Accept-Encoding': 'gzip,deflate' 
            }
        });

        // 2. Read data and check for errors from the external API
        const apiData = await apiResponse.json();
        
        // UPCItemDB uses a 'code' value to indicate success or failure.
        // 'OK' is success. Anything else (like 400 or 500) indicates an error.
        if (apiData.code !== 'OK' || apiResponse.status !== 200) {
            
            // Construct a meaningful error message from the API's response
            const errorMessage = apiData.message || apiData.error || "Product not found or API returned an error.";
            
            // Forward the error status (e.g., 404 Not Found)
            return res.status(apiResponse.status).json({ 
                error: errorMessage,
                barcode: barcode 
            });
        }

        // 3. Success: Extract and return only the necessary data
        // The API returns an array of items, we only need the first one.
        const product = apiData.items[0]; 

        return res.status(200).json({
            product_name: product.title || 'Unknown Product',
            barcode: barcode,
            price: product.offers[0].price || 'Price not listed'
            // We return the price from the first offer listed
        });

    } catch (error) {
        console.error('External API fetch error:', error);
        // Catch network errors or JSON parsing issues
        return res.status(500).json({ error: "Failed to communicate with the external Barcode API." });
    }
}