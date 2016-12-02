import React, { Component } from 'react';
import { render }  from 'react-dom';
import GridUnit from './GridUnit'

class Grid extends Component {
    constructor(props) {
        super(props);
    }

    // helper method that renders the given array of objects to the canvas element
    renderObjectsToCanvas(objects){
        let index = 0;

        objects.map(obj => {
            objects[index].render();

            index++;
        });
    }

    initialiseGridUnits() {
        const {gridSize, gridOffsetX} = this.props.grid;
        const {context, mapData} = this.props;

        let xpos = this.props.grid.gridOffsetX;
        let ypos = this.props.grid.gridOffsetY;
        let gridUnits = [];

        mapData[0].map((row) => {
            row.map((key) => {
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

        return gridUnits;
    }

    render() {
        // instantiate the gridUnit objects and push them to gridUnits array
        let gridUnits = this.initialiseGridUnits();

        // render the gridUnit objects inside the gridUnits array to the canvas element
        this.renderObjectsToCanvas(gridUnits);
    }
}

export default Grid;
