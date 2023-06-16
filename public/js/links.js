class LinksGroup {
    constructor() {
        this.chart = document.querySelector('#muvin')

        this.group = d3.select(this.chart.shadowRoot.querySelector('#link-group')) // group that holds the first-level links (i.e. links between authors without details)
        
    }

    getData() {
        let isValid = d => this.chart.isNodeValid(d.source) && this.chart.isNodeValid(d.target) && !this.chart.isSelected(d.item.year)
        let data = this.chart.data.links.filter(d => isValid(d) )
        //data = data.filter( (d,i) => data.some(x => x.source.key === d.target.key && x.target.key === d.source.key) )

        data = data.filter( (d,i) => data.findIndex(e => e.item.id === d.item.id && (e.source.key === d.source.key && e.target.key === d.target.key) || (e.source.key === d.target.key && e.target.key === d.source.key) ) === i)

        return data
    }

    /**
     * draw the first level links (e.g. overal relationship between first level nodes -- authors/artists)
     */
    draw() {

        this.data = this.getData() 

        let nestedData = d3.nest()
            .key(d => d.year)
            .key(d => d.source.key + '-' + d.target.key)
            .entries(this.data)

        console.log(nestedData)
            
        let max = d3.max(nestedData, d => d3.max(d.values, e => e.values.length))
        let strokeScale = d3.scaleLinear()
            .domain([1, max])
            .range([2, 6])
        
        const lineAttrs = { x1: 0,
            x2: 0,
            y1: d => this.chart.yAxis.scale(d.source),
            y2: d => this.chart.yAxis.scale(d.target),
            //'stroke-dasharray': d => this.chart.isUncertain(d) ? 4 : 'none',
            'stroke': '#000',
            'stroke-opacity': 1,
            'stroke-width': d => strokeScale(d.values.length),
            'stroke-linecap': 'round'
        }

        console.log(this.group)

        let timeGroup = this.group.selectAll('g.link-year')
            .data(nestedData)
            .join(
                enter => enter.append('g')
                    .classed('link-year', true),
                update => update,
                exit => exit.remove()
            )
            .attr('transform', d => `translate(${this.chart.xAxis.scale(d.key) + this.chart.xAxis.step(d.key) / 2}, 0)`)
            
        timeGroup.selectAll('.link')
            .data(d => d.values.map(e => ({key: e.key, values: e.values, source: e.key.split('-')[0], target: e.key.split('-')[1], year: d.key }) ))
            .join(
                enter => enter.append('g')
                    .classed('link', true)
                    .call(g => g.append('line')
                        .classed('link-line', true)
                        .style('cursor', 'pointer')
                        .attrs(lineAttrs)
                    )
                    .call(g => g.append('title')
                        .text(d => `Items: ${d.values.length}`)
                    ),
                update => update
                    .call(g => g.select('line')
                        .attrs(lineAttrs)
                    )
                    .call(g => g.select('title')
                        .text(d => `Items: ${d.values.length}`)
                    ),
                exit => exit.remove()
            )

        this.drawTicks('source')
        this.drawTicks('target')

    }

    drawTicks(type) {
        // let headLength = 3
        // const ticksAttrs = { 
        //     x1: d => this.chart.xAxis.scale(d.year) + this.chart.xAxis.step(d.year) / 2 - headLength, 
        //     x2: d => this.chart.xAxis.scale(d.year) + this.chart.xAxis.step(d.year) / 2 + headLength , 
        //     y1: d => this.chart.yAxis.scale(d[type].key), 
        //     y2: d => this.chart.yAxis.scale(d[type].key),
        //     'stroke-opacity': 1,
        //     'stroke': '#000'
        //  }

        const textLength = d => d[type].name.length * 10

        let rectHeight = 25
        const rectAttrs = {
            width: d => textLength(d), 
            height: rectHeight,
            fill: "#f5f5f5",
            stroke: "none",
            rx: 10,
            x: d => this.chart.xAxis.scale(d.year) - textLength(d) - 15,
            y: d => this.chart.yAxis.scale(d[type].key)
        }
        
        const textAttrs = {
            x: d => this.chart.xAxis.scale(d.year) - 20,
            y: d => this.chart.yAxis.scale(d[type].key) + rectHeight * .7
        }
        
        // this.group.selectAll(`g.${type}-ticks`)
        //     .data(this.data)
        //     .join(
        //         enter => enter.append('g')
        //             .classed(`${type}-ticks`, true)
        //             .call(g => g.append('line')
        //                 .classed('tick', true)
        //                 .attr('stroke', '#000')
        //                 .attr('stroke-opacity', 1)
        //                 .attrs(ticksAttrs)),

        //         update => update
        //             .call(g => g.select('line').attrs(ticksAttrs)),

        //         exit => exit.remove()
        //     )

        d3.select(this.chart.shadowRoot.querySelector('#ticks-group'))
            .selectAll(`g.${type}-labels`)
            .data(this.data)
            .join(
                enter => enter.append('g')
                    .classed(`${type}-labels`, true)
                    .style('display', 'none')
                    .style('pointer-events', 'none')

                    .call(g => g.append('rect')
                        .classed('link-label', true)
                        .attrs(rectAttrs)
                    )
                    .call(g => g.append('text')
                        .classed('link-label', true)
                        .style('font-size', '12px')
                        .style('font-weight', 'bold')
                        .style('text-anchor', 'end')
                        .attrs(textAttrs)
                        .text(d => d[type].name)
                    ),

                update => update
                    .call(g => g.select('rect').attrs(rectAttrs))
                    .call(g => g.select('text').attrs(textAttrs).text(d => d[type].name)),

                exit => exit.remove()
            )

    }

    downplay() {
        this.group.selectAll('.link').attr('opacity', 0)

        this.group.selectAll("[class$='-ticks']").attr('opacity', 0)
        
        this.hideLabels()
    }

    highlight(d) {
        
        this.group.selectAll('.link')
            .attr('opacity', e => (e.source === d.artist.key || e.target === d.artist.key) && e.values.some(x => x.item.id === d.id) && e.year === d.year ? 1 : 0)
          
        this.chart.group.selectAll("[class$='-labels']")
            .style('display', e => e.item.id === d.id && e.year === d.year ? 'block' : 'none')

        // this.group.selectAll("[class$='-ticks']")
        //     .attr('opacity', e => e.item.id === d.id && e.year === d.year ? 1 : 0)
    }

    reverse() {
        this.group.selectAll('.link').attr('opacity', 1)

        this.group.selectAll("[class$='-ticks']").attr('opacity', 1)

        this.hideLabels()
    }

    hideLabels() {
        this.chart.group.selectAll("[class$='-labels']").style('display', 'none')
    }

    mouseover() {

    }

    mouseout() {

    }
}