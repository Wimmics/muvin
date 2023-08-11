class ContextMenu {
    constructor() {
        this.chart = document.querySelector('#muvin')

        this.importDiv = this.chart.shadowRoot.querySelector('.import-form')
    }

    getItemMenu() {
        let menu = []
        menu.push({ title: 'Go to source', 
            action: d => window.open(d.link) 
            })

        return menu;
    }

    getNodeMenu(d) {
        let menu = []

        if (this.chart.data.getNodesKeys().length > 1) {
            menu.push({ title: d => this.chart.yAxis.freeze === d ? 'Release highlight' : 'Highlight network', 
                        action: d => { 
                            if (this.chart.yAxis.freeze === d) this.chart.yAxis.releaseFreeze()
                            else this.chart.yAxis.setFreeze(d) 
                        }
                    })            
        }

        menu.push({
            title: d => this.chart.isProfileVisible(d) ? 'Hide temporal profile' : 'Show temporal profile',
            action: d => {
                let index = this.chart.removeProfile(d)
                if (index > -1 && this.chart.isSelected(d)) this.chart.yAxis.setDistortion(d)
                if (index === -1) this.chart.displayProfile(d)

                this.chart.profiles.draw()
            }
        })

        menu.push({
            title: d => this.chart.areItemsVisible(d) ? 'Hide items' : 'Show items',
            action: d => {
                let index = this.chart.removeItems(d)
                if (index === -1) this.chart.displayItems(d)

                this.chart.nodes.draw()
            }
        })

        if (d.nodeLink) 
            menu.push({
                title: 'Go to source',
                action: d => window.open(d.nodeLink)
            })

       
        return menu
    }

    getNetworkMenu(d) {
        let menu = []

        let keys = this.chart.data.getNodesKeys()
        if (keys.length > 1)
            menu.push({
                title: 'Remove node',
                action: d => {
                    let focus;
                    if (this.chart.yAxis.focus) {
                        if (this.chart.yAxis.focus === d) {
                            let index = keys.indexOf(d)
                            focus = index === 0 ? keys[index + 1] : keys[index - 1]
                        } else if (this.chart.visibleItems.includes(d)) this.chart.updateVisibleNodes() 
                    }

                    this.chart.data.remove(d, focus)
                } 
            })

        if (keys.length > 1) {
            menu.push({
                title: 'Move',
                children: [
                    {title: 'Up', 
                    action: d => {
                        let index = keys.indexOf(d)
                        if (index === 0) return;
                        let indexB = index - 1;
                        this.chart.data.switchNodes(index, indexB)
                        
                        if (this.chart.yAxis.focus === d) { // if moving the node on focus, change the focus
                            this.chart.yAxis.setDistortion(this.chart.yAxis.focus)
                            this.chart.update(keys[indexB])
                        } else { // if moving a non-focus node, update the visible nodes and redraw without changing the focus
                            this.chart.updateVisibleNodes() 
                            this.chart.update()
                        }
                    } }, 
                    {title: 'Down', 
                    action: d => {
                        let index = keys.indexOf(d)
                        if (index === keys.length - 1) return;
                        let indexB = index + 1;
                        this.chart.data.switchNodes(index, indexB)

                        if (this.chart.yAxis.focus === d) { 
                            this.chart.update(keys[index])
                        } else {
                            this.chart.updateVisibleNodes() 
                            this.chart.update()
                        }
                    }} ]
                })
        }

        let collaborators = this.chart.data.getNodeById(d).collaborators
        if (collaborators.length) { /// the author has one or more co-authors
            menu.push({ title: 'Explore collaborators', 
                action: (d) => this.openMenuSearch(d, collaborators)
            })
        }

        return menu
    }

    openMenuSearch(d, values) {
       
        const _this = this;

        let div = d3.select(this.importDiv)
            .style('display', 'flex')
        
        let sorting = [{label: "Alphabetic Order", value: 'alpha'}, {label: "Number of Shared Items (Decreasing)", value: 'decreasing'}]

        let node = this.chart.data.getNodeById(d)

        let top = div.select('div#topbar')

        top.select('label')
            .text(`${node.name}: Search for collaborators`)

        top.select('img')
            .on('click', () => div.style('display', 'none'))

        let select = div.select('.sort')
            .attr('id', 'ul-sort')
            .on('change', function() {
                let selectedOption = this.options[this.selectedIndex]
                _this.chart.data.sortCollaborators(selectedOption.value, d)

                createList(_this.chart.data.getNodeById(d).collaborators)
            })

        select.selectAll('option')
            .data(sorting)
            .join(
                enter => enter.append('option'),
                update => update,
                exit => exit.remove()
            )
            .attr('value', d => d.value)
            .text(d => d.label)
            .property('selected', e => e.value === node.sorting)

        div.select('input')
            .on('keyup', search)

        createList(values)
        
        function createList(values) {
            div.select('ul')
                .selectAll('li')
                .data(values)
                .join(
                    enter => enter.append('li')
                        .style('cursor', 'pointer')
                        .call(label => label.append('tspan')
                            .attr('id', 'node')
                            .text(e => `${e.value} ${e.type ? '(' + e.type + ')' : ''} (`))
                        .call(label => label.append('tspan')
                            .attr('id', 'item-count')
                            .text(e => e.values.length)
                            .style('font-weight', 'bold'))
                        .call(label => label.append('tspan')
                            .text(' items)'))
                        ,
                    update => update
                        .call(label => label.select('tspan#node')
                            .text(e => `${e.value} ${e.type ? '(' + e.type + ')' : ''} (`))
                        .call(label => label.select('tspan#item-count')
                            .text(e => e.values.length)),
                    exit => exit.remove()
                )
                .on('click', e => _this.chart.data.open([e]))
        }

        function search() {
            var input, filter, ul, li, a, i, txtValue;
            input = _this.chart.shadowRoot.querySelector("#ul-search");
            filter = input.value.toUpperCase();
            ul = _this.chart.shadowRoot.querySelector("#ul-multi");
            li = ul.getElementsByTagName("li");
            for (i = 0; i < li.length; i++) {
                
                txtValue = li[i].textContent || li[i].innerText;
                if (txtValue.toUpperCase().indexOf(filter) > -1) {
                    li[i].style.display = "";
                } else {
                    li[i].style.display = "none";
                }
            }
        }
    }
}