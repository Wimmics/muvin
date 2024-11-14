const datasets = {

    // Wasabi
    wasabi: { 
        type: 'sparql',
        endpoint: "http://wasabi.inria.fr/sparql",

        items: `
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        prefix dcterms: <http://purl.org/dc/terms/>
        prefix foaf:    <http://xmlns.com/foaf/0.1/>
        prefix schema:  <http://schema.org/>
        prefix wsb:     <http://ns.inria.fr/wasabi/ontology/>
        prefix mo:      <http://purl.org/ontology/mo/>

        select distinct ?uri ?title ?date (REPLACE(STR(?egoRole), ".*/", "") AS ?type) ?ego ?alter ?parentId ?parentName where {

        { ?uri ?egoRole ?ego  }
        union
        { ?uri ?egoRole [ foaf:name ?ego ] }

        filter (?ego = "$node")

        filter (?egoRole = schema:author || ?egoRole = mo:producer || ?egoRole = mo:performer)

        ?uri dcterms:title ?title ; a ?type . filter (?type != wsb:Album) 

        { ?uri schema:releaseDate ?date } union { ?uri schema:datePublished ?date }

        { ?uri schema:author ?alter } 
        union 
        { ?uri mo:producer ?alter }
        union
        { ?uri mo:performer [ foaf:name ?alter ] }
            
        optional { ?uri schema:album ?parentId . ?parentId dcterms:title ?parentName . }


        } limit 10000`,

        nodeNames: `SELECT distinct ?a ?value WHERE {
            { ?a a wsb:Artist_Person } union { ?a a wsb:Artist_Group } union { ?a a  mo:MusicArtist}
            ?a foaf:name ?value
          } limit 10000 offset $offset`

    },


    // HAL Archives Ouverts
    hal: {
        type: 'sparql',
        endpoint: "http://sparql.archives-ouvertes.fr/sparql",
        items:
        `
        PREFIX dcterms: <http://purl.org/dc/terms/>
        PREFIX hsc: <http://data.archives-ouvertes.fr/schema/>
        PREFIX foaf: <http://xmlns.com/foaf/0.1/>
        PREFIX org: <http://www.w3.org/ns/org#>
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

        select distinct ?uri ?title ?date ?type ?link ?ego ?alter
        where {
                { ?uri dcterms:creator [hsc:person [foaf:name ?ego ] ] }
                union
                { ?uri dcterms:creator [foaf:name ?ego ] }

                filter (?ego = "$node")

                ?uri dcterms:title ?title ; 
                    dcterms:type [ dc:identifier ?typeId ] ; 
                    dcterms:issued ?date ;
                    dcterms:identifier ?halId .

                bind ( if(?typeId in ("COMM", "POSTER", "PRESCONF", "UNDEFINED"), "Conference Paper", 
                        if(?typeId in ("ART"), "Journal Article", 
                            if(?typeId in ("ETABTHESE", "THESE", "HDR"), "Diploma", 
                            if(?typeId in ("MAP", "PATENT", "SON", "VIDEO", "IMG"), "Artwork", 
                                if(?typeId in ("OUV", "COUV", "DOUV"), "Book / Book Section", "Gray Knowledge"))))) as ?type)

                
                filter (!contains(?halId, "http"))
                bind (concat("https://hal.science/", ?halId) as ?link) 

        
                { ?uri dcterms:creator [foaf:name ?alter ] }
                union
                { ?uri dcterms:creator [hsc:person [foaf:name ?alter ] ] }
        
            } 
        `,

        nodeNames: `SELECT distinct ?value WHERE {
            ?a a foaf:Person ; foaf:name ?value . 

          } limit 10000 offset $offset`
    } ,

    // CROBORA
    crobora: {
        type: 'api',
        endpoint: "https://crobora.huma-num.fr/crobora-api/",

        nodeNames: ['https://crobora.huma-num.fr/crobora-api/cluster/names', 'https://crobora.huma-num.fr/crobora-api/cluster/names2'],
        items: 'https://crobora.huma-num.fr/crobora-api/search/imagesOR?categories=$category&keywords=$value&options=illustration&options=location&options=celebrity&options=event'
    }   
}

module.exports = { datasets }