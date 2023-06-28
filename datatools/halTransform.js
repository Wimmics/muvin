const { Transform } = require('./transform')

const D3Node = require('d3-node')
const d3 = new D3Node().d3  

class HALTransform extends Transform{
    constructor() {
        super('hal')
    }

    async transformNode(res) {
        let topics = res.filter(d => d.topic).map(d => d.topic.value)
        topics = topics.filter( (d,i) => topics.indexOf(d) === i)
     
        let key = this.hash(this.node.value)
        this.data.node = {
            key: key,
            name: res[0].name.value,
            id: res[0].uri.value,
            topics: topics
        }
    }

    async clean() {
        
        let nestedValues = d3.nest()
            .key(d => d.uri.value)
            .entries(this.values)

        this.values = nestedValues.map(d => {

            let ref = d.values[0]

            let alters = d.values.map(e => e.alter.value)
            alters = alters.filter( (e,i) => alters.indexOf(e) === i)

            return {
                id: ref.uri.value,
                title: ref.title.value,
                date: ref.date.value,
                type: ref.type.value.toLowerCase(),
                link: ref.link.value,

                nodeName: this.node.value,
                nodeType: this.node.type,
                nodeContribution: [ ref.type.value.toLowerCase() ],

                contributors: alters.map(e => ({ name: e, type: ref.type.value.toLowerCase() })),
            }
        })
   
    }
}

// let test = new HALTransform()
// test.getData({ value: 'Aline Menin'})

module.exports = {
    HALTransform: HALTransform
}