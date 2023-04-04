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
}