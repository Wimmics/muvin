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

        this.menu = new Menu()
        this.menu.init()
        this.menu.open()

        

        // this.setAttribute('app', 'crobora')
        await this.data.getNodesLabels(this.app)
        this.test()

        // this.testHal()
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
                // await this.data.add('Marco Winckler')
                values = ['Angela Merkel']
                break;
            case 'hal':
                values = ['Aline Menin']
                // values = ['Marco Winckler', 'Philippe Palanque', 'Thiago Rocha Silva', 'Lucile Sassatelli', 'Célia Martinie', 'Aline Menin']
                break;
            case 'wasabi':
                values = ['Eminem']
                // values = ['Eminem', '50 Cent', 'Adam Levine', 'Dr. Dre', 'Bruno Mars']
                break;
        }
        values.forEach(async (d) => await this.data.add(d))
    }

    async update(nodes, focus){

        if (!focus && nodes.length > 5) {
            focus = nodes[nodes.length / 2]
        }
        
        this.hideLoading()
        this.menu.close()
        this.menu.displayViewSettings()

        d3.selectAll(this.shadowRoot.querySelectorAll('.search-bar')).style('display', 'flex')

        this.height = this.div.node().clientHeight

        this.svg.attr('width', this.width)
            .attr('height', window.innerHeight * .8)

        this.visibleNodes = [...nodes]

        this.data.updateNodes(nodes)
        this.data.updateTime()

        this.legend.update()

        this.menu.updateItemsSearch(this.data.items.filter(d => nodes.includes(d.artist.name)))

        this.legend.update()
        this.xAxis.set()
        this.yAxis.set()
        await this.profiles.set()
        
        this.setGroups()

        this.visibleProfile = [...nodes]
        this.visibleItems = [...nodes]
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

    // draw the nodes of the first level of the network (e.g., artists, authors)
    setGroups() {

        let artistGroup = d3.select(this.shadowRoot.querySelector('#nodes-group'))
            .selectAll('g.artist')
            .data(this.data.nodes)
            .join(
                enter => enter.append('g')
                    .classed('artist', true)
                    .attr('opacity', 1),
                update => update,
                exit => exit.remove()
            )
        
        /// one group per artist ; it will hold the profile wave ////////
        artistGroup.selectAll('g.profile')
            .data(d => this.profiles.data.filter(e => e.artist === d))
            .join(
                enter => enter.append('g')
                    .classed('profile', true),
                update => update,
                exit => exit.remove()
            )
        
    }

    getData() {
        return this.data;
    }

    areItemsVisible(d) {
        return this.visibleItems.includes(d)
    }

    displayItems(d) {
        this.visibleItems.push(d)
    }

    removeItems(d) {
        let index = this.visibleItems.indexOf(d)
        if (index > -1) this.visibleItems.splice(index, 1)
        return index
    }

    isNodeVisible(d){
        return this.visibleNodes.includes(d)
    }

    isNodeValid(node){
        return this.data.isNodeValid(node)
    }

    displayNode(d) {
        this.visibleNodes.push(d)
    }

    isProfileVisible(d) {
        return this.visibleProfile.includes(d)
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
        if (!this.isNodeVisible(d.data.artist)) return 0
        if (this.isProfileVisible(d.data.artist)) return 1;
        if (!this.getNodeSelection() && this.isProfileVisible(d.data.artist) || (this.isProfileVisible(d.data.artist) && this.getNodeSelection() && this.isSelected(d.data.artist))) return 1
        return 0
    }

    getColors(type) {
        return this.data.colors[type]
    }

    getTypeValue(key) {
        return this.data.linkTypes[key]
    }

    getTypeColor(key) {
        return this.data.colors.typeScale(key)
    }

    isUncertain(d) {
        return this.data.items.filter(a => a.id === d.id && a.year === d.year).length === 1
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
        
        let index = this.data.nodes.indexOf(this.yAxis.focus)
        let nodes = index === -1 || !this.yAxis.focus ? this.data.nodes : [this.yAxis.focus]

        if (index === 0) {
            nodes.push(this.data.nodes[index + 1])
            // nodes.push(this.data.nodes[index + 2])
        } else if (index === this.data.nodes.length - 1) {
            nodes.push(this.data.nodes[index - 1])
            // nodes.push(this.data.nodes[index - 2])
        } else if (this.yAxis.focus) {
            if (index === this.data.nodes.length - 2)
                nodes.push(this.data.nodes[index - 1])
            else nodes.push(this.data.nodes[index + 1])

            // nodes.push(this.data.nodes[index + 1])
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

        let targets = this.data.links.filter(e => e.source === value || e.target === value).map(e => e.target === value ? e.source : e.target)
        targets =  targets.filter((e,i) => this.yAxis.values.includes(e) && targets.indexOf(e) === i)

        let nodes = this.data.items.filter(e => {
            let values = e.children ? e.children.map(item => item.contnames).flat() : e.contnames
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
        if (!this.isSelected(d) && this.data.nodes.length > 1) {
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


    getWasabiLink(d) {
        if (this.data.nodes.includes(d)) return `https://wasabi.i3s.unice.fr/#/search/artist/${d}` 

        return `https://wasabi.i3s.unice.fr/#/search/artist/${d.data.parent ? d.data.parent.artist.name : d.data.artist.name}/album/${d.data.parent ? d.data.parent.name : d.data.name}${d.data.parant ? '/song/' + d.data.name : '#'}`
    }
    /**
     * 
     * Function that provides a context menu according to the selected element (i.e. first or second level nodes)
     * @param {*} d the selected item
     * @returns a list with the menu options (required by d3-context-menu)
     */
    getContextMenu(d) {
        let menu = []

        if (!this.data.nodes.includes(d) || this.getAttribute('app') === "wasabi") {
            menu.push({ title: 'Go to source', 
            action: d => { 
                let url = d.link || this.getWasabiLink(d);
                window.open(url) 
            } })
        }
        
        if (this.data.nodes.includes(d)) { /// it is an author

            if (this.data.nodes.length > 1) {
                menu.push({ title: d => this.yAxis.freeze === d ? 'Release highlight' : 'Highlight collaborations', 
                            action: d => { 
                                if (this.yAxis.freeze === d) this.yAxis.releaseFreeze()
                                else this.yAxis.setFreeze(d) 
                            }
                        })            
            }

            menu.push({
                title: d => this.isProfileVisible(d) ? 'Hide temporal profile' : 'Show temporal profile',
                action: d => {
                    let index = this.removeProfile(d)
                    if (index > -1 && this.isSelected(d)) this.yAxis.setDistortion(d)
                    if (index === -1) this.displayProfile(d)

                    this.profiles.draw()
                }
            })

            menu.push({
                title: d => this.areItemsVisible(d) ? 'Hide items' : 'Show items',
                action: d => {
                    let index = this.removeItems(d)
                    if (index === -1) this.displayItems(d)

                    this.nodes.draw()
                }
            })

            if (this.data.nodes.length > 1)
                menu.push({
                    title: 'Remove node',
                    action: d => {
                        let focus;
                        if (this.yAxis.focus) {
                            if (this.yAxis.focus === d) {
                                let index = this.data.nodes.indexOf(d)
                                focus = index === 0 ? this.data.nodes[index + 1] : this.data.nodes[index - 1]
                            } else if (this.visibleItems.includes(d)) this.updateVisibleNodes() 
                        }

                        this.data.remove(d, focus)
                    } 
                })

            menu.push({
                title: 'Move',
                children: [
                    {title: 'Up', 
                    action: d => {
                        let index = this.data.nodes.indexOf(d)
                        if (index === 0) return;
                        let indexB = index - 1;
                        this.data.nodes[index] = this.data.nodes[indexB];
                        this.data.nodes[indexB] = d;
                        
                        if (this.yAxis.focus === d) { // if moving the node on focus, change the focus
                            this.yAxis.setDistortion(this.yAxis.focus)
                            this.update(this.data.nodes, this.data.nodes[indexB])
                        } else { // if moving a non-focus node, update the visible nodes and redraw without changing the focus
                            this.updateVisibleNodes() 
                            this.update(this.data.nodes)
                        }
                    } }, 
                    {title: 'Down', 
                    action: d => {
                        let index = this.data.nodes.indexOf(d)
                        if (index === this.data.nodes.length - 1) return;
                        let indexB = index + 1;
                        this.data.nodes[index] = this.data.nodes[indexB];
                        this.data.nodes[indexB] = d;

                        if (this.yAxis.focus === d) { 
                            this.update(this.data.nodes, this.data.nodes[index])
                        } else {
                            this.updateVisibleNodes() 
                            this.update(this.data.nodes)
                        }
                    }} ]
            })

            if (this.data.artists[d].collaborators.length) { /// the author has one or more co-authors
                let collab = { title: 'Explore collaborations' }

                collab.children = this.data.artists[d].collaborators.map(e => { 
                    return { 
                        title: e.name,
                        action: () => {
                            if (this.data.nodes.includes(e.name)) return
                            this.data.add(e.name)
                        },
                        disabled: !e.enabled
                    }; 
                })

                menu.push(collab)
            }
        }

        return menu
    }

    toggleBestOf(display_all){
        this.display_all = display_all
        this.update(this.data.nodes)
    }

    displayBestOfs(){
        return this.display_all
    }

    toggleProfile(value) {
        this.profileColors = value;
        this.draw()
    }

    displayProfileColors() {
        return this.profileColors;
    }

    toggleItems(value) {
        this.itemGlyphs = value;
        this.draw()
    }

    displayItemGlyphs() {
        return this.itemGlyphs;
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
        
        <h3 style="color: white;">Muvin</h3>
        <img src="/muvin/images/open.svg" id="menu-icon" width="20" height="20" class="menu-icon"></img>

        <div class='icon-container'>
            <img src="/muvin/images/data.svg" id="data-icon" width="20"; height="20"; class="menu-icon"></img>
            <img src="/muvin/images/search.svg" id="search-icon" width="20"; height="20"; class="menu-icon"></img>
            <img src="/muvin/images/settings.svg" id="settings-icon" width="20"; height="20"; class="menu-icon"></img>
        </div>

        <div id='menu-items' class='settings'>
            <!-- <div >
                <label>Dataset</label>
                <select id="dataset-list">
                    <option value="" disabled selected>Select a dataset</option>
                    <option value="hal">Hal Open Archive</option>
                    <option value="wasabi">Wasabi</option>
                    <option value="crobora" selected>Crobora</option>
                </select>
            </div> -->
            <div >
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