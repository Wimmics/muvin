
// D3 and related libraries
import * as d3 from 'd3';
import 'd3-selection-multi';
import 'd3-color';
import 'd3-scale-chromatic';
import 'd3-array';

// web component template
import template from './js/template.js';

import timelineCSS from './css/timeline.css';
import navBarCSS from './css/nav-bar.css';
import timesliderCSS from './css/timeslider.css';
import contextMenuCSS from './css/d3-context-menu.css';

// Local JavaScript modules
import { computePixelValue } from './js/utils.js';
import DataModel from './js/dataModel.js';

import TimeAxis from './js/time/timeaxis.js';

import NodesAxis from './js/nodesaxis.js';

import StreamGraph from './js/temporal-profile/profileStreamGraph.js';

import LinksGroup from './js/links/links.js';
import NodeLinksGroup from './js/links/node-links.js';

import ImageNodes from './js/items/imagesNodes.js';
import NormalNodes from './js/items/normalNodes.js';

import TooltipFactory from './js/tooltip/tooltipFactory.js';

import NavBar from './js/tab-system/navbar.js'

import { transform } from './js/transform/transform.js';

class Muvin extends HTMLElement {
    constructor () {
        super()

        this.svg = null
        this.width = null
        this.height = null
        this.margin = { top: 30, right: 50, bottom: 50, left: 150 }

        this.visibleNodes = null
        this.visibleItems = null
        this.visibleProfile = null

        this.showItems = true
        this.incremental = true // if the webcomponent is used with sparqlResults, the incremental approach is deactivated. We assume that the user wants to visualize the data given in input.

        // To organize private attributes (e.g. query, endpoint)
        this.internalData = new WeakMap()
        this.internalData.set(this, {}); // Initialize internal storage
    }

    set sparqlQuery(query) {
        const data = this.internalData.get(this) || {};
        data.sparqlQuery = query;
        this.internalData.set(this, data);
    }
    
    get sparqlQuery() {
        return this.internalData.get(this)?.sparqlQuery;
    }

    set sparqlEndpoint(endpoint) {
        const data = this.internalData.get(this) || {};
        data.sparqlEndpoint = endpoint;
        this.internalData.set(this, data);
    }
    
    get sparqlEndpoint() {
        return this.internalData.get(this)?.sparqlEndpoint;
    }

    set sparqlProxy(url) {
        const data = this.internalData.get(this) || {};
        data.sparqlProxy = url;
        this.internalData.set(this, data);
    }
    
    get sparqlProxy() {
        return this.internalData.get(this)?.sparqlProxy;
    }

    set sparqlResults(sparqlResults) {
        const data = this.internalData.get(this) || {};
        data.sparqlResults = sparqlResults?.results?.bindings;
        this.internalData.set(this, data);
    }   

    get sparqlResults() {
        return this.internalData.get(this)?.sparqlResults;
    }

    set encoding(encoding) {
        const data = this.internalData.get(this) || {};
        data.encoding = encoding;
        this.internalData.set(this, data);
    }

    get encoding() {
        return this.internalData.get(this)?.encoding;
    }

    async connectedCallback() {
        this.attachShadow({ mode: "open" })

        const style = document.createElement('style');
        style.textContent = timelineCSS + navBarCSS + timesliderCSS + contextMenuCSS;
        this.shadowRoot.appendChild(style);

        this.shadowRoot.appendChild(template.content.cloneNode(true));
        
        // Treat query parameters
        this.app = this.getAttribute("app") // include a config file to avoid using this attribute
        this.token = this.getAttribute("token") // for crobora, see to use it on the app side

        this.div = d3.select(this.shadowRoot.querySelector('div.timeline'))
        this.svg = this.div.select('svg#chart')

        this.updateDimensions() // set width and height of the chart

        this.group = this.svg.select('g#chart-group')
            .attr('transform', `translate(0, ${this.margin.top})`)

        d3.select(this.shadowRoot).on('click', () => {
            this.shadowRoot.querySelectorAll('div.context-menu').style = 'none'
        })
        
        this.data = new DataModel(this)

        this.xAxis = new TimeAxis(this) // temporal axis formed by years
        this.yAxis = new NodesAxis(this) // axis formed by authors/artists names (nodes of the first level of the network)

        this.nodes = this.app === 'crobora' ? new ImageNodes(this) : new NormalNodes(this)
        this.nodes.set()
        
        this.fstlinks = new LinksGroup(this)
        this.sndlinks = new NodeLinksGroup(this)
        this.sndlinks.set()

        this.profiles = new StreamGraph(this)

        this.tooltip = TooltipFactory.getTooltip(this.app, this)
        this.tooltip.hideAll()

        this.navBar = new NavBar(this)
        this.navBar.set()
    }

    updateDimensions() {
        this.defaultWidth = this.width = computePixelValue('width', this.getAttribute("width"), this.parentElement) || 1200;
        this.height =  computePixelValue('height', this.getAttribute("height"), this.parentElement) || 800;
        this.height *= .9 // reduce height by 10% to leave space for the toolbar

        if (this.getAttribute("width") === null) {
            console.warn('No width specified for the chart. Using default value of 1200px.');
        }
        if (this.getAttribute("height") === null) {
            console.warn('No height specified for the chart. Using default value of 800px.');
        }

        
        this.svg.attr('height', this.height).attr('width', this.width)
    }

    clear() {
        this.shadowRoot.querySelector('.toolbar').style.display = 'none'
        this.div.style('display', 'none')
    }

    display() {
        this.shadowRoot.querySelector('.toolbar').style.display = 'flex'
        this.div.style('display', 'flex')
        this.hideLoading()
    }

    /**
     * Update the view when adding or removing a node from the network
     * @param {} focus An object defining the node on focus 
     */
    async update(focus){
        
        if (this.data.isEmpty()) {
            this.clear()
            return
        }

        this.display()

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
        else {
            //this.data.updateFilters('timeTo', 20)
            //this.chart.data.updateFilters('timeFrom', +this.lowerSlider.value)
            this.draw()
        }

        this.navBar.update() // update elements of the nav bar
            
    }

    draw() {
        this.width = this.xAxis.range()[1]
        
        this.svg.attr('height', this.height).attr('width', this.width)

        this.profiles.draw()
        this.nodes.draw()
        this.fstlinks.draw()
    }

    async launch(values) {
        if (this.sparqlQuery && this.sparqlEndpoint) {
            this.showLoading()
            this.incremental = true // if the webcomponent is used with sparqlResults, the incremental approach is deactivated. We assume that the user wants to visualize the data given in input.
            await this.data.load(values, { query: this.sparqlQuery, endpoint: this.sparqlEndpoint, proxy: this.sparqlProxy, token: this.token } )
            await this.update()
        } else if (this.sparqlResults) {
            this.showLoading()
            this.incremental = false // if the webcomponent is used with sparqlResults, the incremental approach is deactivated. We assume that the user wants to visualize the data given in input.
            for (let value of values) {
                console.log('Transforming data for value:', value)
                const data = await transform(value, this.sparqlResults, this.encoding)
                await this.data.update(data)
            }
            await this.update()
        }
    } 
    

    /// helpers

    isIncremental() {
        return this.incremental
    }

    showLoading() {
        this.shadowRoot.querySelector('#loading').style.display = "block";
    }

    hideLoading() {
        this.shadowRoot.querySelector('#loading').style.display = "none";
    }

    getToken() {
        return this.token;
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

    /**
     * Verify whether the global option for drawing items is active
     * 
     * @returns true or false
     */
    drawItems() {
        return this.showItems
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
    async isUncertain(d) {        
        let items = await this.data.getItems().filter(a => a.id === d.item.id && a.year === d.year)
        let foundInSource = items.some(a => a.node.key === d.source)
        let foundIntarget = items.some(a => a.node.key === d.target)

        return !(foundInSource && foundIntarget)
    }

    // return chart dimensions
    getDimensions() {
        return { left: this.margin.left, 
            right: this.margin.right, 
            top: this.margin.top, 
            bottom: this.margin.bottom, 
            width: this.width, 
            height: this.height }
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

    /**
     * Verify whether a node or a time period is selected
     * 
     * @param {d} d data record 
     * @returns true or false
     */
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

        let items = await this.data.getItems()
        let nodes = items.filter(e => {
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
}

customElements.define("vis-muvin", Muvin);