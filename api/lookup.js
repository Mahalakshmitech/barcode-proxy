// /api/lookup.js - Dual API Barcode Lookup (UPCitemdb + OpenFoodFacts Backup)

export default async function (req, res) {
    const barcode = req.query.code;

    if (!barcode) {
        return res.status(400).json({ error: "Barcode 'code' parameter is missing." });
    }

    // --- Primary API (UPCitemdb Free Trial) ---
    const UPC_URL = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;

    try {
        const upcResponse = await fetch(UPC_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept-Encoding': 'gzip,deflate'
            }
        });

        const upcData = await upcResponse.json();

        // ✅ Success Case
        if (upcResponse.status === 200 && upcData.code === 'OK' && upcData.items.length > 0) {
            const product = upcData.items[0];
            return res.status(200).json({
                source: "UPCitemdb",
                barcode: barcode,
                product_name: product.title || 'Unknown Product',
                brand: product.brand || 'Unknown Brand',
                price: product.offers?.[0]?.price || 'Not listed'
            });
        }

        // ❌ If UPCItemDB fails, fall back to OpenFoodFacts
        console.warn("UPCitemdb failed, switching to OpenFoodFacts...");
    } catch (err) {
        console.error("UPCitemdb API Error:", err);
    }

    // --- Backup API (OpenFoodFacts) ---
    const OFF_URL = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;

    try {
        const offResponse = await fetch(OFF_URL);
        const offData = await offResponse.json();

        if (offResponse.status === 200 && offData.product) {
            const p = offData.product;
            return res.status(200).json({
                source: "OpenFoodFacts",
                barcode: barcode,
                product_name: p.product_name || 'Unknown Product',
                brand: p.brands || 'Unknown Brand',
                category: p.categories || 'Unknown Category',
                ingredients: p.ingredients_text || 'N/A'
            });
        } else {
            return res.status(404).json({
                error: "Product not found in both UPCitemdb and OpenFoodFacts.",
                barcode: barcode
            });
        }
    } catch (err) {
        console.error("OpenFoodFacts API Error:", err);
        return res.status(500).json({ error: "Failed to contact both APIs." });
    }
}
