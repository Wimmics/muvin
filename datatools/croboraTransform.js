const { Transform } = require('./transform')

const sparql = require('./sparql_helper')

class CroboraTransform extends Transform{
    constructor() {
        super('crobora')
    }

    async fetchItems() {
        let query = this.queries.items.replace(/\$category/g, this.node.type).replace(/\$value/g, encodeURIComponent(this.node.value))
        let res = await sparql.sendRequest(query)
        this.values = JSON.parse(res)
    }

    async fetchNodeFeatures() { 
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
                                                                type: this.linkTypes.includes(d.channel.toLowerCase()) ? d.channel.toLowerCase() : "web", 
                                                                category: key, 
                                                                key: [x, key].join('-') } ))
                })
                return vals
            }

            return {
                id: d._id,
                title: d.image_title,
                date: d.day_airing,
                type: 'image',
                
                nodeName: this.node.value,
                nodeType: this.node.type,
                nodeContribution: [ d.channel.toLowerCase() ],

                contributors: getContributors(),
                link: `http://dataviz.i3s.unice.fr/crobora/document/${d.ID_document}`,
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