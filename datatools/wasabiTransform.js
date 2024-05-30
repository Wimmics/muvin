const { Transform } = require('./transform')

const D3Node = require('d3-node')
const d3 = new D3Node().d3  

class WasabiTransform extends Transform{
    constructor(app, data) {
        super(app, data)
    }

    async transformNode(res) {
        let key = this.hash(this.node.value)

        if (!res.length) {
            this.data.node = { key: key, name: this.node.value }
            return;
        }

        let members;
        if (res[0].memberOf) 
            members = res.map(d => ({ name: d.memberOf.value, 
                            from: d.memberFrom ? d.memberFrom.value : 'Not Available', 
                            to: d.memberTo ? d.memberTo.value : 'Not Available' }))

        let birth = res[0].birthDate
        let death = res[0].deathDate

        this.data.node = {
            key: key,
            name: res[0].name.value,
            id: res[0].uri.value,
            type: res[0].type.value,
            lifespan: {from: birth ? birth.value : 'Not Available',  to: death ? death.value : 'Not Available' },
            memberOf: members
        }
    }

    async clean() {
        
        let nestedValues = d3.nest()
            .key(d => d.id.value)
            .entries(this.values)

        this.values = nestedValues.map(d => {

            let ref = d.values[0]

            let egoRoles = d.values.map(e => { 
                let type = e.egoRole.value.split('/'); 
                return type[type.length-1] 
            })

            egoRoles = egoRoles.filter( (e,i) => egoRoles.indexOf(e) === i)


            let alters = d.values.map(e => { 
                    let type = e.alterRole.value.split('/')
                    return { name: e.alter.value, type: type[type.length - 1].toLowerCase() } 
                })

            alters = alters.filter( (e,i) => alters.findIndex(x => x.name === e.name && x.type === e.type) === i)

            return {
                id: ref.id.value,
                title: ref.title.value,
                date: ref.date.value,
                type: ref.type.value,
                link: `https://wasabi.i3s.unice.fr/#/search/artist/${ref.parentId.value ? encodeURIComponent(ref.parentNodeName.value) : encodeURIComponent(ref.node.value)}/album/${ref.parentId.value ? encodeURIComponent(ref.parentName.value) : encodeURIComponent(ref.title.value)}${ref.parentId.value ? '/song/' + encodeURIComponent(ref.title.value) : '#'}`,

                nodeName: this.node.value,
                nodeType: this.node.type,
                nodeLink: `https://wasabi.i3s.unice.fr/#/search/artist/${encodeURIComponent(this.node.value)}`,
                nodeContribution: egoRoles,
                
                parentId: ref.parentId ? ref.parentId.value : null,
                parentTitle: ref.parentName ? ref.parentName.value : null,
                parentDate: ref.parentDate ? ref.parentDate.value : null,
                parentType: ref.parentType ? ref.parentType.value : null,
                parentNodeName: ref.parentNodeName ? ref.parentNodeName.value : null,
                parentNodeId: ref.parentNodeId ? ref.parentNodeId.value : null,
                parentNodeType: ref.parentNodeType ? ref.parentNodeType : null,

                contributors: alters,
            }
        })
   
    }
}

// let test = new WasabiTransform()
// test.getData({ value: 'Queen'})

module.exports = {
    WasabiTransform: WasabiTransform
}