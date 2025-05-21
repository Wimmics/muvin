
import './profile.js';
class AreaGraph extends Profile {
    constructor(chart) {
        super(chart)
    }

    async setStack() {

    }

    getHeight(d) {
        return this.chart.yAxis.scale(d) - this.chart.yAxis.getPrevPos(d)
    }

    setArea(d, key) {
        let height = this.getHeight(key)
        this.heightScale.range([ 0, -height * .5 ]) // changes for each node
        return this.area(d)
    }

    async getExtent() {
        let nestedItems = d3.nest()
            .key(d => d.node.key)
            .key(d => d.year)
            .key(d => d.type)
            .entries(await this.chart.data.getItems())

        let counts = nestedItems.map(d => d.values.map(e => e.values.map(x => x.values.length))).flat()
        
        let max = d3.max(counts, d => d3.max(d))

        return [ 0, max ]
    }
}
export default AreaGraph