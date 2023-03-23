const fetch = require('node-fetch')


function prepare(query) {
    query = encodeURIComponent(query);
    query = query.replace(/\%20/g, "+");
    query = query.replace(/\(/g, "%28");
    query = query.replace(/\)/g, "%29");
    return query;
}

async function sendRequest(url){
    
    let result = await fetch(url).then(async function(response){
      if(response.status >= 200 && response.status < 300){
        return await response.text().then(data => {
          return data
      })}
      else return response
    })
    return result
}

function getSparqlUrl(query, uri) {
	return uri + "?query=" + prepare(query) + "&format=application%2Fsparql-results%2Bjson";
}

async function executeQuery(query, endpoint) {
	let offset = 0
	let data = []
	
	let result = await sendRequest( getSparqlUrl( query.replace('$offset', offset), endpoint ) )
	
	try {
		
		result = JSON.parse(result)
		let bindings = result.results.bindings
		data = data.concat(bindings)
		
      	while ( bindings.length ) {
			data = data.concat(bindings)
			
			offset += 10000;
			result = await sendRequest(getSparqlUrl(query.replace('$offset', offset), endpoint))
			result = JSON.parse(result)
			bindings = result.results.bindings
      	}

	} catch(e) {
		console.log(e)
	}

  	return data;
}

module.exports = { executeQuery, sendRequest, getSparqlUrl }