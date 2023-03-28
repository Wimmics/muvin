class ImageNodes extends NodesGroup {
    constructor() {
        super()

        this.radius = {normal: 7, focus: 50}

    }

    async set() {

        this.group.append('clipPath')
            .attr('id', 'clipObj-focus')
            .append('circle')
            .attr('cx', this.radius.focus / 2 + this.radius.focus / 2)
            .attr('cy', this.radius.focus / 2)
            .attr('r', this.radius.focus / 2);

        this.imageAttrs = {
            width: d => d.r * 2,
            'xlink:href': d => getImageLink(d.name),
            alt: d => d.name,
            opacity: d => this.opacity(d),
            class: 'item-circle',
            display: d => this.chart.getTimeSelection() && this.chart.isSelected(d.year) ? 'block' : 'none',
            'clip-path': d => this.chart.getTimeSelection() && this.chart.isSelected(d.year) ? 'url(#clipObj-focus)' : 'none'
        }

        this.circleAttrs.display = d => !this.chart.isSelected(d.year) ? 'block' : 'none'

        this.forceSimulation.force("collide", d3.forceCollide().radius(d => this.chart.isSelected(d.year) ? d.r / 2 : d.r).iterations(32))
    }

    async computeRadius() {

        let values = this.chart.xAxis.values
        let index = values.indexOf(this.chart.getTimeSelection())
        let focusPos = this.chart.xAxis.scale(values[index])
        let leftmostPos = this.chart.xAxis.scale(values[0])
        let rightmostPos = this.chart.xAxis.scale(values[values.length - 1])

        console.log(d3.range(0.04, 0.4, 0.1))
        let leftScale = d3.scaleQuantize().domain([leftmostPos, focusPos]).range(d3.range(0.04, 0.4, 0.1))
        let rightScale = d3.scaleQuantize().domain([focusPos, rightmostPos]).range(d3.range(0.4, 0.04, -0.1))


        this.data.forEach(d => {
            if (this.chart.getTimeSelection()) {
                if (this.chart.isSelected(d.year)) 
                    d.r = this.radius.focus
                
                else {
                    let curPos = this.chart.xAxis.scale(d.year)
                    
                    let scale = curPos > focusPos ? rightScale(curPos) : leftScale(curPos)
                   
                    d.r = this.radius.focus * scale
                }
            } else d.r = this.radius.normal

        })
    }

    async appendNodes() {

         // a group per item (e.g. an item == an image)
        this.group.selectAll('g.artist')
            .selectAll('.doc')            
            .data(d => this.data.filter(e => e.artist.name === d) )
            .join(
                enter => enter.append('g')
                    .classed('doc', true)
                    .style('pointer-events', d => this.opacity(d) ? 'auto' : 'none')
                    .call(g => g.append('circle')
                            .attrs(this.circleAttrs) )
                    .call(g => g.append('svg:image')
                        .attrs(this.imageAttrs)),
                update => update.style('pointer-events', d => this.opacity(d) ? 'auto' : 'none')
                    .call(g => g.select('circle')
                            .attrs(this.circleAttrs) )
                    .call(g => g.select('image')
                        .attrs(this.imageAttrs) ),
                exit => exit.remove()        
            )

    }
}