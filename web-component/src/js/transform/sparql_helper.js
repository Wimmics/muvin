const prepareQuery = (query) => {
    const encoded = new URLSearchParams({ query }).toString();
    return encoded.replace(/%20/g, '+'); // optional if you need '+' instead of '%20'
};

async function sendRequest(url) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/sparql-results+json' },
        });
       
        if (!response.ok) {
            return { message: `Request failed with status: ${response.statusText} (${response.status}). Please try again later.` };
        }
        
        try {
            return await response.json();
        } catch (error) {
            return { message: "Error processing response. Please try again later." };
        }

    } catch (error) {

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return { message: 'Network error: Failed to fetch the resource. Check your network connection.' };
        }
        return { message: `An unexpected error occurred: ${error.message}` };
    }
}

export async function executeQuery(query, endpoint, proxy, withOffset = false) {
    let offset = 0;
    const data = [];

    let url = `${endpoint}?` // default, if no proxy provided (might result in CORS issues)
    if (proxy)
        url = `${proxy}?endpoint=${endpoint}&` // proxy url sends the query from server side

    while (true) {
        const pagedQuery = query.replace('$offset', offset);
        const result = await sendRequest(url + prepareQuery(pagedQuery));
       
        if (result.message) {
            return data.length ? data : result;
        }

        const bindings = result?.results?.bindings || [];
        data.push(...bindings);
        
        
        if (!withOffset || bindings.length === 0 || bindings.length < 10000) break;
        
        offset += 10000;
    }

    return data;
}
