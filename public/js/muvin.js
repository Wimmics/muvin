class Muvin extends HTMLElement {
    constructor () {
        super()
        this.attachShadow({ mode: "open" })

        this.svg = null
        this.width = null
        this.height = null
        this.margin = { top: 30, right: 50, bottom: 30, left: 150 }

        this.visibleNodes = null
        this.visibleItems = null
        this.visibleProfile = null

        this.showItems = true
    }

    setAppAttributes() {
        this.nodes = new NormalNodes()
        switch(this.app) {
            case 'hal':
                this.tooltip = new PublicationsTooltip()
                this.nodeNature = 'author'
                break
            case 'wasabi':
                this.tooltip = new MusicTooltip()
                this.nodeNature = 'artist'
                break
            case 'crobora':
                this.tooltip = new ImageTooltip()
                this.nodeNature = 'keyword'
                this.nodes = new ImageNodes()
                break
        }
    }

    async connectedCallback() {
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.app = this.getAttribute("app")
        this.setAppAttributes()

        this.searchHidden = this.getAttribute("search") === "true"

        this.baseUrl = ''
        this.url = this.baseUrl + `/muvin/${this.app}`

        this.div = d3.select(this.shadowRoot.querySelector('div.timeline'))

        this.defaultWidth = this.width = this.div.node().clientWidth
        
        this.svg = this.div.select('svg#chart')

        this.group = this.svg.select('g#chart-group')
            .attr('transform', `translate(0, ${this.margin.top})`)

        d3.select(this.shadowRoot).on('click', () => {
            this.shadowRoot.querySelectorAll('div.context-menu').style = 'none'
        })

        this.search = new NodesSearch() // nodes search bar
        this.search.init()
        
        this.data = new DataModel()

        this.xAxis = new TimeAxis() // temporal axis formed by years
        this.yAxis = new NodesAxis() // axis formed by authors/artists names (nodes of the first level of the network)

        // this.legend = new Legend() // color legend for links (different types) and items (nodes of the second level of the network)
        // this.legend.init()

        this.nodes.set()
        
        this.fstlinks = new LinksGroup()
        this.sndlinks = new NodeLinksGroup()
        this.sndlinks.set()

        this.profiles = new StreamGraph()

        this.tooltip.hideAll()

        this.menu = new Menu(this.data)
        this.menu.init()

        

        await this.data.fetchNodesLabels(this.app)

        let value = this.getAttribute("value")
        let type = this.getAttribute("type")
        
        let values = []
        if (value) {
            value = value.split(',')
            type = type ? type.split(',') : null
            value.forEach( (d,i) => {
                let v = { value: d.trim() }
                if (type)
                    v.type = type[i].trim()

                values.push(v)
            })
        }

        if (this.searchHidden) this.menu.hideSearchFor()
        
        console.log("values = ", values)
        if (values.length) { 
            if (values.length > 10) {
                this.showItems = false
            }
            // this.menu.toggleDisplayItems(this.showItems)
            this.data.load(values)
        }
        
        // else this.test() 

    }

    showLoading() {
        return;
        this.shadowRoot.querySelector('#loading').style.display = "block";
    }

    hideLoading() {
        return;
        this.shadowRoot.querySelector('#loading').style.display = "none";
    }

    /**
     * Update the view when adding or removing a node from the network
     * @param {} focus An object defining the node on focus 
     */
    async update(focus){

        if (this.data.isEmpty()) {
            this.shadowRoot.querySelector('.welcome-text').style.display = 'block'
            this.shadowRoot.querySelector('#display-items-info').style.display = 'none'
            this.menu.hideViewSettings()
            this.legend.hide()
            this.div.style('display', 'none')
            return
        }

        // this.shadowRoot.querySelector('#display-items-info').style.display = 'block'

        this.div.style('display', 'flex')
        // this.shadowRoot.querySelector('.welcome-text').style.display = 'none'
        this.hideLoading()
        //this.menu.displayViewSettings()

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

        this.height = this.shadowRoot.querySelector('.timeline').clientHeight

        //this.legend.update()
        this.menu.update() //TO-DO: reactivate once menu is ready
        this.xAxis.set()
        this.yAxis.set()
        await this.profiles.set()
        
        this.yAxis.drawLabels()
        this.xAxis.drawLabels()
        this.xAxis.drawSlider()

        if (this.yAxis.focus && focus && this.yAxis.focus != focus) 
            this.yAxis.setDistortion(focus)
        else if (this.getTimeSelection()){
            let previousFocus = [...this.xAxis.focus]
            this.xAxis.clearFocus()
            previousFocus.forEach(async (d) => await this.xAxis.computeDistortion(d))
            this.xAxis.setDistortion()
        }
        else 
            this.draw()
    }

    draw() {

        this.width = this.xAxis.range()[1]
       
        this.svg.attr('height', this.height).attr('width', this.width)

        this.profiles.draw()
        this.nodes.draw()
        this.fstlinks.draw()

        
    }

    getDefaultWidth() {
        return this.defaultWidth
    }

    getData() {
        return this.data;
    }

    updateItemsDisplay(display) {
        this.showItems = display;
        this.draw()
    }

    drawItems() {
        return this.showItems
    }

    areItemsVisible(key) {
        return this.showItems && this.visibleItems.includes(key)
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
        let key = d.data.node.key
        if (!this.isNodeVisible(key)) return 0
        if (this.isProfileVisible(key)) return 1;
        if (!this.getNodeSelection() && this.isProfileVisible(key) || (this.isProfileVisible(key) && this.getNodeSelection() && this.isSelected(key))) return 1
        return 0
    }

    getItemColor() {
        return this.data.colors.item;
    }

    getTypeValue(key) {
        return this.data.linkTypes[key]
    }

    getTypeColor(key) {
        return this.data.colors.typeScale(key)
    }

    /**
     * 
     * @param {*} d a link between two nodes 
     * @returns a boolean indicating whether that link is uncertain or not
     */
    isUncertain(d) {        
        let items = this.data.getItems().filter(a => a.id === d.item.id && a.year === d.year)
        let foundInSource = items.some(a => a.node.key === d.source)
        let foundIntarget = items.some(a => a.node.key === d.target)

        return !(foundInSource && foundIntarget)
    }

    // return chart dimensions
    getDimensions() {
        return { left: this.margin.left, right: this.margin.right, top: this.margin.top, bottom: this.margin.bottom, width: this.width, height: this.height }
    }

    ////////
    getNodeSelection() {
        return this.yAxis.focus
    }

    async updateVisibleNodes(){ // according to yAxis focus
        
        let keys = this.data.getNodesKeys()
        let index = keys.indexOf(this.yAxis.focus)
        let nodes = index === -1 || !this.yAxis.focus ? keys : [this.yAxis.focus]

        if (index === 0) {
            nodes.push(keys[index + 1])
            nodes.push(keys[index + 2])
        } else if (index === keys.length - 1) {
            nodes.push(keys[index - 1])
            nodes.push(keys[index - 2])
        } else {
            nodes.push(keys[index - 1])
            nodes.push(keys[index + 1])
        }

        this.visibleItems = [...nodes]
        this.visibleProfile = [...nodes]
    }

    getTimeSelection() {
        return this.xAxis.focus.length;
    }

    isSelected(d) {
        return this.yAxis.focus === d || this.xAxis.focus.includes(+d)
    }

    isFreezeActive() {
        return this.yAxis.freeze
    }

    isFrozen(id) {
        return this.yAxis.frozenNodes && this.yAxis.frozenNodes.snd.includes(id)
    }

    /**
     * Function that provides the list of items affected by the selected node (mouseover or freeze)
     * @param   {String} d selected label on the y axis
     * @return  {Object} keys: "snd" list of ids of second level nodes, "fst" list of first level nodes 
     */
    async getConnectedNodes(d) {
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
        return this.data.nodes[d].audio
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
        
        else this.xAxis.setSliderPosition(this.xAxis.timeScale(value) - this.xAxis.getStep(value) / 2, value)
    }

    releaseTimeFocus(d) {
        this.xAxis.setDistortion(d)
    }
   

    clear() {
        this.svg.selectAll('g').remove()
    }

    displayNodeCount(value) {
        d3.select(this.shadowRoot.querySelector('#node-count')).text(`Nodes: ${value}`)
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
    <link rel="stylesheet" href="/muvin/css/timeslider.css">

    <div class='loading' id='div-loading'></div>
    <div class='tooltip' id='cluster-tooltip'></div>
    <div class='tooltip' id='item-tooltip'></div>
    <div class='tooltip' id='node-tooltip'></div>
    <div class='tooltip' id='profile-tooltip'></div>

    <div id='menu'>
        <!-- left side buttons -- settings for the current data and visual tools -->
        <div class='menu-buttons' >
            <div class="menu-icon left-icon" id='legend_button' title='Click to see the color-code used in the visualization'>
                <img src="/muvin/images/palette.png"></img>
            </div>
            <div class="menu-icon left-icon" id='dataFilter_button' title='Click to use the filtering mechanisms'>
                <img src="/muvin/images/filter.png"></img>
            </div>
            <div class="menu-icon left-icon" id='dataSort_button' title='Click to reorder the nodes in the visualization'>
                <img src="/muvin/images/sort.png"></img>
            </div>
            <div class="menu-icon left-icon" id='dataSearch_button' title='Click to search for items in the visualization'>
                <img src="/muvin/images/search.svg"></img>
            </div>
            <div class="menu-icon left-icon" style='top: 20px;' id='about_button' title='Click to learn more about the project'>
                <img src="/muvin/images/info.png"></img>
            </div>
        </div>

        <!-- divs activated by the buttons above -->
        <div class='sideNav-bar' id='legend'></div>
        <div class='sideNav-bar' id='dataFilter'></div>
        <div class='sideNav-bar' id='dataSort'></div>
        <div class='sideNav-bar' id='dataSearch'> </div>
    </div>

    <div class="vis">

        <!-- Search bar to begin exploration -->
        <div id="search-for">
            <label id="search-info">Search for</label>
            <input type="text" list='nodes-list' id="nodes-input" placeholder="Type here">
            <datalist id='nodes-list'></datalist>
            <button id="search-go">Go</button>
        
            <button id="clear-network">Clear Network</button>
        </div>

        <!-- div that contains the visualization -->
        <div class='timeline'>

            <label id='node-count' ></label>
            <div class='nodes-panel'>
                <svg>
                    <g id='labels-group'></g>
                </svg>
            </div>

            <svg id="chart">
                <g id ='chart-group'>
                    <g id='top-axis' class='timeaxis' >
                        <line></line>
                    </g>
                    <g id='bottom-axis' class='timeaxis' >
                        <line></line>
                    </g>
                    
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

                
                    <g id='nodeLinks-group'> 
                        
                    </g>
                </g>
            </svg>
        </div>
        
    </div>
    `

customElements.define("vis-muvin", Muvin);