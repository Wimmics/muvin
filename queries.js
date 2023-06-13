const datasets = {

    // Wasabi
    wasabi: { 
        type: 'sparql',
        url: "http://wasabi.inria.fr/sparql",
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
        select distinct ?id ?name ?date ?artist (replace(str(?type), "http://ns.inria.fr/wasabi/ontology/", "") as ?type) ?parentId ?parentName ?parentDate ?parentArtistId ?parentArtistName ?contributors where {
            { select * where {
                bind ("$author" as ?artist)

                { ?uri ?contribution ?artist  }
                union
                { ?uri ?contribution [ foaf:name ?artist ] }
            
                ?uri dcterms:title ?name ; a ?type . filter (?type != wsb:Album) 
                
                { ?uri schema:releaseDate ?date } union { ?uri schema:datePublished ?date }
                
                optional { ?uri mo:uuid ?id }

                optional { ?uri schema:album ?parentURI . ?parentURI dcterms:title ?parentName ; mo:uuid ?parentId ; mo:performer ?tmpParentArtist . 
                    ?tmpParentArtist mo:uuid ?parentArtistId ; foaf:name ?parentArtistName .
                    optional {?parentURI schema:releaseDate ?parentDate } }

            } }

            { select ?uri (group_concat(distinct concat(?p, '&&', ?n) ; separator = '--') as ?contributors) where {
                { ?uri ?p ?n . filter ( ?p = schema:author || ?p = mo:producer)} 
                union 
                { ?uri ?p [ foaf:name ?n ] . filter (?p = mo:performer) }
            } } 

        } limit 10000 offset $offset `,

        nodeFeatures: `
        select distinct ?name ?uri (replace(str(?type), "http://ns.inria.fr/wasabi/ontology/", "") as ?type) ?birthDate ?deathDate ?memberOf ?memberFrom ?memberTo where {
            bind ("$author" as ?name)

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
        url: "http://sparql.archives-ouvertes.fr/sparql",
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
        select distinct (?uri as ?id) ?artist ?name ?date ?type ?contributors ?link
            where {
            
                { select * where {
                    bind ("$author" as ?artist)
            
                    { ?uri dcterms:creator [hsc:person [foaf:name ?artist ] ] }
                    union
                    { ?uri dcterms:creator [foaf:name ?artist ] }
            
                    ?uri dcterms:title ?name ; 
                        dcterms:type [ dc:identifier ?typeId ] ; 
                        dcterms:issued ?date ;
                        dcterms:identifier ?halId .
                    
                    bind ( if(?typeId in ("COMM", "POSTER", "PRESCONF", "UNDEFINED"), "Conference Paper", 
                             if(?typeId in ("ART"), "Journal Article", 
                                if(?typeId in ('ETABTHESE', 'THESE', 'HDR'), "Diploma", 
                                   if(?typeId in ('MAP', 'PATENT', 'SON', 'VIDEO', 'IMG'), "Artwork", 
                                      if(?typeId in ('OUV', 'COUV', 'DOUV'), "Book / Book Section", "Gray Knowledge"))))) as ?type)

                    bind (if (contains(?halId, "http"), ?halId, concat("https://hal.science/", ?halId)) as ?link) 
            
                } }
        
                { select ?uri (group_concat(distinct concat(?n) ; separator = '--') as ?contributors) where {
                    { ?uri dcterms:creator [foaf:name ?n ] }
                    union
                    { ?uri dcterms:creator [hsc:person [foaf:name ?n ] ] }
                } } 
        
            } limit 10000 offset $offset
        `,

        nodeFeatures: `
            select distinct ?uri ?name ?topic ?memberOf  where {
                bind ("$author" as ?name)
                
                ?p a hsc:Author ;
                    hsc:person ?uri .
                
                ?uri foaf:name ?name .
                
                optional { ?uri foaf:interest [ skos:prefLabel ?topic ] . filter langMatches(lang(?topic), 'en') }
                optional { ?p hsc:structure [ skos:prefLabel ?memberOf ] }
            }
        `,

        nodeNames: `SELECT distinct ?value WHERE {
            ?a a foaf:Person ; foaf:name ?value . 

          } limit 10000 offset $offset`
    } ,

    // CROBORA
    crobora: {
        type: 'api',
        url: "http://dataviz.i3s.unice.fr/crobora-api/",
        categories: ['france 2', 'arte', 'tf1', 'rai uno', 'rai due', 'canale 5', 'Web'],

        nodeNames: ['http://dataviz.i3s.unice.fr/crobora-api/cluster/names', 'http://dataviz.i3s.unice.fr/crobora-api/cluster/names2'],
        items: 'http://dataviz.i3s.unice.fr/crobora-api/search/imagesOR?categories=$category&keywords=$value&options=illustration&options=location&options=celebrity&options=event'
    }   
}

module.exports = { datasets }