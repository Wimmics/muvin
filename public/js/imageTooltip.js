class ImageTooltip extends Tooltip{
    constructor() {
        super()

    }

    setItemContent(d, id) { // TO-DO: modify according to crobora data
        const image = `<div style="width: 100%; margin:auto; text-align:center;">
                <a href="${d.link}" target="_blank" style="pointer-events: ${d.link ? 'auto' : 'none'};">
                    <img class="main-image" src=${getImage(d.title, this.chart.getToken())} width="250px" title="Click to explore the archive metadata in the CROBORA platform" ></img> </a>
                <br></div>`

        let content = `${image}
                    <p>Archive: <b>${d.parent.title}</b></p>
                    <p>Broadcast date: <b>${d.parent.date}</b></p>
                    <p><b>Broadcaster:</b> ${d.node.contribution.join(', ')}</p> 
                    <p><b>Keywords(s):</b>
                    <ul style='list-style-type: none;'>
                    ${d.contributors.map(val => `<li title="${val.category}" style="display:flex; gap:10px;"> <img src="${this.chart.baseUrl}/muvin/images/${this.chart.app}/${val.category}-icon.svg" width="15px"></img>${capitalizeFirstLetter(val.name)}</li>` ).join('')}
                    </ul>
                    <br><br><p>Click for more</p>
                    `
        this.setContent(content, id); 
    }

    setProfileContent(e, d, id) { 
        let node = d[0].data.node
        let year = this.chart.xAxis.invert(e.pageX, 1)

        let data = this.chart.data.getItems()
        let values = data.filter(e => e.node.key === node.key && e.year === year && e.node.contribution.includes(d.key))
        let totalYear = data.filter(e => e.year === year)
        
        let content = `<img src="${this.chart.baseUrl}/muvin/images/${this.chart.app}/${node.type}-icon.svg" width="15px"></img><b> ${node.name}</b><br><br>
        <b>Broadcaster:</b> ${capitalizeFirstLetter(d.key)}<br><br>
        <b>${year}: ${values.length}</b> image${values.length > 1 ? 's' : ''} out of ${totalYear.length}<br><br>
        Click to keep it highlighted`

        this.setContent(content, id)
    }

    setNodeContent(d, id) {
        let value = this.chart.data.getNodeById(d)
        
        let content = `<b>${value.name}</b><br><br>
            Category: <b>${value.type}</b><br>
            <b>${value.collaborators.length}</b> co-occurrences in total<br>
            <b>${this.getVisibleCollaborators(value).length}</b> co-occurrences in this network<br><br>`

        this.setContent(content, id)
    }
}