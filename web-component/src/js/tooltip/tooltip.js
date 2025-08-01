import * as d3 from 'd3'
import { capitalizeFirstLetter } from '../utils.js'
class Tooltip {
    constructor(chart) {
        this.chart = chart
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
        const itemName = `<b>${d.title}<br><br>${this.chart.getTimeLabel()}:</b> ${d.year}<br><br>`
        const type = `<b>${this.chart.getColorLabel()}:</b> ${d.type}`
        const more = d.link ? `Click to go to source` : `Source link not provided`

        let keys = this.chart.data.getNodesKeys()
        let linkedNodes = d.contributors.filter(e => e.key !== d.node.key && e.name)    
    
        const contributors = () => `<b>${linkedNodes.length} ${this.chart.getNodeLabel()}(s):</b> ${linkedNodes.map(val => keys.includes(val.key) ? `<b><i>${capitalizeFirstLetter(val.name)}</i></b>` : capitalizeFirstLetter(val.name)).join(', ')}`

        let content = `<b>${itemName}</b>`

        if (linkedNodes.length > 0) {
            content += contributors() + `<br><br>`
        }

        content += `${type}<br><br>${more}`

        this.setContent(content, id); 
    }

    async setProfileContent(e, d, id) {
        let node = d[0].data.node

        // Calculate the time step being hovered
        const svgRect = this.chart.svg.node().getBoundingClientRect();
        const mouseX = e.pageX - svgRect.left;
        const time = this.chart.xAxis.invert(mouseX);

        let data = await this.chart.data.getItems()
        let values = data.filter(e => e.node.key === node.key && e.year === time && e.node.contribution.includes(d.key))
        let count = data.filter(e => e.node.key === node.key && e.year === time)        
        let percentage = ((values.length / count.length) * 100).toFixed(0)

        let content = `<b>${this.chart.getTimeLabel()}: ${time}</b> <br>
        <b>${this.chart.getNodeLabel()}:</b> ${capitalizeFirstLetter(node.name)}<br><br>
        <table border="1" cellpadding="6">
            <tr>
                <td colspan="2"><strong>Count of ${this.chart.getItemLabel()}</strong></td>
            </tr>
            <tr>
                <td><strong>Total:</strong></td>
                <td>${count.length}</td>
            </tr>
            <tr>
                <td><strong>${capitalizeFirstLetter(d.key)}:</strong></td>
                <td><strong>${values.length}</strong> (<strong>${percentage}%</strong>)</td>
            </tr>
        </table><br>

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

    setLinkContent(d, id) {
       
        let content = `<strong>${this.chart.getItemLabel()}:</strong> ${d.item.title}<br>
            <strong>${this.chart.getColorLabel()}:</strong> ${d.type}<br>
            <strong>${this.chart.getNodeLabel()}:</strong> ${capitalizeFirstLetter(d.item.node.name)}`

        this.setContent(content, id)
        this.show(d3.event, id)
    }
}

export default Tooltip