import Profile from './profile.js';
import * as d3 from 'd3';

class StreamGraph extends Profile {
    constructor(chart) {
        super(chart)
    }

    async setStack() {
        this.stack
            .offset(d3.stackOffsetSilhouette)
            .order(d3.stackOrderNone)
    }

    getHeight(d) {
        let height = this.chart.yAxis.getStep(d) // reference height for the wave
        if (!this.chart.getNodeSelection()) // no selected node
            return height * .6

        if (this.chart.isSelected(d) && this.chart.data.getNodesKeys().indexOf(d) === 0) // the given node is selected and it is the first one in the list
            return height * .5
        
        return height * .5
    }

    getExtent(){
        // compute min and max height of waves
        let min = 1000, max = -1000;
        this.data.forEach(d => {
            d.data.forEach(item => {
                item.forEach(e => {
                    let min_e = d3.min(e),
                        max_e = d3.max(e);
                    if (min > min_e) min = min_e;
                    if (max < max_e) max = max_e;
                })
            })
        })

        return [min, max]
    }

    setArea(d, key) {
        let height = this.getHeight(key)
        this.heightScale.range([-height * .7, height * .7]) // changes for each node
        return this.area(d)
    }

}

export default StreamGraph