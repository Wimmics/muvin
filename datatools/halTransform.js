const { Transform } = require('./transform')

const D3Node = require('d3-node')
const d3 = new D3Node().d3  

class HALTransform extends Transform{
    constructor(app, data) {
        super(app, data)
    }

    async transformNode(res) {
        if (!res.length) return
        
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

    
}

// let test = new HALTransform()
// test.getData({ value: 'Aline Menin'})

module.exports = {
    HALTransform: HALTransform
}