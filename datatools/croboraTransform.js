const { Transform } = require('./transform')

const sparql = require('./sparql_helper')

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

    async fetchNodeFeatures() { // TODO: review or delete
        let key = this.hash(this.node.value, this.node.type)
        this.data.node = {
            name: this.node.value,
            type: this.node.type,
            key: key
        }
    }

    async fetchNodeLabels() {
        let data = []
        for (let query of this.queries.nodeNames) {
            let res = await sparql.sendRequest(query)
            data = data.concat(JSON.parse(res))
        }

        await this.writeLabels(data)

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

module.exports = {
    CroboraTransform: CroboraTransform
}

 