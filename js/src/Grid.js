import React, { PropTypes, Component } from 'react';
import { render }  from 'react-dom';
import GridUnit from './GridUnit'

// todo: put in own folder with gridunit

class Grid extends Component {
    constructor(props) {
        super(props);
    }

    renderObjects(items){
        let index = 0;

        items.map(item => {
            // creating grid: rendering a single gridunit to canvas (you should see this 476 times)
            items[index].render(this.state);

            index++;
        });
    }

    render() {
        // todo: extract to separate method
        const {gridSize, gridOffsetX} = this.props.grid;
        const {context, mapData} = this.props;

        let xpos = this.props.grid.gridOffsetX;
        let ypos = this.props.grid.gridOffsetY;
        let gridUnits = this.props.gridUnits;

        mapData[0].map((row) => {
            row.map((key) => {
                // todo: hand over props likewise to Grid instantiation in Game.js
                let square = new GridUnit({
                    xpos: xpos,
                    ypos: ypos,
                    context: context,
                    fillColour: (key == 1 ? '#666' : '#fff'),
                    gridSize: gridSize
                });
                gridUnits.push(square);
                xpos += gridSize;
            });
            ypos += gridSize;
            xpos = gridOffsetX;
        });

        // render the array of grid units to the canvas object
        this.renderObjects(gridUnits);
    }

}

export default Grid;
