import * as d3 from 'd3'
import NodesGroup from "./nodes";
import { getSizeScale } from '../lib/SizeScaleCalculator';

class NormalNodes extends NodesGroup{
    constructor(chart) {
        super(chart)

        this.radius = {min: 3, max: 15, minFocus: 10, maxFocus: 30}

        //this.radiusScale = d3.scaleLinear().range([this.radius.min, this.radius.max])
    }

    set() {

        this.forceSimulation.on("tick", () => this.group.selectAll('.doc')
            .attr('transform', d => `translate(${d.x}, ${d.y})` ))
    }

    async computeRadius() {
        // this.radiusScale.domain(d3.extent(this.data, d => d.contributors.length))
        let encoding = this.chart.encoding
        let defaultEncoding = this.chart.getDefaultEncoding()

        let options = {
            domain: this.chart.data.getSizeDomain(),
            range: encoding?.size?.scale?.range || defaultEncoding.size.scale.range,
            type: encoding?.size?.scale?.type || defaultEncoding.size.scale.type
        }

        let scale = getSizeScale(options)

        this.data.forEach(d => {
            // if (this.chart.getTimeSelection() && this.chart.isSelected(d.year)) {
            //         this.radiusScale.range([this.radius.minFocus, this.radius.maxFocus])
            // } else this.radiusScale.range([this.radius.min, this.radius.max])

            // d.r = this.radiusScale(d.contributors.length)
            d.r = scale(d.size)

            if (this.chart.getTimeSelection() && this.chart.isSelected(d.year)) 
                d.r *= 2         
        })
    }

    async appendNodes() {
        // a group per item (e.g. an item == a song)
        this.group.selectAll('g.artist')
            .selectAll('.doc')
            .style('display', d => this.displayCircle(d))            
            .data(d => this.data.filter(e => e.node.key === d) )
            .join(
                enter => enter.append('g')
                    .classed('doc', true)
                    .style('pointer-events', d => this.opacity(d) ? 'auto' : 'none')
                    .call(g => g.append('circle')
                            .attrs(this.circleAttrs) ),
                update => update.style('pointer-events', d => this.opacity(d) ? 'auto' : 'none')
                    .call(g => g.select('circle')
                            .attrs(this.circleAttrs) ),
                exit => exit.remove()        
            )

    }
}

export default NormalNodes