class ContextMenu {
    constructor() {
        this.chart = document.querySelector('#muvin')

    }

    getItemMenu() {
        let menu = []
        menu.push({ title: 'Go to source', 
            action: d => { 
                let url = d.link || this.getWasabiLink(d);
                window.open(url) 
            } })

        return menu;
    }

    getNodeMenu() {
        let menu = []

        if (this.chart.data.nodes.length > 1) {
            menu.push({ title: d => this.chart.yAxis.freeze === d ? 'Release highlight' : 'Highlight collaborations', 
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

       
        return menu
    }

    getNetworkMenu(d) {
        let menu = []

        if (this.chart.data.nodes.length > 1)
            menu.push({
                title: 'Remove node',
                action: d => {
                    let focus;
                    if (this.chart.yAxis.focus) {
                        if (this.chart.yAxis.focus === d) {
                            let index = this.chart.data.nodes.indexOf(d)
                            focus = index === 0 ? this.chart.data.nodes[index + 1] : this.chart.data.nodes[index - 1]
                        } else if (this.chart.visibleItems.includes(d)) this.chart.updateVisibleNodes() 
                    }

                    this.chart.data.remove(d, focus)
                } 
            })

        menu.push({
            title: 'Move',
            children: [
                {title: 'Up', 
                action: d => {
                    let index = this.chart.data.nodes.indexOf(d)
                    if (index === 0) return;
                    let indexB = index - 1;
                    this.chart.data.nodes[index] = this.chart.data.nodes[indexB];
                    this.chart.data.nodes[indexB] = d;
                    
                    if (this.chart.yAxis.focus === d) { // if moving the node on focus, change the focus
                        this.chart.yAxis.setDistortion(this.chart.yAxis.focus)
                        this.chart.update(this.chart.data.nodes, this.chart.data.nodes[indexB])
                    } else { // if moving a non-focus node, update the visible nodes and redraw without changing the focus
                        this.chart.updateVisibleNodes() 
                        this.chart.update(this.chart.data.nodes)
                    }
                } }, 
                {title: 'Down', 
                action: d => {
                    let index = this.chart.data.nodes.indexOf(d)
                    if (index === this.chart.data.nodes.length - 1) return;
                    let indexB = index + 1;
                    this.chart.data.nodes[index] = this.chart.data.nodes[indexB];
                    this.chart.data.nodes[indexB] = d;

                    if (this.chart.yAxis.focus === d) { 
                        this.chart.update(this.chart.data.nodes, this.chart.data.nodes[index])
                    } else {
                        this.chart.updateVisibleNodes() 
                        this.chart.update(this.chart.data.nodes)
                    }
                }} ]
        })


        if (this.chart.data.artists[d].collaborators.length) { /// the author has one or more co-authors
            let collab = { title: 'Explore collaborations' }

            collab.children = this.chart.data.artists[d].collaborators.map(e => { 
                return { 
                    title: e.name,
                    action: () => {
                        if (this.chart.data.nodes.includes(e.name)) return
                        this.chart.data.add(e.name)
                    },
                    disabled: !e.enabled
                }; 
            })

            menu.push(collab)
        }

        return menu
    }

    // todo: a function that changes the width and columns of ul.is-children after returning the menu

    rescaleMenu() {
        console.log('rescale')
        console.log(d3.selectAll('ul.is-children'))
        d3.selectAll('ul.is-children')
            .style("width", "auto")
            .style("columns", 5)
    }

    getWasabiLink(d) {
        if (this.data.nodes.includes(d)) return `https://wasabi.i3s.unice.fr/#/search/artist/${d}` 

        return `https://wasabi.i3s.unice.fr/#/search/artist/${d.data.parent ? d.data.parent.artist.name : d.data.artist.name}/album/${d.data.parent ? d.data.parent.name : d.data.name}${d.data.parant ? '/song/' + d.data.name : '#'}`
    }
}