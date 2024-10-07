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
    
            this.values = await response.json();
    
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

    async clean() {
        let cleanValues = this.values.map(d => d.records).flat()

        let categories = ['event', 'location', 'illustration', 'celebrity']
        this.values = cleanValues.map(d => {
        
            let getContributors = () => {
                let vals = []
                categories.forEach(key => {
                    if (d[key]) d[key].forEach( x => vals.push({ name: x, 
                                                                type: d.channel.toLowerCase() || "web", 
                                                                category: key, 
                                                                key: [x, key].join('-') } ))
                })
                return vals
            }

            return {
                id: d._id,
                source: d.source,
                title: d.image_title,
                date: d.day_airing,
                type: d.channel.toLowerCase(),
                
                nodeName: this.data.node.name,
                nodeType: this.data.node.type,
                nodeContribution: [ d.channel.toLowerCase() ],

                contributors: getContributors(),
                link: `https://crobora.huma-num.fr/crobora/document/${d.ID_document}`,
                parentId: d.ID_document,
                parentTitle: d.document_title,
                parentDate: d.day_airing
            }
        })
    }

}


// let test = new CroboraTransform()
// test.getData({ value: 'Angela Merkel', type: 'celebrity' })

module.exports = {
    CroboraTransform: CroboraTransform
}