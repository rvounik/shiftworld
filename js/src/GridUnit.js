import React, { Component } from 'react';
import { render }  from 'react-dom';

class GridUnit extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { context, xpos, ypos, fillColour, gridSize } = this.props;
        context.beginPath();
        context.rect(xpos, ypos, gridSize, gridSize);
        context.fillStyle = fillColour;
        context.strokeStyle = '#000';
        context.lineWidth = '0.1';
        context.fill();
        context.stroke();
    }
}

export default GridUnit;
