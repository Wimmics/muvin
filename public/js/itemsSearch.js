class ItemsSearch extends SidePanel {
    constructor(data) {
        super(data)

        this.div = d3.select(this.chart.shadowRoot.querySelector('div#dataSearch'))
    }

    init() {
        const _this = this;
        let eventSource; 

        this.div.styles({
            'width': this.width + 'px',
            'height': this.height + 'px',
            'overflow': 'hidden',
        })

        this.title = 'Search'
        this.setTitle()

        let container = this.div.append('div')
            .style('width', '100%')
            .style('height', 'calc(100% - 30px)')
            .style('padding', '5px')

        this.datalist = container.append('datalist')
            .attr('id', 'items-list')

        container.append('input')
            .attr('type', 'text')
            .attr('list', 'items-list')
            .attr('id', 'items-input')
            .attr('placeholder', 'Search items by name')
            .style('width', '90%')
            .style('background-color', 'white')
            .on('keydown', () => eventSource = d3.event.key ? 'key' : 'list')
            .on('input', function() {
                if (eventSource === 'key') return;
                _this.chart.nodes.highlightItem(this.value)
            })
            
        container.append('button')
            .attr('id', 'items-input-clear')
            .style('position', 'relative')
            .style('top', '5px')
            .style('wifth', '40%')
            .style('left', '59%')
            .text('Clear Search')
            .on('click', () => this.chart.nodes.clearHighlight())

        //this.close()
    }

    update() {

        let itemNames = this.data.getItems().map(d => d.title)
        itemNames = itemNames.filter((d,i) => itemNames.indexOf(d) === i)
        itemNames.sort((a,b) => a.localeCompare(b))

        this.datalist
            .selectAll('option')
            .data(itemNames)
            .join(
                enter => enter.append('option'),
                update => update,
                exit => exit.remove()
            ).attr('value', d => d)
    
    }
}