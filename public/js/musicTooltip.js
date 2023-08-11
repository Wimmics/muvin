class MusicTooltip extends Tooltip{
    constructor() {
        super()
    }

    setItemContent(d, id) {
        
        let conttypes = d.contributors.map(e => e.type)
        conttypes = conttypes.filter( (e,i) => conttypes.indexOf(e) === i)

        let nodes = this.chart.data.getNodesKeys()

        const contributors = e => conttypes.map(key => {
            let names = d.contributors.filter(e => e.type === key).map(e => nodes.includes(e.key) ? `<b><i>${e.name}</i></b>` : e.name)
            return `<b>${capitalizeFirstLetter(key)}</b>: ${names.join(', ')}`
        }).join('<br>')

        let content = `<b>${d.title} (${d.year})</b><br>
            ${d.parent ? `Album: <b>${d.parent.title} (${d.parent.node.name})</b><br><br>` : ''}
            ${contributors(d)}<br>
            <br><br>Click for more`
        
        this.setContent(content, id); 
    }

    setProfileContent(e, d, id) {
        let node = d[0].data.node 
        let year = this.chart.xAxis.invert(e.pageX, 1)

        let data = this.chart.data.getItems()
        let values = data.filter(e => e.node.key === node.key && e.year === year && e.node.contribution.includes(d.key))
        let totalYear = data.filter(e => e.year === year)

        let content = `<b> ${node.name} (${year})</b><br>
        <b>${totalYear.length}</b> songs<br><br>
        <b>${capitalizeFirstLetter(d.key)}</b>: <b>${values.length}</b> song${values.length > 1 ? 's' : ''}<br><br>
        Click to keep it highlighted`

        this.setContent(content, id)
    }

    setNodeContent(d, id) {
        
        let value = this.chart.data.getNodeById(d)
        
        let group = value.type === 'Artist_Group'

        let type = (group ? 'Creation' : 'Birth') + ' Date:'
        let deathInfo = value.lifespan.to ? `<b>${group ? 'Dissolution' : 'Death'} Date:</b> ${value.lifespan.to}\n` : ''
        let groupInfo = `<b>${group ? 'Members' : 'Member Of'}:</b><br> <ul> ${value.memberOf.map(d => `<li><i>${d.name}</i> from ${d.from} to ${d.to}</li>`).join('')}</ul>`
        
        let content = `<b>${value.name}</b><br>
            <b>${type}</b> ${value.lifespan.from}<br>
            ${deathInfo}<br>
            ${groupInfo}<br><br>
            <b>${value.collaborators.length}</b> co-authors in total<br>
            <b>${this.getVisibleCollaborators(value).length}</b> co-authors in this network<br><br>`

        this.setContent(content, id)
    }
}