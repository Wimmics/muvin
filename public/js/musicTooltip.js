class MusicTooltip extends Tooltip{
    constructor() {
        super()
    }

    setNodeContent(d, id) {
        const itemName = `<b>${d.name} (${d.year})</b><br>`
        const more = `<br><br>Right-click for more`
        
        const contributors = e => Object.keys(e.conttypes).map(key => `<b>${capitalizeFirstLetter(key)}</b>: ${e.conttypes[key].length ? e.conttypes[key].join(', ') : 'No Data'}`).join('<br>')

        let content = `${itemName}<br>${contributors(d)}<br>${more}`
        
        this.setContent(content, id); 
    }

    setProfileContent(e, d, id) {
        let artist = d[0].data.artist || d[0].data.artist.name
        let year = this.chart.xAxis.invert(e.pageX, 1)

        let data = this.chart.getData()
        let values = data.items.filter(e => e.artist.name === artist && e.year === year && e.artist.contribution.includes(d.key))

        let content = `<b> ${artist}</b><br><br>
        <b>Contribution Type:</b> ${capitalizeFirstLetter(d.key)}<br><br>
        <b>${year}: ${values.length}</b> item${values.length > 1 ? 's' : ''}`

        this.setContent(content, id)
    }
}