class Muvin extends HTMLElement {
    constructor () {
        super()
        this.attachShadow({ mode: "open" })

        this.svg = null
        this.width = null
        this.height = null
        this.margin = { top: 30, right: 50, bottom: 30, left: 150 }
        this.selected_item = null
        
        this.display_all = true
        this.profileColors = true;
        this.itemGlyphs = false;

        this.visibleNodes = null
        this.visibleItems = null
        this.visibleProfile = null

        this.mouseover = {} // information about the hovered node
    }

    async connectedCallback() {
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.app = this.getAttribute("app")
        let values = this.getAttribute("values")
        values = values ? values.split(',').map(d => d.trim()) : []

        this.div = d3.select(this.shadowRoot.querySelector('div.timeline'))
        this.svg = this.div.select('svg#chart')

        this.width = this.div.node().clientWidth - this.margin.right

        this.group = this.svg.select('g#chart-group')
            .attr('transform', `translate(0, ${this.margin.top})`)

        d3.select(this.shadowRoot).on('click', () => {
            this.shadowRoot.querySelectorAll('div.context-menu').style = 'none'
        })
        
        this.data = new DataModel()

        this.xAxis = new TimeAxis() // temporal axis formed by years
        this.yAxis = new NodesAxis() // axis formed by authors/artists names (nodes of the first level of the network)

        this.legend = new Legend() // color legend for links (different types) and items (nodes of the second level of the network)
        this.legend.init()

        this.nodes = this.app === 'crobora' ? new ImageNodes() : new NormalNodes()
        this.nodes.set()
        
        this.fstlinks = new LinksGroup()
        this.sndlinks = new NodeLinksGroup()
        this.sndlinks.set()

        this.profiles = new ProfilesGroup()

        if (this.app === 'hal')
            this.tooltip = new PublicationsTooltip()
        else if (this.app === 'wasabi')
            this.tooltip = new MusicTooltip()
        else if (this.app === 'crobora')
            this.tooltip = new ImageTooltip()

        this.tooltip.hideAll()

        this.menu = new Menu()
        this.menu.init()

        await this.data.fetchNodesLabels(this.app)

        if (values.length)
            values.forEach(async (d) => await this.data.add(d))
        else this.test()

    }

    showLoading() {
        this.shadowRoot.querySelector('#loading').style.display = "block";
    }

    hideLoading() {
        this.shadowRoot.querySelector('#loading').style.display = "none";
    }

    /**
     * Launch test with HAL data
     */
    async test() {
        let values = [];
        
        switch(this.app) {
            case 'crobora':
                values = [{value: 'Angela Merkel', type: 'celebrity'}, 
                    {value: 'Nicolas Sarkozy', type: 'celebrity'}, 
                    {value: 'Europe', type: 'event'}, 
                    {value: 'Charles Michel', type: 'celebrity'}]
                break;
            case 'hal':
                values = [{value: 'Aline Menin'}, {value: 'Marco Winckler'}]
                // values = ['Marco Winckler', 'Philippe Palanque', 'Thiago Rocha Silva', 'Lucile Sassatelli', 'Célia Martinie', 'Aline Menin']
                break;
            case 'wasabi':
                values = [{value: 'Queen'}, {value: 'Freddie Mercury'}, {value: 'David Bowie'}]
                break;
        }
        values.forEach(async (d) => await this.data.add(d))
    }

    /**
     * Update the view when adding or removing a node from the network
     * @param {} focus An object defining the node on focus 
     */
    async update(focus){

        this.shadowRoot.querySelector('.welcome-text').style.display = 'none'
        this.hideLoading()
        this.menu.displayViewSettings()

        this.height = this.div.node().clientHeight

        this.svg.attr('width', this.width)
            .attr('height', window.innerHeight * .9)

        d3.select(this.shadowRoot.querySelector('#nodes-group'))
            .selectAll('g.artist')
            .data(this.data.getNodesKeys())
            .join(
                enter => enter.append('g')
                    .classed('artist', true)
                    .attr('opacity', 1),
                update => update,
                exit => exit.remove()
            )
        
        this.visibleNodes = [...this.data.getNodesKeys()]
        this.visibleProfile = [...this.visibleNodes]
        this.visibleItems = [...this.visibleNodes]

        this.menu.updateItemsSearch()

        this.legend.update()
        this.xAxis.set()
        this.yAxis.set()
        await this.profiles.set()
        
        this.yAxis.drawLabels()

        if (this.yAxis.focus && focus && this.yAxis.focus != focus) 
            this.yAxis.setDistortion(focus)
        else if (this.getTimeSelection()) {
            this.xAxis.setDistortion(this.xAxis.focus)
        } else {
            this.draw()
        }
    }

    draw() {
        this.profiles.draw()
        this.nodes.draw()
        this.fstlinks.draw()
    }

    getData() {
        return this.data;
    }

    areItemsVisible(key) {
        return this.visibleItems.includes(key)
    }

    displayItems(d) {
        this.visibleItems.push(d)
    }

    removeItems(d) {
        let index = this.visibleItems.indexOf(d)
        if (index > -1) this.visibleItems.splice(index, 1)
        return index
    }

    isNodeVisible(key){
        return this.visibleNodes.includes(key)
    }

    isNodeValid(node){
        return this.data.isNodeValid(node)
    }

    displayNode(d) {
        this.visibleNodes.push(d)
    }

    isProfileVisible(key) {
        return this.visibleProfile.includes(key)
    }

    displayProfile(d) {
        this.visibleProfile.push(d)
    }

    removeProfile(d) {
        let index = this.visibleProfile.indexOf(d)
        if (index > -1) this.visibleProfile.splice(index, 1)
        return index
    }

    isProfileActive(d) {
        let key = d.data.artist.key
        if (!this.isNodeVisible(key)) return 0
        if (this.isProfileVisible(key)) return 1;
        if (!this.getNodeSelection() && this.isProfileVisible(key) || (this.isProfileVisible(key) && this.getNodeSelection() && this.isSelected(key))) return 1
        return 0
    }

    getItemColor() {
        return this.data.colors.item.color;
    }

    getTypeValue(key) {
        return this.data.linkTypes[key]
    }

    getTypeColor(key) {
        return this.data.colors.typeScale(key)
    }

    isUncertain(d) {
        let validNodes = d.contributors.filter(e => this.data.getNodesKeys().includes(e.key)) // visible contributors in this item
        validNodes = validNodes.map(d => d.key)
        validNodes = validNodes.filter( (e,i) => validNodes.indexOf(e) === i)
        
        return this.data.getItems().filter(a => a.id === d.id && a.year === d.year).length != validNodes.length
    }

    // return chart dimensions
    getDimensions() {
        return { left: this.margin.left, right: this.margin.right, top: this.margin.top, bottom: this.margin.bottom, width: this.width, height: this.height }
    }

    ////////
    getNodeSelection() {
        return this.yAxis.focus
    }

    // TODO: verify that it still works
    async updateVisibleNodes(){ // according to yAxis focus
        
        let keys = this.data.getNodesKeys()
        let index = keys.indexOf(this.yAxis.focus)
        let nodes = index === -1 || !this.yAxis.focus ? keys : [this.yAxis.focus]

        if (index === 0) {
            nodes.push(keys[index + 1])
            // nodes.push(keys[index + 2])
        } else if (index === keys.length - 1) {
            nodes.push(keys[index - 1])
            // nodes.push(keys[index - 2])
        } else if (this.yAxis.focus) {
            if (index === keys.length - 2)
                nodes.push(keys[index - 1])
            else nodes.push(keys[index + 1])

            // nodes.push(keys[index + 1])
        }

        
        this.visibleItems = [...nodes]
        this.visibleProfile = [...nodes]

    }

    getTimeSelection() {
        return this.xAxis.focus;
    }

    isSelected(d) {
        return this.yAxis.focus === d || this.xAxis.focus === d;
    }

    isFreezeActive() {
        return this.yAxis.freeze
    }

    /**
     * Function that provides the list of items affected by the selected node (mouseover or freeze)
     * @param   {String} d selected label on the y axis
     * @return  {Object} keys: "snd" list of ids of second level nodes, "fst" list of first level nodes 
     */
    getConnectedNodes(d) {
        let value = d || this.yAxis.freeze;

        if (!value) return

        let targets = this.data.links.filter(e => e.source.key === value || e.target.key === value).map(e => e.target.key === value ? e.source.key : e.target.key)
        targets =  targets.filter((e,i) => this.yAxis.values.includes(e) && targets.indexOf(e) === i)

        let nodes = this.data.getItems().filter(e => {
            let values = e.contributors.map(x => x.key)
            return values.includes(value) && values.some(a => targets.includes(a)) 
        })

        nodes = nodes.map(e => e.parent ? [e.id, e.parent.id] : e.id).flat()
        nodes = nodes.filter( (e,i) => nodes.indexOf(e) === i )

        return { snd: nodes, fst: targets } 
        
    }

    isPlayable(d){
        return this.data.artists[d].audio
    }

    /**
     * Function that sets the focus on the selected node (artist/author)
     * @param {String} d selected label on the y axis
     */
    focusOnNode(d) {
        if (!this.isSelected(d) && this.data.getNodesKeys().length > 1) {
            this.yAxis.setDistortion(d)
        }
    }

    async releaseNodeFocus(d) {
        this.yAxis.setDistortion(d)    
    }

    focusOnTime(value) {
        if (this.getTimeSelection()) this.xAxis.setDistortion(value)
        
        else this.xAxis.setSliderPosition(this.xAxis.scale(value) - this.xAxis.getStep(value) / 2, value)
    }

    releaseTimeFocus(d) {
        this.xAxis.setDistortion(d)
    }

    getMouseover() {
        return this.mouseover;
    }

    isMouseover(d) {
        return this.mouseover.id === d.id
    }

    isChildrenMouseover(d) {
        return this.mouseover.parendId === d.id
    }
   

    clear() {
        this.svg.selectAll('g').remove()
    }

}

const template = document.createElement("template");
template.innerHTML = `
    
    <link rel="stylesheet" href="/muvin/css/header.css">
    <link rel="stylesheet" href="/muvin/css/dropdown.css">
    <link rel="stylesheet" href="/muvin/css/timeline.css">
    <link rel="stylesheet" href="/muvin/css/legend.css">
    <link rel="stylesheet" href="/muvin/css/menu.css">
    <link rel="stylesheet" href="/muvin/css/search.css">

    <div class='loading' id='div-loading'></div>
    <div class='tooltip' id='cluster-tooltip'></div>
    <div class='tooltip' id='item-tooltip'></div>
    <div class='tooltip' id='node-tooltip'></div>
    <div class='tooltip' id='profile-tooltip'></div>
    
    <div class="menu">
        
        <h3>Muvin</h3>

        <div id='menu-items' class='settings'>
            <div>
                <label>Search for</label>
                <input type="text" list='nodes-list' id="nodes-input" placeholder="Type here">
                <datalist id='nodes-list'></datalist>
            </div>
            <div id="view-options">
                <div id='view-controls' style='display: none;'>    
                    <div >
                        <label>Search items</label>
                        <input type="text" list='items-list' id="items-input" placeholder="Type here">
                        <datalist id='items-list'></datalist>
                        <button id='items-input-clear'>Clear</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="vis">
        <div id="loading">  
            <img width="70px" height="70px" src="/muvin/images/loading.svg"></img>
            <p>Loading data...</p>
        </div>

        <div class='welcome-text'>
            <p>Welcome to <b>Muvin</b>. To begin the exploration, please search for a value above.</p>
        </div>

        <div class='legend'>  </div>

        <div class='timeline'>
            <svg id="chart">
                <g id ='chart-group'>
                    <g id='top-axis'></g>
                    <g id='bottom-axis'></g>
                    <g id='left-axis'></g>
                    <g id="membership-links-group"></g>
                    <g id='link-group'></g>
                    <g id='nodes-group'></g>
                    <g id='ticks-group'></g>
                    <g id='x-slider'>
                        <rect class='marker move'></rect>
                        <rect id='top-button' class='slider-button move'></rect>
                        <text></text>
                        <rect id='bottom-button' class='slider-button move'></rect>
                    </g>
                    <g id='y-slider'>
                        <image id="slider-up"  ></image>
                        <image id="slider-down" ></image>
                    </g>

                    <g id='labels-group'></g>
                    <g id='nodeLinks-group'> 
                        
                    </g>
                </g>
            </svg>
        </div>
        
    </div>
    `

customElements.define("vis-muvin", Muvin);