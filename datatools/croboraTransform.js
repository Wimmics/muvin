const { Transform } = require('./transform')

const fetch = require('node-fetch')

class CroboraTransform extends Transform{
    constructor(app, data) {
        super(app, data)
    }

    async fetchItems() {
       

        let params = {
            keywords: [ this.data.node.name ],
            categories: [ this.data.node.type ],
            options: ["illustration", "location", "celebrity", "event"]
        }
        

        try {
            let response = await fetch("https://crobora.huma-num.fr/crobora-api/search/imagesOR", {
                method: "POST", 
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify(params)
            });
    
    
            if (!response.ok) {
                return response;
            }
    
            this.values = await this.clean(await response.json())
    
        } catch (error) {
            return `Fetch failed: ${error}`
        }
        
        return
        
    }

    async getNodeLabels() {
        
        let data = [];
        for (let query of this.nodesQuery) {
            let res = await fetch(query, { 
                method: 'GET',  
                headers: { 'Accept': "application/sparql-results+json" } 
            });
        
            if (res.ok) {  // Corrected from response.ok to res.ok
                const jsonData = await res.json();  // Parse JSON data correctly
                data = data.concat(jsonData);
            } else {
                console.error(`Request failed with status: ${res.status}`);
            }
        }

        return data
    }

    async clean(data) {
        let values = []

        let cleanValues = data.map(d => d.records).flat()

        let categories = ['event', 'location', 'illustration', 'celebrity']

        for (let d of cleanValues) {
            
            const alters = []
            for (let key of categories) {
                if (d[key]) {
                    for (let value of d[key]) {
                        alters.push({ name: value, nature: key });
                    }
                }
            }

            for (let alter of alters) {
                values.push({
                        uri: { value: d._id },
                        ego: { value: this.data.node.name },
                        egoNature: { value: this.data.node.type },
                        type: { value: d.channel.toLowerCase() },
                        title: { value: d.image_title },
                        date: { value: d.day_airing },
    
                        link: { value: `https://crobora.huma-num.fr/crobora/document/${d.ID_document}` },
                        alter: { value: alter.name },
                        alterNature: { value: alter.nature },

                        parentName: { value: d.document_title },
                        parentId: { value: d.ID_document }
                    })
            }
         
        }

        return values
    }

}


// let test = new CroboraTransform('crobora')
// test.getData({ value: 'Angela Merkel', type: 'celebrity' })
// test.getNodeLabels()

module.exports = {
    CroboraTransform: CroboraTransform
}

 