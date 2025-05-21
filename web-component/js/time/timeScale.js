class TimeScale {
    constructor() {
        this.map = {}
        this.range = []
    }

    setDomain(values) {
        this.domain = values
    }

    getDomain() {
        return this.domain
    }

    setStep(step) {
        this.defaultStep = step
    }

    setStartingPos(min) {
        this.range[0] = min
    }

    getFocus() {
        return this.domain ? this.domain.filter(d => this.map[d].distortion) : null
    }

    getRange() {
        return this.range
    }

    async setMapping() {
        this.map = {}
        this.domain.forEach( (d,i) => {
            this.map[d] = {}
            this.map[d].value = d
            this.map[d].pos = this.range[0] + this.defaultStep * i
            this.map[d].step = this.defaultStep
            this.range[1] = this.map[d].pos + this.defaultStep
        })
    }

    getValue(pos) {
        let values = Object.values(this.map)

        let res;
        if (pos < this.min)
            res = values[0]
        else if (pos > this.range[1])
            res = values[values.length - 1]
        else {
            res = values.find(d => pos >= d.pos && pos < d.pos + d.step)
        }

        return res ? res.value : null
    }

    getStep(value) {
        return this.map[value] ? this.map[value].step : this.defaultStep
    }

    getPos(value) {
        return this.map[value] ? this.map[value].pos : null
    } 

    setFocusLength(length) {
        this.focusLength = length
    }

    async setDistortion(d) {
        let index = this.domain.indexOf(d)
        
        if (this.map[d].distortion) {
            this.map[d].distortion = false
            this.map[d].step = this.defaultStep
            for (let i = index + 1; i < this.domain.length; i++) {
                this.map[this.domain[i]].pos -= this.focusLength
            }
            this.range[1] -= this.focusLength

        } else {
            this.map[d].distortion = true
            this.map[d].step += this.focusLength
            for (let i = index + 1; i < this.domain.length; i++) {
                this.map[this.domain[i]].pos += this.focusLength
            }
            this.range[1] += this.focusLength
        }
    }

    toString() {
        console.log(this.map)
    }
    
}

export default TimeScale