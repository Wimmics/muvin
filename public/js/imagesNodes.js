class ImageNodes extends NodesGroup {
    constructor() {
        super()

        this.radius = {normal: 7, focus: 40}

    }

    async set() {

        this.group.append('clipPath')
            .attr('id', 'clipObj-focus')
            .append('circle')
            .attr('cx', this.radius.focus / 2 + this.radius.focus / 2)
            .attr('cy', this.radius.focus / 2 )
            .attr('r', this.radius.focus / 2);

        this.imageAttrs = {
            width: d => d.r * 2,
            'xlink:href': d => getImageLink(d.title),
            alt: d => d.name,
            opacity: d => this.opacity(d),
            class: 'item-circle',
            display: d => this.chart.getTimeSelection() && this.chart.isSelected(d.year) ? 'block' : 'none',
            'clip-path': d => 'url(#clipObj-focus)'
        }

        this.imageBorderAttrs = {
            r: d => d.r / 2,
            cx: d => d.r / 2 + d.r / 2,
            cy: d => d.r / 2,
            opacity: d => this.opacity(d),
            stroke: "#fff",
            'stroke-width': 3,
            class: 'image-border',
            display: d => this.chart.getTimeSelection() && this.chart.isSelected(d.year) ? 'block' : 'none',
            fill: 'none'
        }

        this.circleAttrs.display = d => !this.chart.isSelected(d.year) ? 'block' : 'none'

        this.forceSimulation
            // .force("x", d3.forceX()
            //     .strength(d => this.chart.getTimeSelection() && this.chart.isSelected(d.year) ? .1 : .5)
            //     .x(d => this.chart.xAxis.scale(d.year) + this.chart.xAxis.step(d.year) / 2))
            
            // .force("y", d3.forceY()
            //     .strength(d => this.chart.getTimeSelection() && this.chart.isSelected(d.year) ? .9 : .5)
            //     .y(d => this.chart.yAxis.scale(d.node.key))) 

            .force("collide", d3.forceCollide().radius(d => this.chart.isSelected(d.year) ? d.r / 2 : d.r).iterations(32))

            .on("tick", () => this.group.selectAll('.doc')
                .attr('transform', d => `translate(${d.x}, ${d.y})` ))
    }

    async computeRadius() {

        this.data.forEach(d => {
            if (this.chart.getTimeSelection()) {
                if (this.chart.isSelected(d.year)) 
                    d.r = this.radius.focus
                
            } else d.r = this.radius.normal

        })
    }

    async appendNodes() {

         // a group per item (e.g. an item == an image)
        this.group.selectAll('g.artist')
            .selectAll('.doc')            
            .data(d => this.data.filter(e => e.node.key === d) )
            .join(
                enter => enter.append('g')
                    .classed('doc', true)
                    .style('pointer-events', d => this.opacity(d) ? 'auto' : 'none')
                    .call(g => g.append('circle')
                            .attrs(this.circleAttrs) )
                    .call(g => g.append('svg:image')
                        .attrs(this.imageAttrs))
                    .call(g => g.append('circle')
                        .attrs(this.imageBorderAttrs)),
                update => update.style('pointer-events', d => this.opacity(d) ? 'auto' : 'none')
                    .call(g => g.select('circle.item-circle')
                            .attrs(this.circleAttrs) )
                    .call(g => g.select('image')
                        .attrs(this.imageAttrs) )
                    .call(g => g.select('circle.image-border')
                        .attrs(this.imageBorderAttrs)),
                exit => exit.remove()        
            )

    }


}