/**
 * Parses the raw Google Pay Dashboard /batchexecute response
 * into a clean, structured array of transaction objects.
 * 
 * GPay Business Console uses a protobuf-over-JSON transport format.
 * The RPtkab RPC returns the transaction list.
 * 
 * CRITICAL: The `note` field (t[9]) can arrive in multiple formats:
 *   - A plain string: "ORDER_12345"
 *   - An array: ["ORDER_12345"]
 *   - A nested array: [["ORDER_12345"]]
 *   - null or undefined
 * We must normalize ALL of these to a plain string.
 * 
 * CRITICAL: The `amount` field uses [currency, rupees, paise]
 * where paise can be a single digit (5 = 05 paise, not 50 paise).
 * We must zero-pad paise to 2 digits.
 */

function extractNote(noteField) {
    if (!noteField && noteField !== 0) return null;
    
    // Plain string
    if (typeof noteField === 'string') return noteField.trim();
    
    // Number (rare, but possible)
    if (typeof noteField === 'number') return String(noteField);
    
    // Array — dig into it
    if (Array.isArray(noteField)) {
        // Try first element
        for (const item of noteField) {
            if (typeof item === 'string' && item.trim().length > 0) return item.trim();
            if (Array.isArray(item)) {
                // Nested array
                for (const sub of item) {
                    if (typeof sub === 'string' && sub.trim().length > 0) return sub.trim();
                }
            }
        }
        // Last resort: stringify the whole thing if it has content
        const flat = JSON.stringify(noteField);
        if (flat !== '[]' && flat !== '[null]' && flat !== '[[]]') return flat;
    }
    
    return null;
}

function parseAmount(amountField) {
    if (!amountField) return 0;
    
    const rupees = amountField[1];
    const paise = amountField[2];
    
    if (rupees === null || rupees === undefined) return 0;
    
    if (paise === null || paise === undefined || paise === 0) {
        return parseFloat(rupees);
    }
    
    // CRITICAL FIX: Zero-pad paise to 2 digits
    // Google sends paise as integer: 5 = 05 paise, 50 = 50 paise
    const paiseStr = String(paise).padStart(2, '0');
    return parseFloat(`${rupees}.${paiseStr}`);
}

function parseTransactions(rawBody) {
    try {
        // Strip out the custom URL header
        const withoutHeader = rawBody.replace(/URL:.*?\n\n/s, '');
        // Split by newlines and find lines starting with [["wrb.fr"
        const lines = withoutHeader.split('\n');
        
        let targetEnvelope = null;
        for (const line of lines) {
            if (line.startsWith('[["wrb.fr"')) {
                try {
                    const outerArray = JSON.parse(line);
                    targetEnvelope = outerArray.find(item => item[0] === 'wrb.fr' && item[1] === 'RPtkab');
                    if (targetEnvelope) break;
                } catch (e) {
                    // Ignore JSON parse errors for partial lines
                }
            }
        }

        if (!targetEnvelope || !targetEnvelope[2]) return [];

        const innerList = JSON.parse(targetEnvelope[2]);
        const transactionsRaw = innerList[0];

        if (!transactionsRaw || !Array.isArray(transactionsRaw)) return [];

        const results = transactionsRaw.map(t => {
            const note = extractNote(t[9]);
            const amount = parseAmount(t[3]);
            
            return {
                merchantTransactionId: t[0], // e.g. "8162837377597833216"
                utr: t[1],                   // e.g. "050701155108"
                timestamp: t[2] && t[2][0] ? new Date(parseInt(t[2][0]) * 1000).toISOString() : null,
                amount,
                payerName: t[8] && t[8][0] ? t[8][0] : null,
                payerUpiId: t[8] && t[8][1] ? t[8][1] : null,
                note,
                status: t[10] === 5 ? 'COMPLETED' : 'UNKNOWN',
                // Debug: keep raw note for logging
                _rawNote: t[9],
                _rawAmount: t[3],
            };
        });

        // Log first transaction's raw structure for debugging
        if (results.length > 0) {
            console.log(`[PARSER] Parsed ${results.length} transactions. Sample: note="${results[0].note}" rawNote=${JSON.stringify(results[0]._rawNote)} amount=${results[0].amount} rawAmount=${JSON.stringify(results[0]._rawAmount)}`);
        }

        return results;

    } catch (e) {
        console.error('Failed to parse transactions:', e.message);
        return [];
    }
}

module.exports = { parseTransactions };
