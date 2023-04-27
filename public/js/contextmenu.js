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

        if (this.chart.data.getNodesKeys().length > 1) {
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


        let collaborators = this.chart.data.artists[d].collaborators
        console.log(d, collaborators.filter(e => e.enabled).length, "collaborators")
        if (collaborators.length) { /// the author has one or more co-authors
            let collab = { title: 'Explore collaborations' }

            collab.children = collaborators.map(e => { 
                return { 
                    title: `${e.value} ${e.type ? '(' + e.type + ')' : ''}`,
                    action: () => {
                        if (keys.includes(e.key)) return
                        this.chart.data.add(e)
                    },
                    disabled: !e.enabled
                }; 
            })

            collab.children.splice(0, 0, {
                title: 'All',
                action: async () => {
                    for (let e of collaborators)
                        if (e.enabled) 
                            await this.chart.data.add(e) 
                }
            })

            collab.children.splice(1, 0, {
                title: 'First 25 collaborators',
                action: async () => {
                    for (let i = 0; i < 25; i++) 
                        if (collaborators[i].enabled) 
                            await this.chart.data.add(collaborators[i])
                    
                }
            })

            menu.push(collab)
        }

        return menu
    }

    getWasabiLink(d) {
        if (this.data.nodes.includes(d)) return `https://wasabi.i3s.unice.fr/#/search/artist/${d}` 

        return `https://wasabi.i3s.unice.fr/#/search/artist/${d.data.parent ? d.data.parent.artist.name : d.data.artist.name}/album/${d.data.parent ? d.data.parent.name : d.data.name}${d.data.parant ? '/song/' + d.data.name : '#'}`
    }
}