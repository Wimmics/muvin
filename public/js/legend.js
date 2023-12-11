class Legend extends SidePanel{
    constructor(data) {
        super(data)

        this.itemRadius = 7
        this.fontSize = '13px'
        this.top = 10
        this.left = 10

        this.div = d3.select(this.chart.shadowRoot.querySelector('div#legend'))

        this.selected = [] // TO-DO: put this in the filters panel

        this.isSet = false;

        //TO-DO: draw a legend for the circles' radius
    }

    init() {

        // color legend for links (i.e. collaboration type)
        this.div.styles({
                'width': this.width + 'px',
                'height': this.height + 'px',
                'overflow': 'hidden'
            })

        this.title = 'Legend'
        this.setTitle()

        this.svg = this.div.append('svg')
            .attrs({
                'width': '100%',
                'height': this.height - 30 + 'px',
                'id': 'link-legend',
                'transform': 'translate(20, 10)'
            })
            
        this.svg.append('text')
            .text(this.chart.app === 'crobora' ? 'Broadcaster' : 'Contribution Type')
            .attr('font-size', this.fontSize)
            .attr('font-weight', 'bold')
            .attr('transform', `translate(0, ${this.top})`)

    }

    set() {
        if (this.isSet) return

        this.colors = this.data.getColors()

        this.drawLinkLegend()

        this.isSet = true;

    }

    drawLinkLegend() {

        let itemHeight = this.itemRadius * 2 + 5;

        this.group = this.svg.selectAll('g')
            .data(this.data.getLinkTypes())
            .join(
                enter => enter.append('g')
                    .attr('transform', (d,i) => `translate(${this.left}, ${this.top + 15 + i * itemHeight})`)
                    
                    .call(g => g.append('circle')       
                        .attr('r', this.itemRadius)
                        .attr('fill', e => this.selected.includes(e) ? '#fff' : this.colors.typeScale(e) )
                        .attr('stroke', d => d3.rgb(this.chart.getTypeColor(d)).darker())
                        .style('cursor', 'pointer')
                        .on('click', d => this.handleClick(d))
                            .call(circle => circle.append('title')
                                .text(e => `Click to display/hide items in this ${this.chart.app === 'crobora' ? 'channel' : 'category'}`))
                        )
                    
                    .call(g => g.append('text')
                        .attr('font-size', this.fontSize)
                        .attr('y', (_,i) => this.itemRadius)
                        .attr('x', (d,i) => 10)
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

        this.close()
            
    }

    handleClick(d) {
        
        if (this.selected.includes(d)) {
            let index = this.selected.indexOf(d)
            this.selected.splice(index, 1)
        }
        else this.selected.push(d)

        this.chart.data.updateFilters('linkTypes', this.selected)
        this.chart.update()

    }

    show() {
        this.div.style('display', 'flex')
    }

    hide() {
        this.div.style('display', 'none')
    }
}