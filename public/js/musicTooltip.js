class MusicTooltip extends Tooltip{
    constructor() {
        super()
    }

    setItemContent(d, id) {
        
        let conttypes = d.contributors.map(e => e.type)
        conttypes = conttypes.filter( (e,i) => conttypes.indexOf(e) === i)

        const contributors = e => conttypes.map(key => {
            let names = d.contributors.filter(e => e.type === key).map(e => e.name)
            return `<b>${capitalizeFirstLetter(key)}</b>: ${names.join(', ')}`
        }).join('<br>')

        let content = `<b>${d.name} (${d.year})</b><br>
            ${d.parent ? `Album: <b>${d.parent.name} (${d.parent.artist.name})</b><br><br>` : ''}
            ${contributors(d)}<br>
            <br><br>Right-click for more`
        
        this.setContent(content, id); 
    }

    setProfileContent(e, d, id) {
        let artist = d[0].data.artist 
        let year = this.chart.xAxis.invert(e.pageX, 1)

        let data = this.chart.data.getItems()
        let values = data.filter(e => e.artist.key === artist.key && e.year === year && e.artist.contribution.includes(d.key))

        let content = `<b> ${artist.name}</b><br><br>
        <b>Contribution Type:</b> ${capitalizeFirstLetter(d.key)}<br><br>
        <b>${year}: ${values.length}</b> item${values.length > 1 ? 's' : ''}`

        this.setContent(content, id)
    }

    setNodeContent(d, id) {
        
        let value = this.chart.data.artists[d]
        
        let group = value.type === 'Artist_Group'
        console.log(value)

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