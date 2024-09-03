class Tooltip {
    constructor() {
        this.chart = document.querySelector('#muvin')
    }

    set() {
    
    }

    hideAll() {
        d3.selectAll(this.chart.shadowRoot.querySelectorAll('.tooltip'))
            .style('display', 'none')
    }

    hide(id) {
        d3.select(this.chart.shadowRoot.querySelector(`#${id}-tooltip`))
            .style('display', 'none')
    }

    setContent(htmlContent, id) {
        d3.select(this.chart.shadowRoot.querySelector(`#${id}-tooltip`)).html(htmlContent)
    }

    show(event, id, width = 250) {
        let tooltip = this.chart.shadowRoot.querySelector(`#${id}-tooltip`)
        tooltip.style.display = 'block';
        
        let x = event.pageX + 10,
            y = event.pageY + 10,
            tHeight = tooltip.clientHeight,
            tWidth = tooltip.clientWidth;

        if ( (x + tWidth) > window.innerWidth) x -= (tWidth + 30)
        if ( (y + tHeight) > window.innerHeight) y -= (tHeight + 30)

        d3.select(tooltip)
            .styles({
                left: x + 'px',
                top: y +'px',
                'pointer-events': 'none',
                'max-width': width + 'px'
            })
    }

    getVisibleCollaborators(d) {
        let nodes = Object.keys(this.chart.data.getNodes())
        return d.collaborators.filter(e => e.key !== d.key && nodes.includes(e.key))
    } 

    ////////////
    // General implementations of the tooltips. For custom content, extend the class and overwrite the methods below 

    setItemContent(d, id) {
        const itemName = `<b>${d.title} (${d.year})</b><br>`
        const type = `<b>Type:</b> ${d.type}`
        const more = `<br><br>Click for more`

        let keys = this.chart.data.getNodesKeys()
        
        const contributors = e => `<b>${e.contnames.length} node(s):</b> ${e.contributors.map(val => keys.includes(val.key) ? `<b><i>${capitalizeFirstLetter(val.name)}</i></b>` : capitalizeFirstLetter(val.name)).join(', ')}`

        this.setContent(`${itemName}<br>${contributors(d)}<br><br>${type}${more}`, id); 
    }

    async setProfileContent(e, d, id) {
        let node = d[0].data.node
        let year = this.chart.xAxis.invert(e.pageX, 1)

        let data = await this.chart.data.getItems()
        let values = data.filter(e => e.node.key === node.key && e.year === year && e.node.contribution.includes(d.key))
        let totalYear = data.filter(e => e.node.key === node.key && e.year === year)        

        let content = `<b> ${node.name} (${year})</b><br>
        <b>${totalYear.length}</b> items<br><br>
        <b>${capitalizeFirstLetter(d.key)}</b>: <b>${values.length}</b> item${values.length > 1 ? 's' : ''}<br><br>
        Click to keep it highlighted`

        this.setContent(content, id)
    }

    setNodeContent(d, id) {
        let value = this.chart.data.getNodeById(d)
        
        let content = `<b>${value.name}</b><br>
        <b>${value.collaborators.length}</b> relationships in total<br>
        <b>${this.getVisibleCollaborators(value).length}</b> relationships in this network<br><br>
            `

        this.setContent(content, id)
    }
}