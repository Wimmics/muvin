class ImageNodes extends NodesGroup {
    constructor() {
        super()

        this.radius = {normal: 5, focus: 50}

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
            'xlink:href': d => getImageLink(d.name),
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

        // this.forceSimulation.force("collide", d3.forceCollide().radius(d => this.chart.isSelected(d.year) ? d.r / 2 : (d.cluster ? d.r * 1.2 : d.r) ).iterations(32))
        //     .on("tick", () => this.group.selectAll('.doc')
        //         .attr('transform', d => `translate(${this.chart.isSelected(d.year) ? d.x - this.chart.xAxis.scale(d.year) * .1 : (d.cluster ? d.x - d.r : d.x)}, ${d.cluster ? d.y - d.r : d.y})` ))
    }

    computeRadius(year) {

        let values = this.chart.xAxis.values
        let index = values.indexOf(this.chart.getTimeSelection())
        let focusPos = this.chart.xAxis.scale(values[index])
        let leftmostPos = this.chart.xAxis.scale(values[0])
        let rightmostPos = this.chart.xAxis.scale(values[values.length - 1])

        let leftScale = d3.scaleQuantize().domain([leftmostPos, focusPos]).range(d3.range(0.04, 0.4, 0.1))
        let rightScale = d3.scaleQuantize().domain([focusPos, rightmostPos]).range(d3.range(0.4, 0.04, -0.1))

        //this.data.forEach(d => {
            if (this.chart.getTimeSelection()) {
                if (this.chart.isSelected(year)) 
                    return this.radius.focus
                
                else {
                    let curPos = this.chart.xAxis.scale(year)
                    
                    let scale = curPos > focusPos ? rightScale(curPos) : leftScale(curPos)
                   
                    return this.radius.focus * scale
                }
            } else return this.radius.normal

        //})
    }

    async appendNodes() {

        await this.appendClusters()
        await this.appendSingles()
        

        //this.group.selectAll('.doc').selectAll('circle').remove()

        // let imageData = this.data.filter(d => this.chart.getTimeSelection() === d.year )
        // imageData = imageData.map(d => d.cluster ? d.values : d).flat()
        // console.log(imageData)
        // let group = this.group.selectAll('.doc')
        //     .filter(d => this.chart.getTimeSelection() === d.year)

        // console.log(group)
            
        // group.selectAll('image')
            
            

    }


}