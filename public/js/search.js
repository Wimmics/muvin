class Search{
    constructor() {
        this.chart = document.querySelector("#muvin")
    } 

    init() {
        let eventSource;
        const _this = this;


        d3.select(this.chart.shadowRoot.querySelector('#nodes-input'))
            .on('keydown', () => eventSource = d3.event.key ? 'key' : 'list')
            .on('input', function() {
                if (eventSource === 'key') {
                    if (this.value.length > 2) 
                        _this.updateNodesList(this.value.toLowerCase())
                } else _this.chart.data.add(this.value)
            })
        

        d3.select(this.chart.shadowRoot.querySelector('#items-input'))
            .on('keydown', () => eventSource = d3.event.key ? 'key' : 'list')
            .on('input', function() {
                if (eventSource === 'key') return;
                _this.highlightItem(this.value)
            })

        d3.select(this.chart.shadowRoot.querySelector('#items-input-clear'))
            .on('click', () => this.clearHighlight())
    }

    update(data) {
        this.data = data

        let songNames = this.data.map(d => d.name)
        songNames = songNames.filter((d,i) => songNames.indexOf(d) === i)
        songNames.sort((a,b) => a.localeCompare(b))

        d3.select(this.chart.shadowRoot.querySelector('#items-list'))
            .selectAll('option')
            .data(songNames)
            .join(
                enter => enter.append('option'),
                update => update,
                exit => exit.remove()
            ).attr('value', d => d)
    
    }

    updateNodesList(value) {

        let labels = this.chart.data.nodeLabels.filter(d => d.name.value.toLowerCase().includes(value))
        labels.sort( (a,b) => a.name.value.localeCompare(b.name.value))
 
        d3.select(this.chart.shadowRoot.querySelector('#nodes-list'))
            .selectAll('option')
            .data(labels)
            .join(
                enter => enter.append('option'),
                update => update,
                exit => exit.remove()
            ).attr('value', d => d.name.value)
        
    }



    highlightItem(name){
        let packGroups = d3.selectAll(this.chart.shadowRoot.querySelectorAll('.item-circle'))
            .filter(d => this.chart.nodes.opacity(d) ? true : false)

        let selection = packGroups.filter(d => d.name === name)
       
        if (selection.size()) {
            let data = []
            selection.each(function() {
                let d = d3.select(this).datum()

                data.push({
                    cx: d.x,
                    cy: d.y,
                    r: d.r 
                })
            })   

            d3.select(this.chart.shadowRoot.querySelector('#chart-group'))
                .selectAll('.highlight')
                .data(data)
                .join(
                    enter => enter.append('circle')
                        .attr('fill', 'none')
                        .classed('highlight high-item', true),
                    update => update,
                    exit => exit.remove()
                )
                .attrs(d => d)
        } else {
            d3.selectAll(this.chart.shadowRoot.querySelectorAll('.highlight')).classed('high-item', false)
        }
    }

    clearHighlight() {
        this.chart.shadowRoot.querySelector('#items-input').value = '';
        this.highlightItem('')
    }
}