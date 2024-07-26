const datasets = {

    // Wasabi
    wasabi: { 
        type: 'sparql',
        endpoint: "http://wasabi.inria.fr/sparql",
        categories: ["performer", "producer", "author"],

        prefixes: `
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        prefix dcterms: <http://purl.org/dc/terms/>
        prefix foaf:    <http://xmlns.com/foaf/0.1/>
        prefix schema:  <http://schema.org/>
        prefix wsb:     <http://ns.inria.fr/wasabi/ontology/>
        prefix mo:      <http://purl.org/ontology/mo/>`,
        
        items: 
        `
        select distinct ?uri ?id ?title ?date 
        (replace(str(?type), "http://ns.inria.fr/wasabi/ontology/", "") as ?type) 
        ?parentId ?parentName 
        (replace(str(?parentType), "http://ns.inria.fr/wasabi/ontology/", "") as ?parentType) 
        ?parentDate ?parentNodeId ?parentNodeName 
        ?ego ?egoRole 
        ?alter ?alterRole where {
            
            bind ("$node" as ?ego)

            { ?uri ?egoRole ?ego  }
            union
            { ?uri ?egoRole [ foaf:name ?ego ] }
        
            filter (?egoRole = schema:author || ?egoRole = mo:producer || ?egoRole = mo:performer)

            ?uri dcterms:title ?title ; a ?type . filter (?type != wsb:Album) 

            { ?uri schema:releaseDate ?date } union { ?uri schema:datePublished ?date }

            optional { ?uri mo:uuid ?id }

            optional { ?uri schema:album ?parentURI . 
                    ?parentURI dcterms:title ?parentName ; 
                                mo:uuid ?parentId ; 
                                mo:performer ?parentNode ;
                                a ?parentType .
                    
                ?parentNode mo:uuid ?parentNodeId ; foaf:name ?parentNodeName .
                optional { ?parentURI schema:releaseDate ?parentDate } }


            { ?uri ?alterRole ?alter . filter ( ?alterRole = schema:author || ?alterRole = mo:producer)} 
            union 
            { ?uri ?alterRole [ foaf:name ?alter ] . filter (?alterRole = mo:performer) }


        } limit 10000 `,

        nodeFeatures: `
        select distinct ?name ?uri (replace(str(?type), "http://ns.inria.fr/wasabi/ontology/", "") as ?type) ?birthDate ?deathDate ?memberOf ?memberFrom ?memberTo where {
            bind ("$node" as ?name)

            { ?uri a wsb:Artist_Person . ?uri foaf:name ?name }
            union
            { ?uri a wsb:Artist_Group . ?uri foaf:name ?name }
            union
            { ?uri a mo:MusicArtist . ?uri foaf:name ?name }

            ?uri a ?type.

            optional { { ?uri schema:foundingDate ?birthDate } union { ?uri schema:birthDate ?birthDate } }

            optional { {?uri schema:dissolutionDate ?deathDate } union { ?uri schema:deathDate ?deathDate } }

            optional { ?uri schema:members ?member . 
                    ?member foaf:name ?memberOf . 
                            optional { ?member schema:startDate ?memberFrom ; 
                                    schema:endDate ?memberTo } }

        } `,

        nodeNames: `SELECT distinct ?a ?value WHERE {
            { ?a a wsb:Artist_Person } union { ?a a wsb:Artist_Group } union { ?a a  mo:MusicArtist}
            ?a foaf:name ?value
          } limit 10000 offset $offset`

    },


    // HAL Archives Ouverts
    hal: {
        type: 'sparql',
        endpoint: "http://sparql.archives-ouvertes.fr/sparql",
        categories: ["Conference Paper", "Journal Article", "Diploma", "Artwork", "Book / Book Section", "Gray Knowledge"],

        prefixes: `
        PREFIX dcterms: <http://purl.org/dc/terms/>
        PREFIX hsc: <http://data.archives-ouvertes.fr/schema/>
        PREFIX foaf: <http://xmlns.com/foaf/0.1/>
        PREFIX org: <http://www.w3.org/ns/org#>
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        `,
        items:
        `
        select distinct ?uri ?title ?date ?type ?link ?ego ?alter
        where {
                bind ("$node" as ?ego)

                { ?uri dcterms:creator [hsc:person [foaf:name ?ego ] ] }
                union
                { ?uri dcterms:creator [foaf:name ?ego ] }

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
        
            } limit 10000
        `,

        nodeFeatures: `
            select distinct ?uri ?name ?topic  where {
                bind ("$node" as ?name)
                
                ?p a hsc:Author ;
                    hsc:person ?uri .
                
                ?uri foaf:name ?name .
                
                optional { ?uri foaf:interest [ skos:prefLabel ?topic ] . filter langMatches(lang(?topic), 'en') }
    
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
        categories: ['france 2', 'arte', 'tf1', 'rai uno', 'rai due', 'canale 5', 'Web'],

        nodeNames: ['https://crobora.huma-num.fr/crobora-api/cluster/names', 'https://crobora.huma-num.fr/crobora-api/cluster/names2'],
        items: 'https://crobora.huma-num.fr/crobora-api/search/imagesOR?categories=$category&keywords=$value&options=illustration&options=location&options=celebrity&options=event'
    }   
}

module.exports = { datasets }