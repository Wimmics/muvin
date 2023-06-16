class NormalNodes extends NodesGroup{
    constructor() {
        super()

        this.radius = {min: 3, max: 15, minFocus: 10, maxFocus: 30}

        this.radiusScale = d3.scaleLog().range([this.radius.min, this.radius.max])
    }

    set() {

        this.forceSimulation.on("tick", () => this.group.selectAll('.doc')
            .attr('transform', d => `translate(${d.x}, ${d.y})` ))
    }

    async computeRadius() {
        this.radiusScale.domain(d3.extent(this.data, d => d.contCount))

        // let values = this.chart.xAxis.values
        // let index = values.indexOf(this.chart.getTimeSelection())
        // let focusPos = this.chart.xAxis.scale(values[index])
        // let leftmostPos = this.chart.xAxis.scale(values[0])
        // let rightmostPos = this.chart.xAxis.scale(values[values.length - 1])


        // let leftScale = d3.scaleQuantize().domain([leftmostPos, focusPos]).range(d3.range(0.05, 0.6, 0.1))
        // let rightScale = d3.scaleQuantize().domain([focusPos, rightmostPos]).range(d3.range(0.6, 0.05, -0.1))

        this.data.forEach(d => {
            if (this.chart.getTimeSelection() && this.chart.isSelected(d.year)) {
                // if (this.chart.isSelected(d.year)) 
                    this.radiusScale.range([this.radius.minFocus, this.radius.maxFocus])
                
                // else {
                //     let curPos = this.chart.xAxis.scale(d.year)
                    
                //     let scale = curPos > focusPos ? rightScale(curPos) : leftScale(curPos)
                    
                //     this.radiusScale.range([this.radius.minFocus * scale, this.radius.maxFocus * scale])
                // }
            } else this.radiusScale.range([this.radius.min, this.radius.max])

            d.r = this.radiusScale(d.contCount)
        })
    }

    async appendNodes() {
        // a group per item (e.g. an item == a song)
        this.group.selectAll('g.artist')
            .selectAll('.doc')            
            .data(d => this.data.filter(e => e.artist.key === d) )
            .join(
                enter => enter.append('g')
                    .classed('doc', true)
                    .style('pointer-events', d => this.opacity(d) ? 'auto' : 'none')
                    .call(g => g.append('circle')
                            .attrs(this.circleAttrs)),
                update => update.style('pointer-events', d => this.opacity(d) ? 'auto' : 'none')
                    .call(g => g.select('circle')
                            .attrs(this.circleAttrs) ),
                exit => exit.remove()        
            )

    }
}