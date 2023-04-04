class Legend {
    constructor() {
        this.itemRadius = 7
        this.fontSize = '13px'
        this.left = 10

        this.chart = document.querySelector('#muvin')
        this.div = d3.select(this.chart.shadowRoot.querySelector('div.legend'))

        this.selected = []
    }

    init() {

        // color legend for links (i.e. collaboration type)
        this.linkLegend = this.div.append('div')
            .classed('link-legend', true)

        this.linkLegend.append('svg')
            .attr('id', 'link-legend')
            .append('text')
                .text(this.chart.app === 'crobora' ? 'Broadcaster' : 'Contribution Type')
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

        let itemWidth = d3.max(this.data, d => d.length * 12)

        let svg = this.div.select('svg#link-legend')
            .attr('width', this.data.length * (itemWidth + this.itemRadius))
            .attr('height', this.div.node().clientHeight)

        this.group = svg.selectAll('g')
            .data(this.data)
            .join(
                enter => enter.append('g')
                    .attr('transform', `translate(0, 35)`)
                    
                    .call(g => g.append('circle')
                        .attr('cx', (d,i) => this.left + i * itemWidth)
                        .attr('cy', this.left)         
                        .attr('r', this.itemRadius)
                        .attr('fill', e => this.selected.includes(e) ? '#fff' : this.colors.typeScale(e) )
                        .attr('stroke', d => d3.rgb(this.chart.getTypeColor(d)).darker())
                        .style('cursor', 'pointer')
                        .on('click', d => this.handleClick(d))
                            .call(circle => circle.append('title')
                                .text(e => `Click to ${this.selected.includes(e) ? 'display' : 'hide'} items of this ${this.chart.app === 'crobora' ? 'channel' : 'type'}`))
                        )
                    
                    .call(g => g.append('text')
                        .attr('font-size', this.fontSize)
                        .attr('y', (_,i) => this.itemRadius * 2)
                        .attr('x', (d,i) => this.left + (this.itemRadius * 2) + i * itemWidth)
                        .text(d => capitalizeFirstLetter(d))),
                update => update
                    .call(g => g.select('circle')
                        .attr('cx', (d,i) => this.left + i * itemWidth)
                        .attr('fill', e => this.selected.includes(e) ? '#fff' : this.colors.typeScale(e)) )

                    .call(g => g.select('text')
                        .attr('x', (d,i) => this.left + (this.itemRadius * 2) + i * itemWidth)
                        .text(d => capitalizeFirstLetter(d))),
                exit => exit.remove()
            )

            
    }

    handleClick(d) {
        
        if (this.selected.includes(d)) {
            let index = this.selected.indexOf(d)
            this.selected.splice(index, 1)
        }
        else this.selected.push(d)

        this.chart.data.updateFilters('linkTypes', this.selected)

    }

    show() {
        this.div.style('display', 'flex')
    }

    hide() {
        this.div.style('display', 'none')
    }
}