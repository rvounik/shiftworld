import React, { Component } from 'react';
import { render }  from 'react-dom';
import GridUnit from './GridUnit'

class Grid extends Component {
    constructor(props) {
        super(props);
    }

    renderObjects(items){
        let index = 0;

        items.map(item => {
            items[index].render(this.state);

            index++;
        });
    }

    render() {
        if (this.debug){console.log('creating grid')};
        
        let { xpos, ypos } = this.props;
        const { context, gridSize, mapData, gridOffsetX, gridUnits } = this.props;

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

        // render grid units
        this.renderObjects(gridUnits);
    }
}

export default Grid;
