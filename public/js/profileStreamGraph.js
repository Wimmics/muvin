class StreamGraph extends Profile {
    constructor() {
        super()
    }

    async setStack() {
        this.stack
            .offset(d3.stackOffsetSilhouette)
            .order(d3.stackOrderNone)
    }

    getHeight(d) {
        let height = this.chart.yAxis.getStep(d) // reference height for the wave
        if (!this.chart.getNodeSelection()) 
            return height * .6

        if (this.chart.isSelected(d) && this.chart.data.getNodesKeys().indexOf(d) === 0) 
            return height * .5

        if (this.chart.data.getNodesKeys().indexOf(d) === 0) 
            return height * .8
        
        return height
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
        this.heightScale.range([-height, height]) // changes for each node
        return this.area(d)
    }

}