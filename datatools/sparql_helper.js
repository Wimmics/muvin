const fetch = require('node-fetch')


function prepare(query) {
    query = encodeURIComponent(query);
    query = query.replace(/\%20/g, "+");
    query = query.replace(/\(/g, "%28");
    query = query.replace(/\)/g, "%29");
    return query;
}

// async function sendRequest(url){
    
//     let result = await fetch(url).then(async function(response){
//       if(response.status >= 200 && response.status < 300){
//         return await response.text().then(data => {
//           return data
//       })}
//       else return response
//     })
//     return result
// }

async function sendRequest(query, endpoint){
	let url = endpoint + "?query=" + prepare(query); 

	try {
		let response = await fetch(url, { 
			method: 'GET',  
			headers: { 'Accept': "application/sparql-results+json" } 
		})

		if (response.ok) {
			try {
				return await response.json();
			} catch (e) {
				return { message: "An error occurred while processing the response.\nPlease try again later." }
			}
		} else return { message: `Request failed with status: ${response.statusText}.\nPlease try again later.`}

	} catch(error) { // network error
		if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
			return { message: 'Network error: Failed to fetch the resource.\nCheck the browser console for more information.' }
		} else {
			return { message: `An error occurred: ${error.message}` }
		}
	}
}

async function executeQuery(query, endpoint, withOffset) {
	let offset = 0
	let data = []

	let result
	do {
		console.log('offset = ', offset)
		result = await sendRequest( query.replace('$offset', offset), endpoint )
	
		if (result.message && !data.length) return result

		if (result.message) break

		if (!result.message) {
			data = data.concat(result.results.bindings)
		}

		if (!withOffset) break
		
		offset += 10000;

	} while ( result.results.bindings.length )

  	return data;
}

module.exports = { executeQuery, sendRequest }