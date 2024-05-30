const { Transform } = require('./transform')

const sparql = require('./sparql_helper')

class GenericTransform extends Transform{
    constructor(app, data) {
        super(app, data)
    }

    async fetchItems() {
        this.values = await sparql.executeQuery(this.node.query, this.node.endpoint)

        let nodes = this.values.map(d => d.ego.value)
        nodes = nodes.filter( (d,i) => nodes.indexOf(d) === i) 
        this.data.nodes = nodes.map(d => ({ key: this.hash(d), name: d }) )

        
    }

    async fetchNodeFeatures() { }

    async fetchNodeLabels() { }

}

module.exports = {
    GenericTransform: GenericTransform
}