import loadingIcon from '../images/loading.svg'
import closeIcon from '../images/close.svg'

const template = document.createElement("template");

template.innerHTML = `
<div class='d3-context-menu'></div>
<div class='loading' id='div-loading'></div>
<div class='tooltip' id='cluster-tooltip'></div>
<div class='tooltip' id='item-tooltip'></div>
<div class='tooltip' id='node-tooltip'></div>
<div class='tooltip' id='profile-tooltip'></div>


<div class="vis">

    <div class="toolbar">
        <!-- Tab Buttons -->
        <div class="tab-buttons">
            <button data-tab="legend" class="active">Legend</button>
            <button data-tab="filters">Filters</button>
            <button data-tab="search">Search</button>
            <button data-tab="view">View</button>
            <button data-tab="info">Info</button>
        </div>

        <!-- Tab Content Area -->
        <div class="tab-content-area">

            <!-- Legend Tab -->
            <div id="legend" class="tab-content active">
                <div class='legend'></div>
            </div>

            <!-- Filters Tab -->
            <div id="filters" class="tab-content">
                <div class='timePeriod'>
                    <label>Time</label>
                    <label class='time-info' id='from-label'>0</label>

                    <div class="slider-wrapper">
                        <div class="multi-range">
                            <input type="range" min="0" max="50" value="5" id="lower">
                            <input type="range" min="0" max="50" value="45" id="upper">
                        </div>

                        <span id="lower-value" class="slider-value">5</span>
                        <span id="upper-value" class="slider-value">45</span>
                    </div>

                    <label class='time-info' id='to-label'>50</label>
                </div>
            </div>

            <!-- Search Tab -->
            <div id="search" class="tab-content">
                <div class="search-row">
                    <label>Search for</label>
                    <datalist id='items-list'></datalist>
                    <input class='search' type='text' id='ul-search' placeholder='Type here...' list='items-list'>
                    <button id='items-input-clear' type='button'>Clear</button>
                </div>
                <ul class='values' id='ul-multi'></ul>
            </div>

            <!-- View Tab -->
            <div id="view" class="tab-content">
                <div class="view-options">
                    <div>
                        <input type="checkbox" id="display-items" style="transform: scale(0.8); margin-left: 10px;">
                        <label id="display-items">Display Items</label>
                    </div>
                </div>
            </div>

            <!-- Info Tab -->
            <div id="info" class="tab-content"></div>
        </div>
    </div>

    <div id="loading">  
        <img width="70px" height="70px" src="../assets/${loadingIcon}"></img>
        <p>Loading data...</p>
    </div>

    <div class='import-form'>
        <div id='topbar'>
            <label id='title'></label>
            <image src="../assets/${closeIcon}"></image>
        </div>
        <div>
            <label>Sort by</label>
            <select class='sort'></select>
        </div>
        <div>
            <label>Search for</label>
            <input class='search' type='text' id='ul-search' placeholder='Enter value here'></input>
        </div>
        <ul class='values' id='ul-multi'></ul>

        <button type='button'>Submit</button>
    </div>

   

    <div class='timeline'>

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

                <g id='nodeLinks-group'> </g>

            </g>
        </svg>
    </div>

    
</div>`

export default template;