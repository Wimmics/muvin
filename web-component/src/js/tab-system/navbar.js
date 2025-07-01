import ViewSettings from './view-settings.js';
import Search from './search.js';
import TimeSlider from './time-slider.js';
import Legend from './legend.js';
import InfoPanel from './info.js';

class NavBar {
    constructor() {
        this.chart = document.querySelector('vis-muvin')
    }

    set() {
        this.setInteractors()

        this.legend = new Legend(this.chart) // color legend for links (different types) and items (nodes of the second level of the network)
        this.legend.init()

        this.timeSlider = new TimeSlider(this.chart)

        this.viewSettings = new ViewSettings(this.chart)
        this.viewSettings.set()

        this.searchBar = new Search(this.chart)
        this.searchBar.set()

        this.infoPanel = new InfoPanel(this.chart)
    }

    update() {
        this.searchBar.update()
        this.timeSlider.update()
        this.legend.update()
        this.infoPanel.update()
        this.viewSettings.toggleDisplayItems(this.chart.drawItems())
    }

    setInteractors() {
        const buttons = this.chart.shadowRoot.querySelectorAll('.tab-buttons button');
        const contents = this.chart.shadowRoot.querySelectorAll('.tab-content');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Deactivate all buttons and contents
                buttons.forEach(b => b.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                // Activate current
                btn.classList.add('active');
                this.chart.shadowRoot.getElementById(btn.dataset.tab).classList.add('active');
            });
        });
    }
}

export default NavBar