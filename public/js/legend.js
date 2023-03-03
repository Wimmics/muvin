class Legend {
    constructor() {
        this.itemRadius = 7
        this.fontSize = '13px'
        this.left = 10

        this.chart = document.querySelector('#muvin')
        this.div = d3.select(this.chart.shadowRoot.querySelector('div.legend'))
    }

    init() {

        this.div.style('pointer-events', 'none')
        
        // color legend for links (i.e. collaboration type)
        this.linkLegend = this.div.append('div')
            .classed('link-legend', true)

        this.linkLegend.append('svg')
            .attr('id', 'link-legend')
            .append('text')
                .text('Contribution Type')
                .attr('font-size', this.fontSize)
                .attr('transform', `translate(0, 25)`)

        this.hide()
        
    }

    update() {

        let chartData = this.chart.getData()
        this.colors = chartData.colors
        this.data = chartData.linkTypes

        this.drawLinkLegend()

        this.show()

    }

    drawLinkLegend() {

        let itemWidth = d3.max(this.data, d => d.length * 9)

        let svg = this.div.select('svg#link-legend')
            .attr('width', this.data.length * (itemWidth + this.itemRadius))

        svg.selectAll('g')
            .data(this.data)
            .join(
                enter => enter.append('g')
                    .attr('transform', `translate(0, 35)`)
                    
                    .call(g => g.append('circle')
                        .attr('cx', (d,i) => this.left + i * itemWidth)
                        .attr('cy', this.left)         
                        .attr('r', this.itemRadius)
                        .attr('fill', d => this.colors.typeScale(d)) )
                    
                    .call(g => g.append('text')
                        .attr('font-size', this.fontSize)
                        .attr('y', (_,i) => this.itemRadius * 2)
                        .attr('x', (d,i) => this.left + (this.itemRadius * 2) + i * itemWidth)
                        .text(d => capitalizeFirstLetter(d))),
                update => update
                    .call(g => g.select('circle')
                        .attr('cx', (d,i) => this.left + i * itemWidth)
                        .attr('fill', d => this.colors.typeScale(d)) )

                    .call(g => g.select('text')
                        .attr('x', (d,i) => this.left + (this.itemRadius * 2) + i * itemWidth)
                        .text(d => capitalizeFirstLetter(d))),
                exit => exit.remove()
            )
            

            
    }

    show() {
        this.div.style('display', 'flex')
    }

    hide() {
        this.div.style('display', 'none')
    }
}